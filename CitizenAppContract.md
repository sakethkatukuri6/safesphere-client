# SafeSphere — Citizen App Contract (M1)
### Frozen Interface Specification
**Version 4.0 · REST + WebSocket wire contract against `safesphere-client/backend`**
**Parent project:** SafeSphere — Emergency Orchestration Platform

This is the contract the Citizen App (`safesphere-client/app`) builds
against, regardless of what native stack the app is eventually written in
— that decision is still open (see `SafeSphere.md` §2, §11). It defines
exactly what this app sends (Need Help mode) and receives/sends (Help
Nearby mode) over the network — nothing else exists on either side of the
wire.

The backend this contract targets (`backend/`) now lives inside this same
repo instead of a separate `safesphere-backend` repo, but it is still a
standalone Java process reached over HTTPS/WSS at a configurable base URL
— `http://localhost:8080` (or similar) for local development,
whatever host it's deployed to in a real run. Nothing below changes based
on where the backend's source sits in git.

This file, not any AI-generated concept screen, is the authoritative
schema for what data exists on the wire. Keep field names and types exact
once your frontend stack is chosen.

---
## Table of Contents
1. Shared Enums & Constants
2. Endpoints & Channels
3. Need Help Mode — Outbound: `POST /api/v1/sos/trigger`
4. Help Nearby Mode — Inbound (WebSocket): `VolunteerIncidentView`
5. Help Nearby Mode — Outbound: `POST /api/v1/volunteer/response`
6. Change Process

---
## 1. Shared Enums & Constants
```
FsmState: SAFE | SUSPICIOUS | CHECKING | EMERGENCY | VOLUNTEER_ASSIGNED
        | ESCALATING | RESPONDER_ASSIGNED | ON_SCENE | RESOLVED
```
Need Help mode causes the backend FSM to move
`SAFE → SUSPICIOUS → CHECKING → EMERGENCY`. Help Nearby mode only ever
*observes* `EMERGENCY` and `VOLUNTEER_ASSIGNED` on incoming payloads — this
app implements no transition logic; `backend/` (M4) owns the state machine
entirely, and no client on any platform is trusted to advance it.

---
## 2. Endpoints & Channels
| Route | Direction | Payload |
|---|---|---|
| `POST /api/v1/sos/trigger` | this app (Need Help) → backend | `SosTriggerEvent` request body |
| `WSS /ws/v1/incidents/volunteer` | backend → this app (Help Nearby), subscribe | `VolunteerIncidentView` messages |
| `POST /api/v1/volunteer/response` | this app (Help Nearby) → backend | `VolunteerResponseEvent` request body |

The WebSocket subscription is filtered server-side by the volunteer's
verified ID — this app never receives a push for an incident it isn't
matched to. Reconnect with exponential backoff; on reconnect, re-subscribe
before assuming the queue is empty. This must keep working while the app
is backgrounded (see `SafeSphere.md` §11) — a dropped connection the
moment the screen locks is a bug, not expected behavior.

---
## 3. Need Help Mode — Outbound: `SosTriggerEvent`
**Request**
```
POST /api/v1/sos/trigger
Content-Type: application/json
```
```json
{
  "device_id": "DEV-4471",
  "trigger_type": "CRASH_DETECTED",
  "battery_level": 42,
  "network_quality": "WEAK",
  "cannot_speak": true,
  "threat_nearby": false,
  "timestamp": "2026-09-27T10:14:52Z"
}
```
| Field | Type | Notes |
|---|---|---|
| `device_id` | string | Stable per-install identifier. |
| `trigger_type` | enum | `MANUAL_SOS` \| `CRASH_DETECTED` \| `ROUTE_DEVIATION`. `CRASH_DETECTED` comes from the device's own motion sensors (accelerometer/gyroscope, §11) and bypasses the confirmation window server-side (§8 of `SafeSphere.md`) — this app does not decide the bypass itself, it just reports the trigger type honestly. |
| `battery_level` | number (0–100) | Real device battery, read by M3 via the OS battery API. |
| `network_quality` | enum | `STRONG` \| `WEAK` \| `OFFLINE`. |
| `cannot_speak` | boolean | From the "I Can't Speak" questionnaire. |
| `threat_nearby` | boolean | From the same questionnaire. |
| `timestamp` | ISO-8601 string | Client-generated send time. |

**Response:** `202 Accepted` with `{ "capsule_id": "CR-8924" }`. This is the
only thing this app ever sends outward from Need Help mode — the raw
signal. `backend/` owns everything downstream (FSM transitions, capsule
generation, encryption). This app never constructs or receives the full
`EmergencyCapsule`.

---
## 4. Help Nearby Mode — Inbound (WebSocket): `VolunteerIncidentView`
**Subscribe:** `WSS /ws/v1/incidents/volunteer?volunteer_id={id}`
```json
{
  "capsule_id": "CR-8924",
  "fsm_state": "EMERGENCY",
  "victim_name": "Jane Doe",
  "victim_age": 24,
  "victim_gender": "Female",
  "location": {
    "latitude": 17.3850,
    "longitude": 78.4867,
    "updated_at": "2026-09-27T10:15:30Z"
  }
}
```
**Exactly these six fields. No others exist on this message — ever.** No
medical data, no hazard notes, no contacts, no OTP. This isn't a
mode-level filter applied on top of a bigger object — `backend/`'s
response type genuinely has no field to hold any of that, so no matter
what your Citizen App is written in, there is no code path where it could
accidentally render medical data, even in Need Help mode's own local
state.

---
## 5. Help Nearby Mode — Outbound: `VolunteerResponseEvent`
**Request**
```
POST /api/v1/volunteer/response
Content-Type: application/json
```
```json
{
  "capsule_id": "CR-8924",
  "volunteer_id": "VOL-142",
  "action": "ARRIVED",
  "timestamp": "2026-09-27T10:17:40Z"
}
```
| Field | Type | Notes |
|---|---|---|
| `action` | enum | `ACCEPT` \| `DECLINE` \| `ARRIVED` |

- `ACCEPT` → backend transitions the incident to `VOLUNTEER_ASSIGNED`; this
  mode swaps Accept/Decline for a single "Mark Arrived" button.
- `DECLINE` → backend re-matches to the next-best volunteer; this app
  clears the incident from its own queue.
- `ARRIVED` → logged to the audit trail. This does **not** silence the
  victim's alert — that action exists only in the separate Professional
  App's Field mode, which this app has no visibility into.

---
## 6. Change Process
- This contract is **frozen** once the team agrees on it. A field
  rename/add/remove after that requires:
  1. Posting the exact diff in the team channel before touching code.
  2. The Professional App owner and the Backend Lead acknowledging it —
     the shared `FsmState` enum and route-naming pattern are common ground.
  3. Updating this file in the same commit/PR as the backend change (in
     `backend/`) — this file is the source of truth, not a comment in the
     code.
- No field gets added "just in case" mid-sprint, in either mode.
- This applies equally whether the Citizen App frontend is scaffolded yet
  or not — the contract is stable and buildable against right now, even
  during the backend-first phase (`SafeSphere.md` §2).
