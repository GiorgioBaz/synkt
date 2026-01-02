import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Availability,
  AvailabilityDocument,
  TimeBlock,
} from './schemas/availability.schema';
import { UsersService } from '../users/users.service';
import { addDays, addMinutes, isBefore, getDay, format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { getStartOfDay, formatTime } from '@synkt/shared';
import { GoogleCalendarService } from './google-calendar.service';

@Injectable()
export class CalendarService {
  private readonly SYDNEY_TZ = 'Australia/Sydney';

  constructor(
    @InjectModel(Availability.name)
    private availabilityModel: Model<AvailabilityDocument>,
    private usersService: UsersService,
    private googleCalendarService: GoogleCalendarService,
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
   * Sync Google Calendar events for a user
   */
  async syncGoogleCalendar(userId: string): Promise<Availability[]> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.googleCalendarRefreshToken) {
      throw new Error('User not connected to Google Calendar');
    }

    const startDate = getStartOfDay(new Date());
    const endDate = addDays(startDate, 30);

    const busyBlocks = await this.googleCalendarService.getEvents(
      user.googleCalendarRefreshToken,
      startDate,
      endDate,
    );

    const results: Availability[] = [];

    for (let i = 0; i < 30; i++) {
      const date = addDays(startDate, i);
      const dayStart = getStartOfDay(date);
      const dayEnd = addDays(dayStart, 1);

      const daysBlocks = busyBlocks.filter((b) => {
        return b.start < dayEnd && b.end > dayStart;
      });

      const av = await this.saveAvailability(userId, date, daysBlocks);
      results.push(av);
    }

    return results;
  }

  /**
   * Generate mock availability data for testing
   */
  async generateMockAvailability(
    userId: string,
    days: number = 7,
  ): Promise<Availability[]> {
    const today = getStartOfDay(new Date());
    const mockData: Availability[] = [];

    for (let i = 0; i < days; i++) {
      const date = addDays(today, i);
      const busyBlocks: TimeBlock[] = [];

      // Example busy blocks logic (preserved from original)
      if (date.getDay() >= 1 && date.getDay() <= 5 && Math.random() > 0.3) {
        busyBlocks.push({
          start: new Date(date.setHours(8, 0, 0, 0)),
          end: new Date(date.setHours(10, 0, 0, 0)),
        });
      }
      if (date.getDay() >= 1 && date.getDay() <= 5) {
        busyBlocks.push({
          start: new Date(date.setHours(12, 0, 0, 0)),
          end: new Date(date.setHours(13, 0, 0, 0)),
        });
      }
      if (Math.random() > 0.5) {
        busyBlocks.push({
          start: new Date(date.setHours(14, 0, 0, 0)),
          end: new Date(date.setHours(15, 0, 0, 0)),
        });
      }
      if (Math.random() > 0.7) {
        busyBlocks.push({
          start: new Date(date.setHours(19, 0, 0, 0)),
          end: new Date(date.setHours(21, 0, 0, 0)),
        });
      }

      const availability = await this.saveAvailability(
        userId,
        date,
        busyBlocks,
      );
      mockData.push(availability);
    }

    return mockData;
  }

  /**
   * Find best meeting times for a group of users
   * "Bulletproof" Algorithm with Social Considerations
   */
  async findBestTimes(
    userIds: string[],
    startDate: Date,
    endDate: Date,
    durationMinutes: number = 60,
  ): Promise<
    {
      date: Date;
      startTime: string;
      availableMembers: string[];
      score: number;
    }[]
  > {
    const users = await Promise.all(
      userIds.map((id) => this.usersService.findById(id)),
    );
    const validUsers = users.filter((u) => !!u);
    const validUserIds = validUsers.map((u) => (u as any)._id.toString());

    // 1. Input Normalization
    const now = new Date();
    // Minimum Notice: 24 Hours from now
    const minStart = addDays(now, 1);
    const actualStart = isBefore(startDate, minStart) ? minStart : startDate;

    // Max Lookahead: 60 Days
    const maxEnd = addDays(now, 60);
    const actualEnd = isBefore(endDate, maxEnd) ? endDate : maxEnd;

    // Fetch Availabilities
    const availabilitiesList = await Promise.all(
      validUserIds.map((id) =>
        this.getAvailability(id, actualStart, actualEnd),
      ),
    );

    const bestTimes: {
      date: Date;
      startTime: string;
      availableMembers: string[];
      score: number;
    }[] = [];

    // 2. Slot Generation (15-minute intervals)
    let current = new Date(actualStart);
    // Align to next 15 min mark
    const remainder = current.getMinutes() % 15;
    if (remainder !== 0) {
      current = addMinutes(current, 15 - remainder);
    }
    // Ensure seconds/ms are 0
    current.setSeconds(0, 0);

    while (isBefore(current, actualEnd)) {
      const slotStart = new Date(current);
      const slotEnd = addMinutes(current, durationMinutes);

      // Convert to Sydney Time for rules
      const sydneyTime = toZonedTime(slotStart, this.SYDNEY_TZ);
      const sydneyHour = sydneyTime.getHours();

      // Rule: Global Sleep Guard (12am - 5am Sydney Time)
      if (sydneyHour >= 0 && sydneyHour < 5) {
        current = addMinutes(current, 15);
        continue;
      }

      const availableMembers: string[] = [];

      // 3. User Constraints
      for (let i = 0; i < validUsers.length; i++) {
        const user = validUsers[i];
        const userId = (user as any)._id.toString();
        const userAvailabilities = availabilitiesList[i];

        // 3a. Work Hours Check (Work = Busy)
        // Default: 9am - 5pm (17:00)
        const workStart = user.workStartHour ?? 9;
        const workEnd = user.workEndHour ?? 17;

        // If slot falls within work hours, User is BUSY
        // Simple range check for intra-day work hours
        // (Assuming work hours don't span midnight for MVP)
        if (sydneyHour >= workStart && sydneyHour < workEnd) {
          continue; // User is busy working
        }

        // 3b. Calendar Busy Blocks Check
        // Find availability doc for this day
        // usage of getStartOfDay from shared/date-fns might generally map to UTC or Local dates.
        // The Availability schemas store dates. We iterate checking overlap.
        const dayAvail = userAvailabilities.find((a) => {
          // Basic day checking - comparing timestamps roughly or strict date objects?
          // The saveAvailability normalizes to getStartOfDay(date).
          // So we should compare getStartOfDay(slotStart)
          return (
            getStartOfDay(a.date).getTime() ===
            getStartOfDay(slotStart).getTime()
          );
        });

        if (!dayAvail) {
          // If no data, assume FREE (or could assume BUSY if strict)
          // Usually assume free if no busy blocks synced
          availableMembers.push(userId);
          continue;
        }

        // Check overlap with busyBlocks
        const isBlocked = dayAvail.busyBlocks.some((block) => {
          return slotStart < block.end && slotEnd > block.start;
        });

        if (!isBlocked) {
          availableMembers.push(userId);
        }
      }

      // 4. Scoring & Filtering
      // Filter: Quorum (Must have at least 50% attendance)
      if (availableMembers.length < validUsers.length * 0.5) {
        current = addMinutes(current, 15);
        continue;
      }

      let score = 0;

      // Tier 1: 100% Overlap (Critically important)
      if (availableMembers.length === validUsers.length) {
        score += 1000;
      }

      // Tier 2: High Quality Time (Fri/Sat 6pm - 10pm Sydney Time)
      const sydneyDay = getDay(sydneyTime); // 0=Sun, 5=Fri, 6=Sat
      const isWeekendEvening =
        (sydneyDay === 5 || sydneyDay === 6) &&
        sydneyHour >= 18 &&
        sydneyHour < 22;

      if (isWeekendEvening) {
        score += 500;
      }

      // Tier 3: Attendance Count
      score += availableMembers.length * 10;

      bestTimes.push({
        date: slotStart,
        startTime: format(slotStart, 'HH:mm'), // Return e.g. "19:30"
        availableMembers,
        score,
      });

      // Advance
      current = addMinutes(current, 15);
    }

    // Sort Descending by Score
    return bestTimes.sort((a, b) => b.score - a.score);
  }
}
