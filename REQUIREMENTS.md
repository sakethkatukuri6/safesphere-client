# SafeSphere — System Requirements Specification (SRS)
**Citizen Emergency Orchestration Platform**  
**Lead Architect:** Katukuri Saketh | **Contributor:** Nihal Kolluri  
**Version:** 4.0 · Citizen App (React Native / Expo SDK 57) + Core Java Backend (Java 17+)

---

## 1. Project Overview
SafeSphere is an emergency orchestration platform designed to provide rapid, high-assurance safety assistance to citizens in distress. The system connects victims, trusted emergency contacts, 112 emergency dispatchers, and nearby verified citizen volunteers.

This document formally specifies all hardware, software, runtime, functional, and security requirements for the **SafeSphere Citizen App (M1)** and its interaction with the **SafeSphere Core Backend (M4, M6, API Gateway)**.

---

## 2. Software & Environment Requirements

### 2.1 Runtime & Tooling
| Component | Requirement | Version | Purpose |
|---|---|---|---|
| **Node.js** | Required | `>= 18.18.0` (Recommended: `v20.x` LTS) | JavaScript runtime for React Native / Expo development |
| **npm** | Required | `>= 9.0.0` | Package management and dependency resolution |
| **Expo CLI** | Required | `~57.0.31` (SDK 57) | Mobile compilation, dev server, and native toolchain |
| **React Native** | Required | `0.86.3` | Native cross-platform application framework |
| **TypeScript** | Required | `~6.0.3` | Static typing and interface enforcement |
| **Java JDK** | Required (Backend) | `17+` (OpenJDK / Eclipse Temurin) | Backend state machine (M4) & cryptographic evidence vault |
| **Apache Maven** | Required (Backend) | `>= 3.8.0` | Build and dependency management for Java services |
| **Operating System** | Supported | Windows 10/11, macOS, Linux, Android 10+, iOS 15+ | Multi-platform support |

### 2.2 Environment Variables
The application requires the following environment variables (defined in `.env` or system environment):

| Variable | Type | Default | Description |
|---|---|---|---|
| `EXPO_PUBLIC_API_URL` | URL | `http://localhost:8080` | Base endpoint URL for the Java Orchestration Backend |
| `GOOGLE_MAPS_API_KEY` | String | *(Optional)* | Google Maps SDK API key for native map rendering |

---

## 3. Hardware & OS-Level Native Capabilities
In accordance with `SafeSphere.md` §11, the Citizen App is an **OS-level native application with direct hardware access**, strictly ruling out bare WebViews or simplified PWAs.

| Native Capability | Library / Module | Functional Application |
|---|---|---|
| **Foreground & Background GPS** | `expo-location` | Real-time telemetry streaming during Active Emergency; distance calculation to nearby volunteers. |
| **Battery Status API** | `expo-battery` | Continuous battery level monitoring (0–100%); triggers low-battery threshold for **Survival Mode** at $\le 15\%$. |
| **Haptic Feedback** | `expo-haptics` | Tactile pulses during 3-second SOS countdown (3, 2, 1s intervals), emergency activation, and PIN keypad feedback. |
| **Motion & Crash Sensors** | `expo-sensors` | Continuous low-latency accelerometer and gyroscope polling for auto-triggering `CRASH_DETECTED` events. |
| **Camera & Image Picker** | `expo-camera`, `expo-image-picker` | Capturing real-time forensic evidence (scene photos, vehicle license plates) in the Evidence Vault. |
| **Audio Recording & Playback** | `expo-av` | Ambient audio streaming during active emergencies; interactive waveform playback in Evidence Capsule. |
| **Contacts API** | `expo-contacts` | Native address book integration for adding trusted contacts to "My Circle". |
| **Secure Keystore / Keychain** | `expo-secure-store` | Hardware-backed encrypted storage for authentication tokens, device UUIDs, and PIN hashes. |
| **Network Quality State** | `expo-network` | Telemetry classification (`STRONG`, `WEAK`, `OFFLINE`) for adaptive bandwidth throttling. |

---

## 4. Functional Requirements: All 13 Screens

The Citizen App UI implements all 13 screens defined in `SafeSphere_Emergency_App_Prototype_Board.png`:

