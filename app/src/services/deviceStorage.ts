import * as SecureStore from 'expo-secure-store';

const DEVICE_ID_KEY = 'safesphere_device_id';
const VOLUNTEER_ID_KEY = 'safesphere_volunteer_id';

// CONTRACT-GAP: G1 - No volunteer login or verification endpoint, and no source for volunteer_id or the volunteer's identity.
// Default fallback volunteer ID used until a verified login system exists.
export const DEFAULT_FALLBACK_VOLUNTEER_ID = 'VOL-142';

/**
 * Returns a stable device_id per install, persisted in SecureStore.
 */
export async function getDeviceId(): Promise<string> {
  try {
    const isAvailable = await SecureStore.isAvailableAsync().catch(() => false);
    if (!isAvailable) {
      return 'DEV-4471';
    }
    const existing = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    if (existing) {
      return existing;
    }
    const newId = `DEV-${Math.floor(1000 + Math.random() * 9000)}`;
    await SecureStore.setItemAsync(DEVICE_ID_KEY, newId);
    return newId;
  } catch {
    // Fallback if secure store fails (e.g. in non-native environments)
    return 'DEV-4471';
  }
}

/**
 * Returns volunteer_id for WebSocket subscription and response events.
 * CONTRACT-GAP: G1: No volunteer login endpoint provided in contract.
 */
export async function getVolunteerId(): Promise<string> {
  try {
    const isAvailable = await SecureStore.isAvailableAsync().catch(() => false);
    if (!isAvailable) {
      return DEFAULT_FALLBACK_VOLUNTEER_ID;
    }
    const existing = await SecureStore.getItemAsync(VOLUNTEER_ID_KEY);
    if (existing) {
      return existing;
    }
    await SecureStore.setItemAsync(VOLUNTEER_ID_KEY, DEFAULT_FALLBACK_VOLUNTEER_ID);
    return DEFAULT_FALLBACK_VOLUNTEER_ID;
  } catch {
    return DEFAULT_FALLBACK_VOLUNTEER_ID;
  }
}

export async function setVolunteerId(volunteerId: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(VOLUNTEER_ID_KEY, volunteerId);
  } catch {
    // ignore
  }
}
