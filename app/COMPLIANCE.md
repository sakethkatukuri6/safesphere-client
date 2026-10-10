# SafeSphere Citizen App (M1) — Compliance, Traceability & Audit Report

**Version:** 4.1 (Nightwatch Dual-Theme & Bottom-Tab Specification)  
**Stack:** React Native (Expo development builds, TypeScript strict mode)  
**Design Direction:** Nightwatch (Dual Theme: Dark & Light with OLED Pitch Black)  
**Scope:** `safesphere-client/app`  
**Parent Contract:** `CitizenAppContract.md` (Frozen v4.0)  
**System Architecture:** `SafeSphere.md` (v4.0)  

---

## 1. Executive Summary
This document serves as the authoritative proof of compliance for the SafeSphere Citizen App (M1) with the embedded Survival Engine (M3). Build isolation is strictly maintained inside `safesphere-client/app/` with zero modifications to or imports from `backend/`, `CitizenAppContract.md`, or `SafeSphere.md`. The frozen wire contract routes and payloads remain exact with zero uncontracted fields.

---

## 2. Requirement Traceability Matrix

| Requirement ID | Requirement Description | Implementation File | Component / Symbol | Line(s) | Status |
|---|---|---|---|---|---|
| **REQ-01** | Build Isolation: build only inside `app/` folder | `app/` | Entire project root | N/A | PASS |
| **REQ-02** | Frozen Contract Types (v4.0 exact schema) | `src/services/contract.types.ts` | `FsmState`, `SosTriggerEvent`, `VolunteerIncidentView`, `VolunteerResponseEvent` | L1-L71 | PASS |
| **REQ-03** | VolunteerIncidentView: strictly 6 fields, no medical/hazard/OTP | `src/services/contract.types.ts` | `VolunteerIncidentView` | L48-L58 | PASS |
| **REQ-04** | Nightwatch Design Tokens: dual theme, spacing, radii, motion | `src/theme/tokens.ts` | `darkColors`, `lightColors`, `space`, `radius`, `touch`, `motion` | L8-L95 | PASS |
| **REQ-05** | IBM Plex Sans Typography (Wordmark, Display, Title, Body, Label, Caption, SOS) | `src/theme/typography.ts` | `typography`, `fontFamilies` | L1-L75 | PASS |
| **REQ-06** | Dual-Theme Engine with System/Light/Dark and Pitch Black Override | `src/theme/ThemeContext.tsx` | `ThemeProvider`, `useTheme` | L23-L95 | PASS |
| **REQ-07** | Text-Only 4 Bottom Tabs Navigation (Home, Circle, Evidence, Profile) | `src/components/BottomTabBar.tsx`, `app/index.tsx` | `BottomTabBar`, `MainAppScreen` | L1-L90 | PASS |
| **REQ-08** | Home Tab Need Help Layout & Breathing SOS Button (3s hold fill) | `src/features/need-help/NeedHelpIdle.tsx`, `src/components/SosButton.tsx` | `NeedHelpIdle`, `SosButton` | L1-L150 | PASS |
| **REQ-09** | Notify Chips Row (Emergency contacts, Volunteers, 112) with G8 local persistence | `src/features/need-help/NeedHelpIdle.tsx`, `src/services/notifyChipsService.ts` | `notifyChipsService`, `Chip` | L1-L50 | PASS |
| **REQ-10** | Survival Mode Card (Standby/Active state, live user thresholds readout) | `src/components/SurvivalCard.tsx` | `SurvivalCard` | L1-L120 | PASS |
| **REQ-11** | Circle Tab (Emergency contacts list, 1px dividers, delete alert, encrypted storage) | `src/features/circle/CircleScreen.tsx`, `src/services/contactsService.ts` | `CircleScreen`, `contactsService` | L1-L260 | PASS |
| **REQ-12** | Contact Validation & Add Sheet (350ms slide up, max 60/30/20 char validation) | `src/features/circle/CircleScreen.tsx`, `src/services/contactValidation.ts` | `validateContact`, `BottomSheet` | L1-L45 | PASS |
| **REQ-13** | Evidence Tab (Local encrypted capsules list, empty state, read-only metadata sheet) | `src/features/evidence/EvidenceScreen.tsx`, `src/services/evidenceService.ts` | `EvidenceScreen`, `evidenceService` | L1-L240 | PASS |
| **REQ-14** | Profile Tab (Demographics card, permissions rows with settings link, appearance chips) | `src/features/profile/ProfileScreen.tsx`, `src/services/profileService.ts` | `ProfileScreen`, `profileService` | L1-L290 | PASS |
| **REQ-15** | Battery Settings Screen (Low [30-80%], Critical [5-25%], guard rails, intervals, Pitch Black toggle) | `src/features/profile/BatterySettingsScreen.tsx`, `src/services/batterySettingsLogic.ts` | `BatterySettingsScreen`, `enforceBatteryGuardRails` | L1-L340 | PASS |
| **REQ-16** | Google Maps Integration (`PROVIDER_GOOGLE`) with safe runtime & web fallback card | `src/features/help-nearby/HelpNearbyMap.tsx`, `src/features/help-nearby/HelpNearbyMap.web.tsx` | `HelpNearbyMap`, `formatCoordinates` | L1-L200 | PASS |
| **REQ-17** | Need Help N2 10s Silent Confirmation Window (no sound, light haptic) | `src/features/need-help/NeedHelpConfirming.tsx` | `NeedHelpConfirming` | L1-L140 | PASS |
| **REQ-18** | Need Help N3 Sent view ("Alert sent" & `capsule_id` only) | `src/features/need-help/NeedHelpSent.tsx` | `NeedHelpSent` | L1-L65 | PASS |
| **REQ-19** | Need Help Error & Offline status handling | `src/features/need-help/NeedHelpError.tsx` | `NeedHelpError` | L1-L75 | PASS |
| **REQ-20** | M3 Survival Engine store & dynamic GPS interval throttling | `src/store/survivalStore.ts`, `src/services/locationService.ts` | `useSurvivalStore`, `updateBackgroundLocationInterval` | L1-L135 | PASS |
| **REQ-21** | Pitch Black view (pure OLED #000000, reduced content, hidden tab bar) | `src/features/survival/PitchBlackView.tsx`, `src/components/BottomTabBar.tsx` | `PitchBlackView`, `BottomTabBar` | L1-L95 | PASS |
| **REQ-22** | Hardware sensor triggers (`CRASH_DETECTED`, `ROUTE_DEVIATION`) | `src/services/sensorService.ts` | `sensorService.startListening` | L1-L65 | PASS |
| **REQ-23** | Help Nearby H1 Waiting view (Connecting/Connected/Reconnecting + pulsing dot) | `src/features/help-nearby/HelpNearbyHeader.tsx` | `HelpNearbyHeader` | L1-L140 | PASS |
| **REQ-24** | Help Nearby H2 Incident view (Strictly 6 fields, no medical/hazard/OTP) | `src/components/IncidentCard.tsx` | `IncidentCard` | L1-L215 | PASS |
| **REQ-25** | Mode Switch (SegmentedToggle on Home tab only, 250ms crossfade) | `src/components/SegmentedToggle.tsx`, `app/index.tsx` | `SegmentedToggle`, `MainAppScreen` | L1-L140 | PASS |

---

## 3. Contract Gap List (Strict Tracking)

| Gap ID | Contract Gap Description | File & Line | Typed Interface / Handling |
|---|---|---|---|
| **G1** | No volunteer login or verification endpoint, and no source for `volunteer_id` | `src/services/deviceStorage.ts:6-8, 32-43` | `DEFAULT_FALLBACK_VOLUNTEER_ID` (`'VOL-142'`), persisted via `expo-secure-store`. Exposed behind typed `getVolunteerId()`. |
| **G2** | No route or message for the victim's app to receive alert-stop (`SILENCE_ACK` / stop siren) | `src/services/apiClient.ts:48-52` | Documented. The app receives 202 on SOS and holds no client-side state timeline or siren receiver. |
| **G3** | No payload defined for clearing other volunteers' queues | `src/services/wsClient.ts:87` | Documented. WebSocket message parser safely ignores unrecognized message shapes. |
| **G4** | Evidence capture is client-local only; no upload route exists in CitizenAppContract.md | `src/services/evidenceService.ts:1-12`, `src/features/evidence/EvidenceScreen.tsx:1-15` | Encrypted capsules are stored locally and browsable via read-only metadata detail. No uncontracted network upload endpoint exists. |
| **G5** | No cancel action for 10-second confirmation window, and no retry policy for failed/offline sends | `src/store/needHelpStore.ts:106-113` | Silent 10s countdown proceeds to send unless user presses "I need help now" for immediate dispatch. Failed/offline sends display honest error status. |
| **G6** | No definition of how `ROUTE_DEVIATION` is detected | `src/services/sensorService.ts:70-78` | Typed method `sensorService.simulateRouteDeviation()` exposed for triggering route deviation events. |
| **G7** | Behavior for `fsm_state` values other than `EMERGENCY` and `VOLUNTEER_ASSIGNED` arriving on WebSocket | `src/services/wsClient.ts:60-75` | Typed against full `FsmState` enum; Help Nearby UI handles `EMERGENCY` and `VOLUNTEER_ASSIGNED` exclusively per contract Section 4. |
| **G8** | `SosTriggerEvent` wire payload has no recipients field. Intended targets are stored locally | `src/services/notifyChipsService.ts:1-10`, `src/features/need-help/NeedHelpIdle.tsx:1-12` | Toggle states for Emergency contacts, Volunteers, and 112 are stored locally under `safesphere_notify_chips_v1` for post-trigger dispatch if/when backend adds recipient routing. |
| **G9** | Emergency contacts are client-local only; no contact schema or endpoint exists in contract | `src/services/contactsService.ts:1-15`, `src/features/circle/CircleScreen.tsx:1-15` | Contacts are encrypted in `expo-secure-store` (`safesphere_emergency_contacts_v1`). Never sent to backend in any payload. Help Nearby NEVER displays or accesses these contacts. |
| **G10** | Profile identity editing is client-local only; contract defines victim_* fields in SosTriggerEvent without a registration endpoint | `src/services/profileService.ts:1-10`, `src/features/profile/ProfileScreen.tsx:1-15` | Demographic fields (`victim_name`, `victim_age`, `victim_gender`) are persisted in SecureStore (`safesphere_user_profile_v1`) and populate SOS dispatch payloads. |

---

## 4. Intentional Deviations & Source Conflicts

| Conflict / Deviation | Source A | Source B | Resolution & Architecture Decision |
|---|---|---|---|
| **User-Configurable Battery Thresholds** | `SafeSphere.md` §9: Hardcodes 50% for Low tier and 15% for Critical tier | Nightwatch Specification C5: User-configurable battery settings | Configurable sliders for Low (30–80%) and Critical (5–25%) with strict safety guard rails: Critical is clamped to always be at least 10% below Low; GPS interval in Low never exceeds Critical; SOS dispatch is never disabled. Defaults match Section 9 (50% and 15%). Persisted in SecureStore under `safesphere_battery_settings_v1`. |
| **Four Bottom Tabs Navigation** | Prompt 1: Single top toggle shell | Nightwatch Specification C1: Four bottom tabs (`Home`, `Circle`, `Evidence`, `Profile`) | Bottom tab bar (72px + bottom inset, text-only, 14px, 150ms anim) added for primary navigation. Top SegmentedToggle retained on Home tab only. Tab bar hidden during 10s confirmation and Pitch Black. |
| **Frontend UI Stack** | `SafeSphere.md` §2 & §12: *"UI stack not yet decided — backend-first build"* | User Prompt: *"Frontend stack: React Native"* | Followed React Native stack with Expo development builds and strict TypeScript mode. |
| **In-Repo Backend Location** | `SafeSphere.md` §1: Backend in `safesphere-client/backend` | User Prompt: *"Build only inside app/"* | Strict isolation inside `safesphere-client/app`. Zero imports from or modifications to `backend/`. |

---

## 5. Pass/Fail Checklist of Nightwatch Design Rules

- [x] **No purple or violet anywhere in UI or styling:** PASS (Palette strictly `#0D1316`, `#162026`, `#223038`, `#1B2830`, `#E8EEF0`, `#8FA0A6`, `#4CC2B5`, `#E8553D`, `#F0A93B`, `#000000` in dark; `#F4F7F8`, `#FFFFFF`, `#D5DDE1`, `#E3E9EC`, `#12191D`, `#5B6B72`, `#17756C`, `#C8402B`, `#8A5A00` in light).
- [x] **No gradients:** PASS.
- [x] **No emojis anywhere in UI, copy, or code comments:** PASS (Verified via automated regex scanner).
- [x] **No blur or glow effects:** PASS.
- [x] **Depth comes only from surface colors and 1px borders:** PASS (Zero box shadows, zero elevations).
- [x] **Dual Theme via ThemeContext:** PASS (All components read colors from `useTheme()`; zero static color leaks).
- [x] **WCAG AA Contrast Compliance:** PASS (Body text contrast > 15:1; button text on accent/danger > 5:1; SOS label > 3.6:1).
- [x] **Tab Bar 72px + Safe Inset, Text-Only:** PASS (Tabs: Home, Circle, Evidence, Profile; 14px, active accent 600, inactive textMuted 400).
- [x] **Tab Bar Hidden in 10s Window & Pitch Black:** PASS.
- [x] **Volunteer Incident View strictly 6 fields:** PASS (`capsule_id`, `fsm_state`, `victim_name`, `victim_age`, `victim_gender`, `location`).
- [x] **Safe Google Maps Fallback Card:** PASS (Coordinates formatted tabular 15px/500 with "Open in system maps" button; app never crashes if key missing).
- [x] **Strict Wire Payload Matching:** PASS (`SosTriggerEvent` contains strictly the 7 frozen fields).
