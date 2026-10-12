import { create } from 'zustand';
import * as Haptics from 'expo-haptics';
import {
  SosTriggerEvent,
  TriggerType,
  NetworkQuality,
} from '../services/contract.types';
import { getActiveApiClient } from '../services/apiClient';
import { getDeviceId } from '../services/deviceStorage';
import { getBatteryLevel } from '../services/batteryService';
import { getNetworkQuality } from '../services/networkService';

export type NeedHelpScreenState =
  | 'IDLE'
  | 'CONFIRMING'
  | 'SENDING'
  | 'SENT'
  | 'ERROR';

export interface NeedHelpState {
  screenState: NeedHelpScreenState;
  countdownSeconds: number;
  cannotSpeak: boolean;
  threatNearby: boolean;
  triggerType: TriggerType;
  capsuleId: string | null;
  networkQuality: NetworkQuality | null;
  errorMessage: string | null;

  // Actions
  startManualSos: () => void;
  triggerImmediateSos: (triggerType?: TriggerType) => Promise<void>;
  tickCountdown: () => void;
  setCannotSpeak: (value: boolean) => void;
  setThreatNearby: (value: boolean) => void;
  sendSos: () => Promise<void>;
  resetToIdle: () => void;
  setErrorMessage: (errorMessage: string | null) => void;
}

export const useNeedHelpStore = create<NeedHelpState>((set, get) => ({
  screenState: 'IDLE',
  countdownSeconds: 10,
  cannotSpeak: false,
  threatNearby: false,
  triggerType: 'MANUAL_SOS',
  capsuleId: null,
  networkQuality: null,
  errorMessage: null,

  startManualSos: () => {
    // Single light haptic at start only
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics unavailable on some platforms
    }

    set({
      screenState: 'CONFIRMING',
      countdownSeconds: 10,
      cannotSpeak: false,
      threatNearby: false,
      triggerType: 'MANUAL_SOS',
      errorMessage: null,
    });
  },

  triggerImmediateSos: async (triggerType: TriggerType = 'MANUAL_SOS') => {
    set({
      triggerType,
      countdownSeconds: 0,
    });
    await get().sendSos();
  },

  tickCountdown: () => {
    const { countdownSeconds, screenState } = get();
    if (screenState !== 'CONFIRMING') return;

    if (countdownSeconds <= 1) {
      set({ countdownSeconds: 0 });
      get().sendSos();
    } else {
      set({ countdownSeconds: countdownSeconds - 1 });
    }
  },

  setCannotSpeak: (value: boolean) => {
    set({ cannotSpeak: value });
  },

  setThreatNearby: (value: boolean) => {
    set({ threatNearby: value });
  },

  sendSos: async () => {
    set({ screenState: 'SENDING', errorMessage: null });

    try {
      const deviceId = await getDeviceId();
      const batteryLevel = await getBatteryLevel();
      const netQuality = await getNetworkQuality();

      set({ networkQuality: netQuality });

      if (netQuality === 'OFFLINE') {
        // CONTRACT-GAP G5: No retry policy for failed or OFFLINE sends
        set({
          screenState: 'ERROR',
          errorMessage: 'Device is offline. Network is required to transmit emergency capsule.',
        });
        return;
      }

      const eventPayload: SosTriggerEvent = {
        device_id: deviceId,
        trigger_type: get().triggerType,
        battery_level: batteryLevel,
        network_quality: netQuality,
        cannot_speak: get().cannotSpeak,
        threat_nearby: get().threatNearby,
        timestamp: new Date().toISOString(),
      };

      const client = getActiveApiClient();
      const response = await client.triggerSos(eventPayload);

      set({
        screenState: 'SENT',
        capsuleId: response.capsule_id,
      });
    } catch (err: any) {
      set({
        screenState: 'ERROR',
        errorMessage: err?.message || 'Transmission failed. Verify network connectivity.',
      });
    }
  },

  resetToIdle: () => {
    set({
      screenState: 'IDLE',
      countdownSeconds: 10,
      cannotSpeak: false,
      threatNearby: false,
      triggerType: 'MANUAL_SOS',
      capsuleId: null,
      errorMessage: null,
    });
  },

  setErrorMessage: (errorMessage: string | null) => {
    set({
      errorMessage,
      screenState: errorMessage ? 'ERROR' : 'IDLE',
    });
  },
}));
