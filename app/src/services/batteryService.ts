import * as Battery from 'expo-battery';

export type SurvivalTier = 'OPTIMAL' | 'CONSERVE' | 'PITCH_BLACK';

export interface BatteryStatus {
  level: number; // 0 - 100
  isAvailable: boolean;
  tier: SurvivalTier;
}

export function getSurvivalTier(batteryLevel: number): SurvivalTier {
  if (batteryLevel > 50) {
    return 'OPTIMAL';
  } else if (batteryLevel > 15) {
    return 'CONSERVE';
  } else {
    return 'PITCH_BLACK';
  }
}

export async function getBatteryLevel(): Promise<number> {
  try {
    const isAvailable = await Battery.isAvailableAsync().catch(() => false);
    if (!isAvailable) {
      return 100;
    }
    const level = await Battery.getBatteryLevelAsync();
    if (level < 0 || isNaN(level)) {
      // Unknown or simulator value fallback
      return 100;
    }
    return Math.round(level * 100);
  } catch {
    return 100;
  }
}

export async function getBatteryStatus(): Promise<BatteryStatus> {
  const level = await getBatteryLevel();
  return {
    level,
    isAvailable: true,
    tier: getSurvivalTier(level),
  };
}
