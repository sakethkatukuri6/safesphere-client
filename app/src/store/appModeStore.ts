import { create } from 'zustand';
import { AppMode } from '../components/SegmentedToggle';

// ASSUMPTION A2: App opens in 'Need Help' by default
export const DEFAULT_APP_MODE: AppMode = 'Need Help';

export interface AppModeState {
  currentMode: AppMode;
  setMode: (mode: AppMode) => void;
}

export const useAppModeStore = create<AppModeState>((set) => ({
  currentMode: DEFAULT_APP_MODE,
  setMode: (mode: AppMode) => {
    // Mode is a UI state only, never a permissions boundary.
    // Switching modes does not alter any data models or leak fields between modes.
    set({ currentMode: mode });
  },
}));
