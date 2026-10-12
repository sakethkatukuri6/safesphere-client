import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { colors } from '../theme/tokens';

// Safe reference for expo-notifications
let Notifications: typeof import('expo-notifications') | null = null;

// Expo SDK 53+ removed remote notifications from Expo Go on Android.
// In development builds (the target stack), full notification functionality is enabled.
const isExpoGoOnAndroid =
  Platform.OS === 'android' &&
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

if (!isExpoGoOnAndroid) {
  try {
    Notifications = require('expo-notifications');
    if (Notifications && Notifications.setNotificationHandler) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldPresentAlert: true,
          shouldShowList: true,
        }),
      });
    }
  } catch {
    Notifications = null;
  }
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Notifications) {
    return false;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('safesphere-incidents', {
        name: 'SafeSphere Incidents',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: colors.accent,
      });
    }

    return true;
  } catch {
    return false;
  }
}

export async function notifyIncomingIncident(victimName: string): Promise<void> {
  if (!Notifications) {
    return;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Emergency incident nearby',
        body: `Dispatch request received for ${victimName}.`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: null, // Send immediately
    });
  } catch {
    // Notifications may fail in simulator/web/Expo Go
  }
}
