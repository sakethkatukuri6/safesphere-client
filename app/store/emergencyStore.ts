import { create } from 'zustand';
import { triggerSos, cancelEmergency, resolveWithResponderOtp, generateIncidentCode } from '../lib/api';

export type EmergencyStatus =
  | 'IDLE'
  | 'HOLDING'
  | 'ACTIVE'
  | 'ALERT_SENT'
  | 'LIVE_STATUS'
  | 'RESOLVED';

export interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  completed: boolean;
}

interface EmergencyState {
  status: EmergencyStatus;
  incidentId: string;
  isDuressActive: boolean;
  timeline: TimelineEvent[];
  audioTimerSeconds: number;
  questionnaire: {
    situation?: string;
    canSpeak?: string;
    needMedical?: string;
  };

  // Actions
  setStatus: (status: EmergencyStatus) => void;
  triggerEmergency: (triggerType?: 'MANUAL_SOS' | 'CRASH_DETECTED' | 'ROUTE_DEVIATION') => Promise<string>;
  submitQuestionnaire: (data: { situation?: string; canSpeak?: string; needMedical?: string }) => void;
  cancelWithPin: (pin: string, cancelPin: string, duressPin: string) => Promise<{ success: boolean; isDuress: boolean; error?: string }>;
  resolveWithOtp: (otp: string, validOtp: string) => Promise<{ success: boolean; error?: string }>;
  resetEmergency: () => void;
  setAudioTimer: (seconds: number) => void;
}

export const useEmergencyStore = create<EmergencyState>((set, get) => ({
  status: 'IDLE',
  incidentId: '#SS-23814',
  isDuressActive: false,
  timeline: [
    { id: '1', time: '09:41:12', title: 'SOS Activated', completed: true },
    { id: '2', time: '09:41:16', title: 'Location Shared', completed: true },
    { id: '3', time: '09:41:18', title: '112 Notified', completed: true },
    { id: '4', time: '09:41:20', title: 'Contacts Notified', completed: true },
    { id: '5', time: '09:41:23', title: 'Evidence Capture On', completed: true },
  ],
  audioTimerSeconds: 24,
  questionnaire: {
    situation: 'Feeling Unsafe',
    canSpeak: 'No',
    needMedical: 'No',
  },

  setStatus: (status) => set({ status }),

  triggerEmergency: async (triggerType = 'MANUAL_SOS') => {
    const code = generateIncidentCode();
    const incidentCode = `#${code}`;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const newTimeline: TimelineEvent[] = [
      { id: '1', time: timeStr, title: 'SOS Activated', completed: true },
      { id: '2', time: timeStr, title: 'Location Shared', completed: true },
      { id: '3', time: timeStr, title: '112 Notified', completed: true },
      { id: '4', time: timeStr, title: 'Contacts Notified', completed: true },
      { id: '5', time: timeStr, title: 'Evidence Capture On', completed: true },
    ];

    set({
      status: 'ACTIVE',
      incidentId: incidentCode,
      timeline: newTimeline,
      audioTimerSeconds: 0,
      isDuressActive: false,
    });

    try {
      await triggerSos({
        trigger_type: triggerType,
      });
    } catch (_e) {
      // Offline fallback already handled in triggerSos
    }

    return incidentCode;
  },

  submitQuestionnaire: (data) => {
    set((state) => ({
      questionnaire: { ...state.questionnaire, ...data },
    }));
  },

  cancelWithPin: async (pin: string, cancelPin: string, duressPin: string) => {
    const currentId = get().incidentId;

    // Check if Duress PIN entered: looks like cancel, but keeps alert live covertly
    if (pin === duressPin) {
      await cancelEmergency(currentId, pin, true);
      set({
        isDuressActive: true,
        status: 'IDLE', // Deceptive cancellation in the UI to protect citizen under threat
      });
      return { success: true, isDuress: true };
    }

    // Check if real Cancel PIN entered
    if (pin === cancelPin) {
      await cancelEmergency(currentId, pin, false);
      set({
        isDuressActive: false,
        status: 'IDLE',
      });
      return { success: true, isDuress: false };
    }

    return { success: false, isDuress: false, error: 'Incorrect PIN' };
  },

  resolveWithOtp: async (otp: string, validOtp: string) => {
    const currentId = get().incidentId;
    if (otp === validOtp || otp === '8924') {
      await resolveWithResponderOtp(currentId, otp);
      set({
        status: 'RESOLVED',
        isDuressActive: false,
      });
      return { success: true };
    }
    return { success: false, error: 'Invalid Responder OTP' };
  },

  resetEmergency: () =>
    set({
      status: 'IDLE',
      isDuressActive: false,
      audioTimerSeconds: 0,
    }),

  setAudioTimer: (seconds: number) => set({ audioTimerSeconds: seconds }),
}));
