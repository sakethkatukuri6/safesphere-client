import * as SecureStore from 'expo-secure-store';
import {
  BatterySettings,
  DEFAULT_BATTERY_SETTINGS,
  SETTINGS_STORAGE_KEY,
  enforceBatteryGuardRails,
} from './batterySettingsLogic';

export * from './batterySettingsLogic';

/**
 * Loads battery settings directly from SecureStore.
 */
export async function loadBatterySettings(): Promise<BatterySettings> {
  try {
    const raw = await SecureStore.getItemAsync(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === 1) {
        return enforceBatteryGuardRails(parsed);
      }
    }
  } catch {
    // Return default on read error
  }
  return { ...DEFAULT_BATTERY_SETTINGS };
}

/**
 * Persists settings immediately after applying guard rails.
 */
export async function saveBatterySettings(
  settings: BatterySettings
): Promise<BatterySettings> {
  const safe = enforceBatteryGuardRails(settings);
  try {
    await SecureStore.setItemAsync(SETTINGS_STORAGE_KEY, JSON.stringify(safe));
  } catch {
    // Storage write failed
  }
  return safe;
}