### Flow 1: Need Help & SOS Trigger Flow
1. **Home / Journey (`app/(tabs)/index.tsx`)**:
   - SafeSphere brand header with avatar and notification bell.
   - Safe Journey status card (Route: College to Home, 34 min / 12.4 km).
   - Dark map canvas displaying live location dot and route polyline.
   - Large central **HOLD SOS** button with animated concentric red breathing glow.
   - AI monitoring banner ("AI monitoring active").
   - Bottom status row: Battery %, Network Quality, and Scheduled Check-in time.
2. **Hold to Confirm (`app/hold-confirm.tsx`)**:
   - 3-second circular countdown ring with numeric progress (3 → 2 → 1).
   - Haptic pulse feedback at each 1-second interval; release cancels trigger.
   - "Silent Emergency?" card with solid red **"I CAN'T SPEAK"** button.
   - Secondary "Cancel" outline button.
3. **Active Emergency (`app/active-emergency.tsx`)**:
   - Emergency Activated header with red warning indicator.
   - Live Tracking card with cyan animated audio waveform visualizer and timer (`00:24`).
   - Vertical timestamped audit trail (SOS Activated, Location Shared, 112 Notified, Contacts Notified, Evidence Capture On).
   - **"CANCEL EMERGENCY"** button invoking the dual PIN disarm modal.
4. **Alert Sent (`app/alert-sent.tsx`)**:
   - High-contrast green checkmark hero banner.
   - Dynamically generated Incident ID box (`#SS-23814`) with 1-click clipboard copy.
   - "Shared with" recipient status:
     - 112 Emergency Services: *Notified*
     - 3 Trusted Contacts: *Notified*
     - Nearby Volunteers: *Searching (5 nearby)*
   - Action buttons: "View Live Status" and "Add Information".
5. **Live Incident Status (`app/live-status.tsx`)**:
   - Real-time status cards: Location streaming (Live badge), 112 responders (ETA 8–12 min), 3 contacts notified, nearby volunteers alerted, evidence capture active.
   - Live mini radar map depicting user location and approaching responders.
   - Disarm button connecting to PIN system.
6. **Silent Help Questionnaire (`app/silent-help.tsx`)**:
   - Multi-select situation chips: *Harassment, Medical Emergency, Accident, Feeling Unsafe, Other*.
   - Can you speak? chips: *Yes, No, Prefer not to say*.
   - Need medical help? chips: *Yes, No, Maybe*.
   - Informational helper note and primary "Submit" button.

### Flow 2: Survival Mode (Low Battery)
7. **Survival Mode (`app/survival.tsx`)**:
   - Ultra-minimal dark theme to conserve battery life.
   - Circular battery gauge showing remaining percentage (e.g. 8%) and runtime estimate (`-1h 20m`).
   - Power-saving toggles:
     - *Adaptive Power Mode* (sensor throttling)
     - *Low Data Telemetry* (text-only payloads)
     - *Offline Continuity* (store-and-forward queue)
   - Quick shortcut to the Offline Map and "Exit Survival Mode" button.
8. **Offline Map (`app/offline-map.tsx`)**:
   - Offline-cached minimal vector map with cyan route line to safe sanctuary.
   - Floating status card: "You are safe — your location is saved offline".
   - "Open Emergency Contacts" primary action.

### Flow 3: Help Nearby (Volunteer & Citizen View)
9. **Help Nearby Map (`app/(tabs)/nearby.tsx`)**:
   - "Connected • 5 nearby volunteers" status pill.
   - Dark interactive map displaying nearby distress incidents with pins.
   - Sliding sheet of incident cards (`#SS-23814`, `#SS-23810`, `#SS-23805`) with distance, urgency, and "View" actions.
10. **Incident Details — Volunteer View (`app/incident-details.tsx`)**:
    - Route mini-map to incident coordinates.
    - Incident header with "Safe to approach?" safety badge.
    - Detail fields: Type, Description, Reported Time, Requesting entity.
    - Volunteer response actions: "I'm Nearby - Help" (transitions to "Mark Arrived") and "Navigate".
    - Privacy protection guarantee banner.

### Flow 4: Evidence & Circle Management
11. **Evidence & Incident Capsule (`app/(tabs)/evidence.tsx`)**:
    - Header with flashing "● Recording" live indicator.
    - Filter tabs: *All, Photos, Audio, Notes*.
    - Media grid: street photos, license plate images, waveform audio player with play/pause, note snippets, and "+ Add Note" / "+ Add Photo" actions.
    - AES-256 encryption disclosure footer.
