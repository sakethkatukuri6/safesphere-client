// CONTRACT-GAP: G8 - SosTriggerEvent wire payload has no recipients field. Intended notification targets are stored locally and prepared for future backend recipient routing.
import * as SecureStore from 'expo-secure-store';

export interface NotifyChipsState {
  emergencyContacts: boolean;
  volunteers: boolean;
  emergency112: boolean;
}

const STORAGE_KEY = 'safesphere_notify_chips_v1';

const DEFAULT_STATE: NotifyChipsState = {
  emergencyContacts: true,
  volunteers: true,
  emergency112: true,
};

export const notifyChipsService = {
  async getNotifyChips(): Promise<NotifyChipsState> {
    try {
      const data = await SecureStore.getItemAsync(STORAGE_KEY);
      if (!data) {
        await this.saveNotifyChips(DEFAULT_STATE);
        return DEFAULT_STATE;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_STATE;
    }
  },

  async saveNotifyChips(state: NotifyChipsState): Promise<void> {
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage error ignored
    }
  },
};
