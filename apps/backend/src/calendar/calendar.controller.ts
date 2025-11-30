import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CalendarService } from './calendar.service';

@ApiTags('calendar')
@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get('availability/:userId')
  @ApiOperation({ summary: 'Get user availability for a date range' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  async getAvailability(
    @Param('userId') userId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.calendarService.getAvailability(
      userId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Post('mock/:userId')
  @ApiOperation({ summary: 'Generate mock availability data for testing' })
  @ApiQuery({ name: 'days', required: false })
  async generateMockData(@Param('userId') userId: string, @Query('days') days?: string) {
    const numDays = days ? parseInt(days, 10) : 7;
    return this.calendarService.generateMockAvailability(userId, numDays);
  }

  @Get('best-times')
  @ApiOperation({ summary: 'Find best meeting times for multiple users' })
  @ApiQuery({ name: 'userIds', required: true, description: 'Comma-separated user IDs' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  @ApiQuery({ name: 'duration', required: false, description: 'Duration in minutes' })
  async findBestTimes(
    @Query('userIds') userIds: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('duration') duration?: number,
  ) {
    const userIdArray = userIds.split(',');
    return this.calendarService.findBestTimes(
      userIdArray,
      new Date(startDate),
      new Date(endDate),
      duration || 60,
    );
  }
}