12. **Emergency Contacts — My Circle (`app/(tabs)/circle.tsx`)**:
    - "Trusted Contacts (3/5)" list (Mom, Dad, Best Friend) with 1-tap dialer.
    - "Share Live Location" switch toggle.
    - 112 National Emergency Services fast-dial card.
    - Add contact modal with device contacts integration.
13. **Profile & Settings (`app/(tabs)/profile.tsx`)**:
    - Citizen user card with avatar, name, and email.
    - Navigation settings: Personal Information, Safety Preferences (PIN configuration modal), Notifications, Privacy & Data, Survival Mode Settings, App Appearance, Language, Help & Support.
    - Danger zone "Logout" action.

---

## 5. Security & PIN System Specifications

The application enforces a 3-tier PIN disarm architecture:

1. **Cancel PIN (Default: `1234`)**:
   - Purpose: Disarms accidental triggers and false alarms.
   - Effect: Sends `FALSE_ALARM` cancellation to backend; resets local state to `IDLE`.
2. **Duress PIN (Default: `9999`)**:
   - Purpose: Protects citizens coerced into canceling an active emergency under threat.
   - Effect: Deceptively displays "Alert Cancelled" on the screen and returns to Home UI, while covertly transmitting a `DURESS_TRIGGERED` payload to backend services to keep high-priority dispatch active.
3. **Responder OTP (Default: `8924`)**:
   - Purpose: Allows authorized first responders (police, paramedics) on scene to officially resolve and close an emergency capsule.

---

## 6. Backend API Wire Contract (`lib/api.ts`)

| Endpoint | Method | Payload | Offline Mock Fallback |
|---|---|---|---|
| `/api/v1/sos/trigger` | `POST` | `SosTriggerPayload` (device_id, trigger_type, battery, network, speak, threat) | Generates `#SS-XXXXX` capsule with 202 status |
| `/api/v1/sos/cancel` | `POST` | `{ incident_id, pin, is_duress, reason, timestamp }` | Resolves disarm or triggers silent duress |
| `/api/v1/sos/resolve` | `POST` | `{ incident_id, otp, timestamp }` | Validates responder OTP (`8924`) |
| `/api/v1/sos/questionnaire` | `POST` | `{ incident_id, situation, canSpeak, needMedical }` | Local state persistence |
| `/api/v1/incidents/nearby` | `GET` | — | Returns mock list of 3 nearby incidents |
| `/api/v1/volunteer/response` | `POST` | `{ capsule_id, volunteer_id, action, timestamp }` | Updates volunteer state (`ACCEPT` / `ARRIVED`) |
| `/api/v1/evidence/list` | `GET` | — | Returns photos, audio capsules, and forensic notes |
| `/api/v1/contacts` | `GET` | — | Returns Trusted Circle contacts |

---

## 7. Package Dependency Manifest (`package.json`)

```json
{
  "dependencies": {
    "expo": "~57.0.31",
    "react": "19.2.3",
    "react-native": "0.86.3",
    "expo-router": "~57.0.29",
    "react-native-maps": "1.27.2",
    "expo-location": "~57.0.22",
    "expo-battery": "~57.0.3",
    "expo-haptics": "~57.0.3",
    "expo-camera": "~57.0.0",
    "expo-av": "~57.0.0",
    "expo-image-picker": "~57.0.0",
    "expo-contacts": "~57.0.0",
    "expo-secure-store": "~57.0.4",
    "expo-sensors": "~57.0.3",
    "expo-notifications": "~57.0.24",
    "expo-network": "~57.0.3",
    "zustand": "^5.0.15",
    "lucide-react-native": "^1.55.0",
    "react-native-svg": "15.15.4",
    "react-native-reanimated": "4.5.1",
    "react-native-gesture-handler": "~2.32.0",
    "react-native-safe-area-context": "~5.7.0",
    "react-native-screens": "~4.26.0"
  }
}
```

---

## 8. Build & Verification Commands

```bash
# 1. Install dependencies
cd app
npm install

# 2. Run TypeScript Static Check
npx tsc --noEmit

# 3. Start Expo Development Server
npx expo start
```
