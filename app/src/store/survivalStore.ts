import { create } from 'zustand';
import * as Battery from 'expo-battery';
import { getBatteryLevel } from '../services/batteryService';
import { updateBackgroundLocationInterval } from '../services/locationService';
import {
  BatterySettings,
  DEFAULT_BATTERY_SETTINGS,
  loadBatterySettings,
  saveBatterySettings,
  evaluateTier,
  TierEvaluation,
  ComputedTier,
} from '../services/batterySettingsService';

export interface SurvivalState {
  batteryLevel: number;
  simulatedBatteryLevel: number | null;
  tier: ComputedTier;
  tierName: string;
  gpsIntervalSeconds: number;
  uiTheme: 'Standard' | 'Pitch Black';
  evidenceCapture: string;
  isPitchBlack: boolean;
  isServiceActive: boolean;
  batterySettings: BatterySettings;

  // Actions
  initializeSurvivalEngine: () => Promise<void>;
  updateBattery: (level: number) => Promise<void>;
  simulateBatteryLevel: (level: number | null) => Promise<void>;
  updateBatterySettings: (newSettings: BatterySettings) => Promise<void>;
  resetBatterySettingsToDefault: () => Promise<void>;
  cleanupSurvivalEngine: () => void;
}

let batterySubscription: Battery.Subscription | null = null;

export const useSurvivalStore = create<SurvivalState>((set, get) => ({
  batteryLevel: 100,
  simulatedBatteryLevel: null,
  tier: 'OPTIMAL',
  tierName: 'Normal',
  gpsIntervalSeconds: 5,
  uiTheme: 'Standard',
  evidenceCapture: 'High-Res Video + Audio',
  isPitchBlack: false,
  isServiceActive: false,
  batterySettings: DEFAULT_BATTERY_SETTINGS,

  initializeSurvivalEngine: async () => {
    try {
      const settings = await loadBatterySettings();
      set({ batterySettings: settings });

      const realLevel = await getBatteryLevel();
      await get().updateBattery(realLevel);

      // Listen for battery level changes continuously
      try {
        const isAvailable = await Battery.isAvailableAsync().catch(() => false);
        if (isAvailable && !batterySubscription) {
          batterySubscription = Battery.addBatteryLevelListener(({ batteryLevel }) => {
            const currentSim = get().simulatedBatteryLevel;
            if (currentSim === null && typeof batteryLevel === 'number' && batteryLevel >= 0) {
              const pct = Math.round(batteryLevel * 100);
              get().updateBattery(pct);
            }
          });
        }
      } catch {
        // Battery listener not available on web/simulator
      }

      set({ isServiceActive: true });
    } catch {
      // Fallback
    }
  },

  updateBattery: async (level: number) => {
    const clamped = Math.min(100, Math.max(0, level));
    const settings = get().batterySettings || DEFAULT_BATTERY_SETTINGS;
    const evaluation: TierEvaluation = evaluateTier(clamped, settings);

    set({
      batteryLevel: clamped,
      tier: evaluation.tier,
      tierName: evaluation.tierName,
      gpsIntervalSeconds: evaluation.gpsIntervalSeconds,
      uiTheme: evaluation.isPitchBlack ? 'Pitch Black' : 'Standard',
      evidenceCapture: evaluation.evidenceCapture,
      isPitchBlack: evaluation.isPitchBlack,
    });

    // Dynamically adjust background location polling interval
    await updateBackgroundLocationInterval(evaluation.gpsIntervalSeconds);
  },

  simulateBatteryLevel: async (level: number | null) => {
    set({ simulatedBatteryLevel: level });
    if (level !== null) {
      await get().updateBattery(level);
    } else {
      const realLevel = await getBatteryLevel();
      await get().updateBattery(realLevel);
    }
  },

  updateBatterySettings: async (newSettings: BatterySettings) => {
    const saved = await saveBatterySettings(newSettings);
    set({ batterySettings: saved });
    // Re-evaluate current tier under new settings immediately
    const currentLevel = get().batteryLevel;
    await get().updateBattery(currentLevel);
  },

  resetBatterySettingsToDefault: async () => {
    const saved = await saveBatterySettings(DEFAULT_BATTERY_SETTINGS);
    set({ batterySettings: saved });
    const currentLevel = get().batteryLevel;
    await get().updateBattery(currentLevel);
  },

  cleanupSurvivalEngine: () => {
    if (batterySubscription) {
      try {
        batterySubscription.remove();
      } catch {}
      batterySubscription = null;
    }
    set({ isServiceActive: false });
  },
}));
