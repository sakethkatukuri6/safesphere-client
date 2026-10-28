# SafeSphere Citizen App — Requirements
See full project specifications in the root [REQUIREMENTS.md](../REQUIREMENTS.md).

## Mobile App Stack & Requirements
- **Framework:** React Native with Expo SDK 57
- **Language:** TypeScript
- **Routing:** Expo Router with 5 bottom tabs (Home, Nearby, Evidence, Circle, Profile)
- **Theme:** Dark mode with red, blue, green accents (`theme/colors.ts`)
- **State:** Zustand stores (`store/emergencyStore.ts`, `store/pinStore.ts`, `store/batteryStore.ts`)
- **API:** Resilient REST/WS client with mock fallbacks (`lib/api.ts`)
- **Native Modules:**
  - `react-native-maps`: Offline & live incident mapping
  - `expo-location`: Real-time GPS telemetry
  - `expo-battery`: Battery level tracking for Survival Mode
  - `expo-haptics`: Countdown & keypad tactile feedback
  - `expo-camera` & `expo-image-picker`: Evidence capture
  - `expo-av`: Audio waveform streaming & playback
  - `expo-contacts`: Circle address book integration
  - `expo-secure-store`: Hardware encrypted credentials

## Running the App
```bash
npm install
npx expo start
```
