import { create } from 'zustand';
import * as Battery from 'expo-battery';

interface BatteryState {
  batteryLevel: number; // 0 to 100
  isLowBattery: boolean;
  isSurvivalMode: boolean;
  adaptivePowerMode: boolean;
  lowDataTelemetry: boolean;
  offlineContinuity: boolean;
  estimatedRuntimeMinutes: number;

  initBattery: () => Promise<void>;
  setBatteryLevel: (level: number) => void;
  setSurvivalMode: (active: boolean) => void;
  toggleSurvivalMode: () => void;
  setAdaptivePowerMode: (active: boolean) => void;
  setLowDataTelemetry: (active: boolean) => void;
  setOfflineContinuity: (active: boolean) => void;
}

export const useBatteryStore = create<BatteryState>((set, get) => ({
  batteryLevel: 92, // Default or mock fallback
  isLowBattery: false,
  isSurvivalMode: false,
  adaptivePowerMode: true,
  lowDataTelemetry: true,
  offlineContinuity: true,
  estimatedRuntimeMinutes: 80, // ~1h 20m for low battery

  initBattery: async () => {
    try {
      const level = await Battery.getBatteryLevelAsync();
      if (level >= 0) {
        const pct = Math.round(level * 100);
        set({
          batteryLevel: pct,
          isLowBattery: pct <= 15,
        });
      }
    } catch (_e) {
      // expo-battery not supported on simulator/desktop; use default 92%
    }
  },

  setBatteryLevel: (level: number) =>
    set({
      batteryLevel: level,
      isLowBattery: level <= 15,
    }),

  setSurvivalMode: (active: boolean) => set({ isSurvivalMode: active }),

  toggleSurvivalMode: () => set({ isSurvivalMode: !get().isSurvivalMode }),

  setAdaptivePowerMode: (active: boolean) => set({ adaptivePowerMode: active }),
  setLowDataTelemetry: (active: boolean) => set({ lowDataTelemetry: active }),
  setOfflineContinuity: (active: boolean) => set({ offlineContinuity: active }),
}));
