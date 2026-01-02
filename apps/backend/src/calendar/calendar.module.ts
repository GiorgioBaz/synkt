import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import {
  Availability,
  AvailabilitySchema,
} from './schemas/availability.schema';
import { CalendarService } from './calendar.service';
import { CalendarController } from './calendar.controller';
import { GoogleCalendarService } from './google-calendar.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Availability.name, schema: AvailabilitySchema },
    ]),
    UsersModule,
    ConfigModule,
  ],
  controllers: [CalendarController],
  providers: [CalendarService, GoogleCalendarService],
  exports: [CalendarService, GoogleCalendarService],
})
export class CalendarModule {}
