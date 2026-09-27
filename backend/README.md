# SafeSphere Backend (M4)

The Core Orchestrator from [`../SafeSphere.md`](../SafeSphere.md). This is a standalone Java
process: it is built, run, and deployed independently of any frontend, and nothing in it depends on
an app module at compile time.

It implements the **Citizen contract only**
([`../CitizenAppContract.md`](../CitizenAppContract.md), version 4.0). The Professional App
(`safesphere-official-app`) is a separate repository with its own contract; none of its surface
exists here.

Java 21, Javalin (REST + WebSocket), SQLite via JDBC, Jackson, SLF4J, JUnit 5.

---

## Quick start

```bash
cd backend

# 1. Build and run the full test suite
mvn verify

# 2. Run on the default port 8080
mvn exec:java -Dexec.mainClass=com.safesphere.SafeSphereApplication
```

Prefer the packaged JAR:

```bash
cd backend
mvn package
java -jar target/safesphere-backend-0.1.0-SNAPSHOT.jar
```

Then, in another terminal:

```bash
curl http://localhost:8080/health
```

### Requirements

| Tool | Version used | Notes |
|---|---|---|
| JDK | 21 | `maven.compiler.release=21` |
| Maven | 3.9+ | verified on 3.9.9 |

No database server, message broker, or external service is needed. SQLite is embedded.

---

## Commands

| Goal | Command |
|---|---|
| Compile | `mvn -B compile` |
| Run all tests | `mvn -B test` |
| Run one test class | `mvn -B test -Dtest=EvidenceVaultTest` |
| Verify (tests + package + shaded JAR) | `mvn -B verify` |
| Build the runnable JAR | `mvn -B package` |
| Run via Maven | `mvn exec:java -Dexec.mainClass=com.safesphere.SafeSphereApplication` |
| Run the JAR | `java -jar target/safesphere-backend-0.1.0-SNAPSHOT.jar` |
| Run on another port (PowerShell) | `$env:PORT=9090; java -jar target/safesphere-backend-0.1.0-SNAPSHOT.jar` |
| Run on another port (bash) | `PORT=9090 java -jar target/safesphere-backend-0.1.0-SNAPSHOT.jar` |

---

## Configuration

All configuration is environment variables. Copy [`.env.example`](.env.example) for reference; the
process does not read `.env` itself.

| Variable | Default | Meaning |
|---|---|---|
| `PORT` | `8080` | HTTP and WebSocket port. Invalid or out-of-range values fall back to 8080. |
| `SAFESPHERE_DB_PATH` | `data/safesphere.db` | SQLite file, relative to the working directory. Run from `backend/`. Parent directories are created. |
| `SAFESPHERE_EVIDENCE_KEY_BASE64` | *(unset)* | Base64 of exactly 32 bytes for the Evidence Vault. |
| `SAFESPHERE_LOG_LEVEL` | `info` | SLF4J simple log level. |

Generate a key:

```bash
openssl rand -base64 32
```

**If no key is configured, an ephemeral one is generated at startup and a warning is logged.**
That is fine for a local demo, but evidence sealed in one run cannot be read in the next. There is
no hard-coded secret anywhere in this codebase.

---

## Public API

