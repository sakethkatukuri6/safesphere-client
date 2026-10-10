// CONTRACT-GAP: G10 - Profile editing is local-only; CitizenAppContract.md defines victim_* fields inside SosTriggerEvent but has no user registration/profile endpoint.
import * as SecureStore from 'expo-secure-store';

export interface UserProfile {
  victim_name: string;
  victim_age: number;
  victim_gender: string;
}

const STORAGE_KEY = 'safesphere_user_profile_v1';

const DEFAULT_PROFILE: UserProfile = {
  victim_name: 'Alex Mercer',
  victim_age: 28,
  victim_gender: 'Non-binary',
};

export const profileService = {
  async getUserProfile(): Promise<UserProfile> {
    try {
      const data = await SecureStore.getItemAsync(STORAGE_KEY);
      if (!data) {
        await this.saveUserProfile(DEFAULT_PROFILE);
        return DEFAULT_PROFILE;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_PROFILE;
    }
  },

  async saveUserProfile(profile: UserProfile): Promise<void> {
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // Storage error ignored
    }
  },
};
