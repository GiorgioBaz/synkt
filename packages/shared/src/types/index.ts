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
  memberEmails: string[];
}

export interface SyncCalendarRequest {
  provider: 'google' | 'apple';
  startDate: Date;
  endDate: Date;
}
