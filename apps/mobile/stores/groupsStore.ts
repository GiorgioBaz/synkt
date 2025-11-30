import { create } from 'zustand';
import { Group } from '@synkt/shared';

interface GroupsState {
  groups: Group[];
  selectedGroup: Group | null;
  isLoading: boolean;
  
  // Actions
  setGroups: (groups: Group[]) => void;
  addGroup: (group: Group) => void;
  selectGroup: (group: Group | null) => void;
  updateGroup: (groupId: string, updates: Partial<Group>) => void;
}

export const useGroupsStore = create<GroupsState>((set) => ({
  groups: [],
  selectedGroup: null,
  isLoading: false,

  setGroups: (groups) => set({ groups }),
  
  addGroup: (group) => set((state) => ({ groups: [...state.groups, group] })),
  
  selectGroup: (group) => set({ selectedGroup: group }),
  
  updateGroup: (groupId, updates) =>
    set((state) => ({
      groups: state.groups.map((g) =>
        g._id === groupId ? { ...g, ...updates } : g
      ),
    })),
}));
