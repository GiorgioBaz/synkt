import { google } from 'googleapis';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name);

  constructor(private configService: ConfigService) {}

  async getEvents(refreshToken: string, startDate: Date, endDate: Date) {
    const oauth2Client = new google.auth.OAuth2(
      this.configService.get('GOOGLE_CLIENT_ID'),
      this.configService.get('GOOGLE_CLIENT_SECRET'),
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    try {
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      if (!response.data.items) {
        return [];
      }

      const busyBlocks: { start: Date; end: Date }[] = [];

      response.data.items.forEach((event) => {
        if (!event.start || !event.end) return;

        const startStr = event.start.dateTime || event.start.date;
        const endStr = event.end.dateTime || event.end.date;

        if (startStr && endStr) {
          busyBlocks.push({
            start: new Date(startStr),
            end: new Date(endStr),
          });
        }
      });

      return busyBlocks;
    } catch (error) {
      this.logger.error('Error fetching Google Calendar events:', error);
      // Return empty array to handle gracefull failures (e.g. invalid token)
      return [];
    }
  }
}
