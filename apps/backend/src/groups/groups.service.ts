import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Group, GroupDocument } from './schemas/group.schema';
import { CalendarService } from '../calendar/calendar.service';

@Injectable()
export class GroupsService {
  constructor(
    @InjectModel(Group.name) private groupModel: Model<GroupDocument>,
    private calendarService: CalendarService,
  ) {}

  async create(name: string, createdBy: string, memberIds: string[]): Promise<Group> {
    const members = memberIds.map(userId => ({
      userId: new Types.ObjectId(userId),
      joinedAt: new Date(),
      hasConfirmedAvailability: false,
    }));

    const group = new this.groupModel({
      name,
      createdBy: new Types.ObjectId(createdBy),
      members,
    });

    return group.save();
  }

  async findById(id: string): Promise<Group | null> {
    return this.groupModel.findById(id).populate('members.userId').populate('createdBy').exec();
  }

  async findByUserId(userId: string): Promise<Group[]> {
    return this.groupModel
      .find({
        $or: [
          { createdBy: new Types.ObjectId(userId) },
          { 'members.userId': new Types.ObjectId(userId) },
        ],
      })
      .populate('members.userId')
      .populate('createdBy')
      .exec();
  }

  async addMember(groupId: string, userId: string): Promise<Group | null> {
    return this.groupModel
      .findByIdAndUpdate(
        groupId,
        {
          $push: {
            members: {
              userId: new Types.ObjectId(userId),
              joinedAt: new Date(),
              hasConfirmedAvailability: false,
            },
          },
        },
        { new: true },
      )
      .exec();
  }

  async calculateBestTimes(groupId: string, days: number = 7): Promise<Group | null> {
    const group = await this.findById(groupId);
    if (!group) return null;

    const memberIds = group.members.map(m => m.userId.toString());
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const bestTimes = await this.calendarService.findBestTimes(memberIds, startDate, endDate);

    // Convert to ProposedTime format and update group
    const proposedTimes = bestTimes.slice(0, 5).map(time => ({
      date: time.date,
      startTime: time.startTime,
      availableMembers: time.availableMembers.map(id => new Types.ObjectId(id)),
      votes: [],
    }));

    return this.groupModel
      .findByIdAndUpdate(groupId, { proposedTimes }, { new: true })
      .populate('members.userId')
      .populate('createdBy')
      .exec();
  }

  async vote(groupId: string, userId: string, timeIndex: number, vote: 'yes' | 'no' | 'maybe'): Promise<Group | null> {
    const group = await this.findById(groupId);
    if (!group || !group.proposedTimes[timeIndex]) return null;

    // Remove existing vote from this user for this time
    group.proposedTimes[timeIndex].votes = group.proposedTimes[timeIndex].votes.filter(
      v => v.userId.toString() !== userId,
    );

    // Add new vote
    group.proposedTimes[timeIndex].votes.push({
      userId: new Types.ObjectId(userId),
      vote,
    });

    return this.groupModel
      .findByIdAndUpdate(groupId, { proposedTimes: group.proposedTimes }, { new: true })
      .populate('members.userId')
      .populate('createdBy')
      .exec();
  }
}
