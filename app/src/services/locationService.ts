import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { colors } from '../theme/tokens';

export const BACKGROUND_LOCATION_TASK = 'SAFESPHERE_BACKGROUND_LOCATION_TASK';

// Define the background task if TaskManager is available
try {
  if (!TaskManager.isTaskDefined(BACKGROUND_LOCATION_TASK)) {
    TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
      if (error) {
        return;
      }
      if (data) {
        // Location received in background; could buffer or transmit
      }
    });
  }
} catch {
  // TaskManager might be unavailable in unsupported environments
}

export interface LocationState {
  hasPermission: boolean;
  latitude: number | null;
  longitude: number | null;
  pollingIntervalSeconds: number;
}

export async function checkLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      try {
        await Location.requestBackgroundPermissionsAsync();
      } catch {
        // Background permission may be rejected separately
      }
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const perm = await checkLocationPermission();
    if (!perm) return null;
    const locationPromise = Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000));
    const loc = await Promise.race([locationPromise, timeoutPromise]);
    if (!loc) return null;
    return {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    };
  } catch {
    return null;
  }
}

export async function updateBackgroundLocationInterval(intervalSeconds: number): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
    if (isRegistered) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    }
    const hasBg = (await Location.getBackgroundPermissionsAsync()).status === 'granted';
    if (hasBg) {
      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: intervalSeconds * 1000,
        distanceInterval: 10,
        foregroundService: {
          notificationTitle: 'SafeSphere Active',
          notificationBody: 'Emergency orchestration service running',
          notificationColor: colors.bg,
        },
      });
    }
  } catch {
    // Non-fatal if native background service cannot update in this runtime
  }
}
