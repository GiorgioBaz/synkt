import { api } from './api';
import { Availability } from '@synkt/shared';
import * as SecureStore from 'expo-secure-store';

const USER_ID_KEY = 'user_id';

export const calendarService = {
  /**
   * Save user ID to secure storage
   */
  async saveUserId(userId: string): Promise<void> {
    await SecureStore.setItemAsync(USER_ID_KEY, userId);
  },

  /**
   * Get user ID from secure storage
   */
  async getUserId(): Promise<string | null> {
    return SecureStore.getItemAsync(USER_ID_KEY);
  },

  /**
   * Clear user ID from secure storage (logout)
   */
  async clearUserId(): Promise<void> {
    await SecureStore.deleteItemAsync(USER_ID_KEY);
  },

  /**
   * Trigger Google Calendar Sync
   */
  async syncGoogleCalendar(userId: string): Promise<void> {
    await api.post(`/calendar/sync-google?userId=${userId}`);
  },
  /**
   * Get availability for a user within a date range
   */
  async getAvailability(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Availability[]> {
    const response = await api.get(`/calendar/availability/${userId}`, {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });
    return response.data;
  },

  /**
   * Generate mock availability data for testing
   */
  async generateMockData(userId: string, days: number = 7): Promise<Availability[]> {
    const response = await api.post(`/calendar/mock/${userId}?days=${days}`);
    return response.data;
  },

  /**
   * Find best meeting times for multiple users
   */
  async findBestTimes(
    userIds: string[],
    startDate: Date,
    endDate: Date,
    duration: number = 60
  ): Promise<{ date: Date; startTime: string; availableMembers: string[] }[]> {
    const response = await api.get('/calendar/best-times', {
      params: {
        userIds: userIds.join(','),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        duration,
      },
    });
    return response.data;
  },
};
