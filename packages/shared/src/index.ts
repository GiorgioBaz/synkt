// User types
export interface User {
  _id: string;
  email: string;
  name: string;
  authProvider: 'google' | 'apple';
  authProviderId: string;
  timezone: string;
  googleCalendarRefreshToken?: string;
  appleCalendarEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Calendar availability types
export interface TimeBlock {
  start: Date;
  end: Date;
}

export interface Availability {
  _id: string;
  userId: string;
  date: Date;
  busyBlocks: TimeBlock[];
  lastSyncedAt: Date;
}

// Group types
export interface GroupMember {
  userId: string;
  joinedAt: Date;
  hasConfirmedAvailability: boolean;
}

export interface Vote {
  userId: string;
  vote: 'yes' | 'no' | 'maybe';
}

export interface ProposedTime {
  date: Date;
  startTime: string; // e.g., "18:00"
  availableMembers: string[];
  votes: Vote[];
}

export interface Group {
  _id: string;
  name: string;
  createdBy: string;
  members: GroupMember[];
  maxMembers: number;
  proposedTimes: ProposedTime[];
  createdAt: Date;
  updatedAt: Date;
}

// API Request/Response types
export interface LoginRequest {
  provider: 'google' | 'apple';
  token: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
}

export interface CreateGroupRequest {
  name: string;
  createdBy: string;
  memberIds: string[];
}

export interface SyncCalendarRequest {
  provider: 'google' | 'apple';
  startDate: Date;
  endDate: Date;
}

// Utility functions
/**
 * Format a date to a readable string
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format time to HH:MM format
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Check if two time blocks overlap
 */
export function doTimeBlocksOverlap(
  block1: { start: Date; end: Date },
  block2: { start: Date; end: Date }
): boolean {
  return block1.start < block2.end && block2.start < block1.end;
}

/**
 * Get the start of day for a given date
 */
export function getStartOfDay(date: Date): Date {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
}

/**
 * Get the end of day for a given date
 */
export function getEndOfDay(date: Date): Date {
  const newDate = new Date(date);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
}
