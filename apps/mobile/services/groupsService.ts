import { api } from './api';
import { Group, CreateGroupRequest } from '@synkt/shared';

export const groupsService = {
  /**
   * Get all groups for the current user
   */
  async getUserGroups(userId: string): Promise<Group[]> {
    const response = await api.get(`/groups/user/${userId}`);
    return response.data;
  },

  /**
   * Get a specific group by ID
   */
  async getGroup(groupId: string): Promise<Group> {
    const response = await api.get(`/groups/${groupId}`);
    return response.data;
  },

  /**
   * Create a new group
   */
  async createGroup(data: CreateGroupRequest): Promise<Group> {
    const response = await api.post('/groups', data);
    return response.data;
  },

  /**
   * Calculate best meeting times for a group
   */
  async calculateBestTimes(groupId: string, days: number = 7): Promise<Group> {
    const response = await api.post(`/groups/${groupId}/calculate-times?days=${days}`);
    return response.data;
  },

  /**
   * Vote on a proposed time
   */
  async vote(
    groupId: string,
    userId: string,
    timeIndex: number,
    vote: 'yes' | 'no' | 'maybe'
  ): Promise<Group> {
    const response = await api.post(`/groups/${groupId}/vote`, {
      userId,
      timeIndex,
      vote,
    });
    return response.data;
  },
};
