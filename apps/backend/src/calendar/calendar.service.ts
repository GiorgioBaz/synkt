import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Availability, AvailabilityDocument, TimeBlock } from './schemas/availability.schema';
import { addDays, getStartOfDay } from '@synkt/shared';

@Injectable()
export class CalendarService {
  constructor(
    @InjectModel(Availability.name) private availabilityModel: Model<AvailabilityDocument>,
  ) {}

  /**
   * Get availability for a user within a date range
   */
  async getAvailability(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Availability[]> {
    return this.availabilityModel
      .find({
        userId: new Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate },
      })
      .exec();
  }

  /**
   * Save or update availability for a specific date
   */
  async saveAvailability(
    userId: string,
    date: Date,
    busyBlocks: TimeBlock[],
  ): Promise<Availability> {
    const normalizedDate = getStartOfDay(date);

    return this.availabilityModel
      .findOneAndUpdate(
        { userId: new Types.ObjectId(userId), date: normalizedDate },
        {
          busyBlocks,
          lastSyncedAt: new Date(),
        },
        { upsert: true, new: true },
      )
      .exec();
  }

  /**
   * Generate mock availability data for testing
   * This simulates a user with some busy blocks
   */
  async generateMockAvailability(userId: string, days: number = 7): Promise<Availability[]> {
    const today = getStartOfDay(new Date());
    const mockData: Availability[] = [];

    for (let i = 0; i < days; i++) {
      const date = addDays(today, i);

      // Generate random busy blocks (simulating meetings)
      const busyBlocks: TimeBlock[] = [];

      // Morning meeting (9-10am) on weekdays
      if (date.getDay() >= 1 && date.getDay() <= 5 && Math.random() > 0.3) {
        busyBlocks.push({
          start: new Date(date.setHours(9, 0, 0, 0)),
          end: new Date(date.setHours(10, 0, 0, 0)),
        });
      }

      // Lunch (12-1pm) on weekdays
      if (date.getDay() >= 1 && date.getDay() <= 5) {
        busyBlocks.push({
          start: new Date(date.setHours(12, 0, 0, 0)),
          end: new Date(date.setHours(13, 0, 0, 0)),
        });
      }

      // Afternoon meeting (2-3pm) on some days
      if (Math.random() > 0.5) {
        busyBlocks.push({
          start: new Date(date.setHours(14, 0, 0, 0)),
          end: new Date(date.setHours(15, 0, 0, 0)),
        });
      }

      const availability = await this.saveAvailability(userId, date, busyBlocks);
      mockData.push(availability);
    }

    return mockData;
  }

  /**
   * Find best meeting times for a group of users
   * Returns times when all users are free
   */
  async findBestTimes(
    userIds: string[],
    startDate: Date,
    endDate: Date,
    durationMinutes: number = 60,
  ): Promise<{ date: Date; startTime: string; availableMembers: string[] }[]> {
    // Get availability for all users
    const availabilities = await Promise.all(
      userIds.map(userId => this.getAvailability(userId, startDate, endDate)),
    );

    const bestTimes: { date: Date; startTime: string; availableMembers: string[] }[] = [];

    // For each day in the range
    let currentDate = getStartOfDay(startDate);
    while (currentDate <= endDate) {
      // Check common free times (9am-6pm in 1-hour slots)
      for (let hour = 9; hour < 18; hour++) {
        const slotStart = new Date(currentDate);
        slotStart.setHours(hour, 0, 0, 0);
        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes);

        const availableMembers: string[] = [];

        // Check if this slot is free for each user
        userIds.forEach((userId, index) => {
          const userAvailability = availabilities[index].find(
            a => getStartOfDay(a.date).getTime() === currentDate.getTime(),
          );

          if (!userAvailability) {
            availableMembers.push(userId);
            return;
          }

          // Check if slot overlaps with any busy block
          const isBlocked = userAvailability.busyBlocks.some(block => {
            return slotStart < block.end && slotEnd > block.start;
          });

          if (!isBlocked) {
            availableMembers.push(userId);
          }
        });

        // If all or most users are available, add to best times
        if (availableMembers.length >= userIds.length * 0.5) {
          // At least 50% available
          bestTimes.push({
            date: new Date(currentDate),
            startTime: `${hour.toString().padStart(2, '0')}:00`,
            availableMembers,
          });
        }
      }

      currentDate = addDays(currentDate, 1);
    }

    // Sort by number of available members (descending)
    return bestTimes.sort((a, b) => b.availableMembers.length - a.availableMembers.length);
  }
}
