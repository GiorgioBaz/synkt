import { create } from 'zustand';
import { Availability } from '@synkt/shared';

interface CalendarState {
  availability: Availability[];
  isLoading: boolean;
  lastSynced: Date | null;
  
  // Actions
  setAvailability: (availability: Availability[]) => void;
  updateLastSynced: () => void;
  clearAvailability: () => void;
}

export const useCalendarStore = create<CalendarState>((set) => ({
  availability: [],
  isLoading: false,
  lastSynced: null,

  setAvailability: (availability) => set({ availability }),
  
  updateLastSynced: () => set({ lastSynced: new Date() }),
  
  clearAvailability: () => set({ availability: [], lastSynced: null }),
}));
