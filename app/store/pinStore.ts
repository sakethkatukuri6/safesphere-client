import { create } from 'zustand';

interface PinState {
  cancelPin: string; // Default cancel PIN to stop false alarm
  duressPin: string; // Looks like cancel but notifies authorities citizen is under duress
  responderOtp: string; // One-time PIN used by authorized responder to resolve incident

  setCancelPin: (pin: string) => void;
  setDuressPin: (pin: string) => void;
  setResponderOtp: (otp: string) => void;
}

export const usePinStore = create<PinState>((set) => ({
  cancelPin: '1234',
  duressPin: '9999',
  responderOtp: '8924',

  setCancelPin: (pin: string) => set({ cancelPin: pin }),
  setDuressPin: (pin: string) => set({ duressPin: pin }),
  setResponderOtp: (otp: string) => set({ responderOtp: otp }),
}));