Exactly these, and nothing else. Every field is frozen by `CitizenAppContract.md`.

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/health` | Liveness probe. Reports status only; exposes no incident, host, or config detail. |
| `POST` | `/api/v1/sos/trigger` | Need Help signal. `202` with exactly `{ "capsule_id": "CR-8924" }`. |
| `WSS` | `/ws/v1/incidents/volunteer?volunteer_id={id}` | Help Nearby incident push. |
| `POST` | `/api/v1/volunteer/response` | `ACCEPT` / `DECLINE` / `ARRIVED`. |

**Error responses** are a bare status code with a short plain-text reason, never a JSON object,
because the Citizen contract defines no error message type: `400` invalid body, `403` unknown
volunteer, `404` unknown incident, `409` wrong assignment or state, `500` unexpected failure.

Inbound validation is strict: an unknown field, a missing field, a bad enum, a battery level outside
0–100, a fractional battery level, or an unparseable timestamp is rejected rather than ignored. A
rejected trigger creates no incident.

---

## Demo walkthrough (no UI required)

Fixture devices and volunteers are seeded automatically on first start. `DEV-4471`'s coordinate is
the one in the contract examples, and `VOL-145` is standing on it, so it wins the match.

| Device | Victim (fixture) | Coordinate |
|---|---|---|
| `DEV-4471` | Jane Doe, 24, Female | 17.3850, 78.4867 |
| `DEV-4472` | Fixture Person Two, 41, Male | 17.3920, 78.5010 |
| `DEV-4473` | Fixture Person Three, 67, Female | 17.4100, 78.5200 |

| Volunteer | Position | First aid | Vehicle | Status |
|---|---|---|---|---|
| `VOL-142` | 17.3900, 78.4900 | yes | yes | ONLINE |
| `VOL-143` | 17.4500, 78.5500 | yes | no | ONLINE |
| `VOL-144` | 17.6000, 78.7000 | no | yes | ONLINE |
| `VOL-145` | 17.3850, 78.4867 | no | no | ONLINE |
| `VOL-146` | 17.3851, 78.4868 | yes | yes | OFFLINE (never matched) |

### 1. Subscribe as the matched volunteer

In one terminal:

```bash
websocat "ws://localhost:8080/ws/v1/incidents/volunteer?volunteer_id=VOL-145"
```

Any WebSocket client works (`websocat`, `wscat`, a browser console, Postman). Subscribing without a
`volunteer_id` is refused, because there would be no safe way to filter.

### 2. Fire an SOS

```bash
curl -i -X POST http://localhost:8080/api/v1/sos/trigger \
  -H "Content-Type: application/json" \
  -d '{"device_id":"DEV-4471","trigger_type":"CRASH_DETECTED","battery_level":42,
       "network_quality":"WEAK","cannot_speak":true,"threat_nearby":false,
       "timestamp":"2026-09-27T10:14:52Z"}'
```

```
HTTP/1.1 202 Accepted
{"capsule_id":"CR-4369"}
```

`VOL-145` receives exactly this, and nothing else:

```json
{
  "capsule_id": "CR-4369",
  "fsm_state": "EMERGENCY",
  "location": {
    "latitude": 17.385,
    "longitude": 78.4867,
    "updated_at": "2026-09-27T10:14:52Z"
  },
  "victim_name": "Jane Doe",
  "victim_age": 24,
  "victim_gender": "Female"
}
```

Six fields. No medical data, no hazard notes, no contacts, no OTP, no internal ids.

### 3. Respond as the volunteer

```bash
curl -X POST http://localhost:8080/api/v1/volunteer/response \
  -H "Content-Type: application/json" \
  -d '{"capsule_id":"CR-4369","volunteer_id":"VOL-145","action":"ACCEPT",
       "timestamp":"2026-09-27T10:17:40Z"}'
