# SafeSphere — Citizen App Contract (M1)
### Frozen Interface Specification
**Version 2.0 · Covers both modes — Need Help and Help Nearby — inside the one Citizen App build**
**Parent project:** SafeSphere — Emergency Orchestration Platform

This is the contract the Citizen App developer builds against. It defines exactly what this app sends (Need Help mode) and receives/sends (Help Nearby mode) — nothing else exists on either side of the wire.

---
## Table of Contents
1. Shared Enums & Constants
2. EventBus Topics
3. Need Help Mode — Outbound: `SosTriggerEvent`
4. Help Nearby Mode — Inbound: `VolunteerIncidentView`
5. Help Nearby Mode — Outbound: `VolunteerResponseEvent`
6. Change Process

---
## 1. Shared Enums & Constants
```java
public enum FsmState {
    SAFE, SUSPICIOUS, CHECKING, EMERGENCY,
    VOLUNTEER_ASSIGNED, ESCALATING,
    RESPONDER_ASSIGNED, ON_SCENE, RESOLVED
}
```
Need Help mode causes the FSM to move `SAFE → SUSPICIOUS → CHECKING → EMERGENCY`. Help Nearby mode only ever *observes* `EMERGENCY` and `VOLUNTEER_ASSIGNED` on incoming payloads — it doesn't implement transition logic; the Core Orchestrator (M4) owns the state machine.

```java
public final class Topics {
    public static final String SOS_TRIGGER          = "sos.trigger.v1";        // this app (Need Help) -> M4
    public static final String INCIDENT_VOLUNTEER   = "incident.volunteer.v1"; // M4/M6 -> this app (Help Nearby)
    public static final String VOLUNTEER_RESPONSE    = "volunteer.response.v1"; // this app (Help Nearby) -> M4
}
```

---
## 2. EventBus Topics
| Topic | Direction | Payload |
|---|---|---|
| `sos.trigger.v1` | **this app, Need Help mode** → M4 (publish) | `SosTriggerEvent` |
| `incident.volunteer.v1` | M4/M6 → **this app, Help Nearby mode** (subscribe) | `VolunteerIncidentView` |
| `volunteer.response.v1` | **this app, Help Nearby mode** → M4 (publish) | `VolunteerResponseEvent` |

Help Nearby mode subscribes filtered by `capsule_id`. The EventBus does this filtering server-side — this app never receives a payload for an incident it isn't assigned to.

---
## 3. Need Help Mode — Outbound: `SosTriggerEvent`
```java
public record SosTriggerEvent(
    String deviceId,
    TriggerType triggerType,       // MANUAL_SOS | CRASH_DETECTED | ROUTE_DEVIATION
    double batteryLevel,
    NetworkQuality networkQuality,
    boolean cannotSpeak,
    boolean threatNearby,
    Instant timestamp
) {}

public enum TriggerType { MANUAL_SOS, CRASH_DETECTED, ROUTE_DEVIATION }
public enum NetworkQuality { STRONG, WEAK, OFFLINE }
```
```json
{
  "device_id": "DEV-4471",
  "trigger_type": "CRASH_DETECTED",
  "battery_level": 42,
  "network_quality": "WEAK",
  "cannot_speak": true,
  "threat_nearby": false,
  "timestamp": "2026-09-26T22:28:12Z"
}
```
This is the only thing this app ever sends outward from Need Help mode — the raw signal. M4 owns everything downstream (CV verification, FSM transitions, capsule generation, encryption). This app does not construct or see the `EmergencyCapsule` itself.

---
## 4. Help Nearby Mode — Inbound: `VolunteerIncidentView`
```java
public record VolunteerIncidentView(
    String capsuleId,
    FsmState fsmState,
    String victimName,
    int victimAge,
    String victimGender,
    LocationPing location
) {}

public record LocationPing(
    double latitude,
    double longitude,
    Instant updatedAt
) {}
```
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
    "updated_at": "2026-09-26T22:29:10Z"
  }
}
```
**Exactly these six fields. No others exist on this type — ever.** No medical data, no hazard notes, no contacts, no OTP. This isn't a mode-level filter applied on top of a bigger object — this type genuinely has no field to hold any of that, so there's no code path in this app where it could accidentally render, even in Need Help mode's own data structures.

---
## 5. Help Nearby Mode — Outbound: `VolunteerResponseEvent`
```java
public record VolunteerResponseEvent(
    String capsuleId,
    String volunteerId,
    VolunteerAction action,      // ACCEPT | DECLINE | ARRIVED
    Instant timestamp
) {}

public enum VolunteerAction { ACCEPT, DECLINE, ARRIVED }
```
```json
{
  "capsule_id": "CR-8924",
  "volunteer_id": "VOL-142",
  "action": "ARRIVED",
  "timestamp": "2026-09-26T22:31:40Z"
}
```
- `ACCEPT` → M4 transitions the incident to `VOLUNTEER_ASSIGNED`; this mode swaps its Accept/Decline buttons for a single "Mark Arrived" button.
- `DECLINE` → M4/M6 re-match to the next-best volunteer; this app clears the incident from its own queue.
- `ARRIVED` → logged to the audit trail. This does **not** silence the victim's alert — that action exists only in the separate Professional App's Field mode, which this app has no visibility into.

---
## 6. Change Process
- This contract is **frozen** once Hour 1 ends. A field rename, addition, or removal after that requires:
  1. Posting the exact diff in the team channel before touching code.
  2. The Professional App developer acknowledging it too, even if only this app is affected — the shared `FsmState` enum and topic-naming pattern are common ground.
  3. Updating this file in the same commit as the code change — this file is the source of truth, not a comment in the code.
- No field gets added "just in case" mid-sprint, in either mode.