```

The FSM moves to `VOLUNTEER_ASSIGNED`, the same volunteer gets a state-change push, and both the
transition and the match are written to the audit trail. `DECLINE` instead re-matches to the next
best volunteer and pushes to them. `ARRIVED` writes an audit row and does nothing else — it does not
silence the victim's alert.

---

## How it fits together

```
com.safesphere
├── SafeSphereApplication      executable entry point, PORT, key resolution
├── BackendApplication         composition root, Javalin wiring
├── fsm/                       FsmState, TransitionResult, EmergencyStateEngine
├── api/                       Citizen DTOs, strict parser, payload whitelist, routes
├── domain/                    EmergencyCapsule, Telemetry, contract enums
├── incident/                  IncidentService, IncidentRegistry, CapsuleIdGenerator
├── matching/                  CapabilityMatcher, Haversine, MatchCandidate
├── persistence/               Database + schema, five repositories
├── security/                  EvidenceVault, OtpService
├── fixture/                   local development fixtures and provider interfaces
└── ws/                        VolunteerBroadcaster, channel adapter
```

### Design notes worth knowing

**Payload stripping is structural, not a filter.** Outbound Citizen JSON is built from an explicit
field whitelist in `CitizenPayloads`, and `VolunteerIncidentView` has no component that could hold
medical data, contacts, hazard notes, an OTP, or an internal id. Adding a field to a domain record
cannot leak it to a client. `CitizenPayloadsTest` asserts the exact key set and scans the serialized
payload for forbidden substrings.

**The FSM is the only thing that advances state.** Clients observe; they never transition. Illegal
hops such as `SAFE -> RESPONDER_ASSIGNED` are rejected and leave the machine untouched.

**The `CRASH_DETECTED` bypass is CV-free.** It depends only on the device-reported
`trigger_type` plus the current state — never on computer vision.

**Matching follows §10**, with one deliberate deviation: the reference SQL divides by
`distance_km` unguarded, which yields `NULL` (or infinity) for a responder standing exactly on the
incident. Proximity is capped at the score of a responder one metre away, so a zero-distance match
sorts first and deterministically. Ties break on responder id so ranking never depends on row order.

**An incident with no available volunteer is not an error.** It is still persisted, still returns
`202`, and still records an audit row. The user pressed the button either way.

**Volunteer filtering happens server-side.** A push is routed by the subscribed `volunteer_id`, so
a volunteer is never sent an incident they were not matched to. This does not depend on the client
discarding anything.

### Deliberate internal-only pieces

- `EmergencyCapsule` is not JSON-bindable and is never serialized whole. Its `toString` redacts the
  medical summary and evidence.
- `EvidenceVault` seals with a fresh 12-byte nonce per call under AES-256-GCM, and the key is always
  injected. Tampering fails authentication rather than decrypting to garbage.
- `OtpService` is a real, tested `SecureRandom` OTP with expiry and one-time use — and has **no
  route, channel, or field**. Silencing an alert is the Professional App's Field mode action, which
  has no citizen-facing surface here.

### Development fixtures, and why they exist

The frozen `SosTriggerEvent` carries no coordinates and no victim identity, yet the frozen
`VolunteerIncidentView` requires a `location` and three identity fields. Rather than widen a frozen
contract, the local demo resolves both from tables keyed by `device_id`
(`VictimProfileRepository`, `TelemetryFixtureRepository`), seeded with obviously fake people.

`FixtureAuthProvider` is **not authentication** — the contract sends a bare `volunteer_id` with no
credential, so it can only confirm the id exists. Real authentication is out of scope.

Every fixture class is labelled in its own Javadoc, and every name in it is invented.

---

## Not implemented, on purpose

| Excluded | Why |
|---|---|
| `POST /api/v1/telemetry` | Needs a separately contracted ingestion surface. |
| `POST /api/v1/agent/trigger` | Agent/IoT contract not given to this backend. |
| Admin / provisioning APIs | No real verification or provisioning exists. |
| Dispatch / decision API | Professional App surface. |
| Field / silence-ack API | Professional App Field mode; this is where silencing belongs. |
| Queue / official WebSocket channels | Professional App; a test asserts these paths do not exist. |
| Professional App DTOs or frontend | Separate repository, separate contract. |
| Real authentication | The contract carries no credential. |
| SMS, maps, push notifications | External/paid services, not needed for the local demo. |
| `hazard_notes` population | Always `null` until the §18 roadmap service exists. |

`medical_summary` also stays `null`: no citizen-facing surface supplies one, and the field belongs to
the Professional App's full-access view.

---

## Tests

323 tests, all against real behaviour — real SQLite, a real Javalin server, a real WebSocket.

| Area | Class |
|---|---|
| FSM and illegal transitions | `EmergencyStateEngineTest` |
| Crypto and failure cases | `EvidenceVaultTest` |
| OTP expiry and one-time use | `OtpServiceTest` |
| Matcher ordering and edge cases | `CapabilityMatcherTest` |
| Validation, 202 body, payload stripping | `CitizenPayloadsTest` |
| WebSocket filtering | `VolunteerBroadcasterTest` |
| SQLite schema and repositories | `RepositoriesTest` |
| ACCEPT / DECLINE / ARRIVED | `IncidentServiceTest` |
| Full local flow over HTTP + WSS | `CitizenFlowEndToEndTest` |
| Startup, PORT, excluded surfaces | `SafeSphereApplicationTest` |
