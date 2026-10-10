package com.safesphere.incident;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.safesphere.api.SosTriggerEvent;
import com.safesphere.api.VolunteerAction;
import com.safesphere.api.VolunteerResponseEvent;
import com.safesphere.domain.NetworkQuality;
import com.safesphere.domain.TriggerType;
import com.safesphere.fixture.AuthProvider;
import com.safesphere.fixture.FixtureAuthProvider;
import com.safesphere.fixture.FixtureTelemetryProvider;
import com.safesphere.fixture.TelemetryProvider;
import com.safesphere.fsm.FsmState;
import com.safesphere.matching.CapabilityMatcher;
import com.safesphere.persistence.AuditEventRepository;
import com.safesphere.persistence.Database;
import com.safesphere.persistence.IncidentRecord;
import com.safesphere.persistence.IncidentRepository;
import com.safesphere.persistence.ResponderRecord;
import com.safesphere.persistence.ResponderRepository;
import com.safesphere.persistence.TelemetryFixtureRepository;
import com.safesphere.persistence.VictimProfileRepository;
import com.safesphere.security.EvidenceVault;
import com.safesphere.ws.VolunteerBroadcaster;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

/** Tests for the incident pipeline: trigger handling and the three volunteer actions. */
class IncidentServiceTest {

    private static final String DEVICE = "DEV-4471";
    private static final Instant T0 = Instant.parse("2026-09-27T10:15:00Z");

    private Database database;
    private IncidentRepository incidents;
    private AuditEventRepository audit;
    private ResponderRepository responders;
    private IncidentService service;
    private MutableClock clock;

    /** A clock the test can move forward, so expiry and timestamps are deterministic. */
    private static final class MutableClock extends Clock {
        private Instant now;

        MutableClock(Instant start) {
            this.now = start;
        }

        void advanceSeconds(long seconds) {
            now = now.plusSeconds(seconds);
        }

        @Override
        public ZoneOffset getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(java.time.ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return now;
        }
    }

    @BeforeEach
    void setUp() {
        database = Database.inMemory("svc-" + UUID.randomUUID());
        database.migrate();
        incidents = new IncidentRepository(database);
        audit = new AuditEventRepository(database);
        responders = new ResponderRepository(database);
        VictimProfileRepository profiles = new VictimProfileRepository(database);
        TelemetryFixtureRepository telemetryRepo = new TelemetryFixtureRepository(database);
        TelemetryProvider telemetry = new FixtureTelemetryProvider(telemetryRepo);
        AuthProvider auth = new FixtureAuthProvider(responders);
        clock = new MutableClock(T0);

        // The best candidate is deliberately VOL-1, so the ranking is predictable in these tests.
        responders.upsert(new ResponderRecord("VOL-1", "Closest skilled", 17.3850, 78.4867, 1, 1,
                ResponderRecord.ONLINE));
        responders.upsert(new ResponderRecord("VOL-2", "Second", 17.4500, 78.5500, 1, 0,
                ResponderRecord.ONLINE));
        profiles.upsert(new VictimProfileRepository.DevVictimProfile(DEVICE, "Jane Doe", 24, "Female"));
        telemetryRepo.upsert(DEVICE, new TelemetryFixtureRepository.TelemetryFixture(17.3850, 78.4867));

        service = new IncidentService(
                incidents, audit, responders, profiles, telemetry, auth,
                new CapabilityMatcher(responders),
                new EvidenceVault(EvidenceVault.generateKey()),
                new VolunteerBroadcaster(),
                new IncidentRegistry(incidents),
                new CapsuleIdGenerator(incidents),
                clock);
    }

    @AfterEach
    void tearDown() {
        database.close();
    }

    private SosTriggerEvent trigger(TriggerType type) {
        return new SosTriggerEvent(DEVICE, type, 42, NetworkQuality.WEAK, true, false, T0);
    }

    private VolunteerResponseEvent response(String capsuleId, String volunteerId, VolunteerAction action) {
        return new VolunteerResponseEvent(capsuleId, volunteerId, action, clock.instant());
    }

    @Nested
    @DisplayName("SOS handling")
    class SosHandling {

        @Test
        @DisplayName("a crash trigger reaches EMERGENCY through the bypass")
        void crashTakesTheBypass() {
            String capsuleId = service.handleSos(trigger(TriggerType.CRASH_DETECTED));

            assertEquals(FsmState.EMERGENCY, incidents.findByCapsuleId(capsuleId)
                    .orElseThrow().fsmState());
        }

        @Test
        @DisplayName("a manual trigger also reaches EMERGENCY, via the confirmation path")
        void manualReachesEmergency() {
            String capsuleId = service.handleSos(trigger(TriggerType.MANUAL_SOS));

            assertEquals(FsmState.EMERGENCY, incidents.findByCapsuleId(capsuleId)
                    .orElseThrow().fsmState());
        }

        @Test
        @DisplayName("a route deviation reaches EMERGENCY")
        void routeDeviationReachesEmergency() {
            String capsuleId = service.handleSos(trigger(TriggerType.ROUTE_DEVIATION));

            assertEquals(FsmState.EMERGENCY, incidents.findByCapsuleId(capsuleId)
                    .orElseThrow().fsmState());
        }

        @Test
        @DisplayName("the capsule id follows the CR-#### shape and is unique")
        void capsuleIdShapeAndUniqueness() {
            String first = service.handleSos(trigger(TriggerType.MANUAL_SOS));
            String second = service.handleSos(trigger(TriggerType.MANUAL_SOS));

            assertTrue(first.matches("CR-\\d{4,}"), first);
            assertFalse(first.equals(second));
        }

        @Test
        @DisplayName("the incident is persisted with the device's reported state")
        void persistsDeviceState() {
            String capsuleId = service.handleSos(trigger(TriggerType.CRASH_DETECTED));

            IncidentRecord stored = incidents.findByCapsuleId(capsuleId).orElseThrow();

            assertEquals(DEVICE, stored.deviceId());
            assertEquals(TriggerType.CRASH_DETECTED, stored.triggerType());
            assertEquals(42, stored.batteryLevel());
            assertEquals(NetworkQuality.WEAK, stored.networkQuality());
            assertTrue(stored.cannotSpeak());
            assertFalse(stored.threatNearby());
        }

        @Test
        @DisplayName("evidence is sealed, so the stored blob is not the plaintext")
        void evidenceIsSealed() {
            String capsuleId = service.handleSos(trigger(TriggerType.MANUAL_SOS));

            String sealed = incidents.findByCapsuleId(capsuleId).orElseThrow().encryptedEvidence();

            assertNotNull(sealed);
            assertFalse(sealed.contains(DEVICE), "the sealed blob must not expose the device id");
        }

        @Test
        @DisplayName("the best volunteer is assigned and recorded in the audit trail")
        void matchesBestVolunteer() {
            String capsuleId = service.handleSos(trigger(TriggerType.MANUAL_SOS));

            assertEquals("VOL-1",
                    incidents.findByCapsuleId(capsuleId).orElseThrow().matchedResponderId());

            List<AuditEventRepository.AuditEvent> events = audit.findByCapsuleId(capsuleId);
            assertEquals(AuditEventRepository.SOS_TRIGGERED, events.get(0).eventType());
            assertTrue(events.stream().anyMatch(e -> "VOLUNTEER_MATCHED".equals(e.eventType())));
        }

        @Test
        @DisplayName("an incident with no volunteers is still accepted and persisted")
        void noVolunteerIsStillAccepted() {
            Database empty = Database.inMemory("empty-" + UUID.randomUUID());
            empty.migrate();
            try {
                IncidentRepository emptyIncidents = new IncidentRepository(empty);
                ResponderRepository emptyResponders = new ResponderRepository(empty);
                VictimProfileRepository emptyProfiles = new VictimProfileRepository(empty);
                TelemetryFixtureRepository emptyTelemetry = new TelemetryFixtureRepository(empty);
                emptyProfiles.upsert(new VictimProfileRepository.DevVictimProfile(
                        DEVICE, "Jane Doe", 24, "Female"));
                emptyTelemetry.upsert(DEVICE,
                        new TelemetryFixtureRepository.TelemetryFixture(17.3850, 78.4867));

                IncidentService bareService = new IncidentService(
                        emptyIncidents, new AuditEventRepository(empty), emptyResponders, emptyProfiles,
                        new FixtureTelemetryProvider(emptyTelemetry),
                        new FixtureAuthProvider(emptyResponders),
                        new CapabilityMatcher(emptyResponders),
                        new EvidenceVault(EvidenceVault.generateKey()),
                        new VolunteerBroadcaster(),
                        new IncidentRegistry(emptyIncidents),
                        new CapsuleIdGenerator(emptyIncidents),
                        clock);

                String capsuleId = bareService.handleSos(trigger(TriggerType.MANUAL_SOS));

                IncidentRecord stored = emptyIncidents.findByCapsuleId(capsuleId).orElseThrow();
                assertEquals(FsmState.EMERGENCY, stored.fsmState());
                assertNull(stored.matchedResponderId());
            } finally {
                empty.close();
            }
        }

        @Test
        @DisplayName("the medical summary stays null, since no citizen surface supplies one")
        void medicalSummaryStaysNull() {
            String capsuleId = service.handleSos(trigger(TriggerType.MANUAL_SOS));

            assertNull(incidents.findByCapsuleId(capsuleId).orElseThrow().medicalSummary());
        }
    }

    @Nested
    @DisplayName("ACCEPT")
    class Accept {

        @Test
        @DisplayName("accepting moves the incident to VOLUNTEER_ASSIGNED")
        void acceptMovesToVolunteerAssigned() {
            String capsuleId = service.handleSos(trigger(TriggerType.MANUAL_SOS));

            VolunteerOutcome outcome =
                    service.handleVolunteerResponse(response(capsuleId, "VOL-1", VolunteerAction.ACCEPT));

            assertEquals(VolunteerOutcome.ACCEPTED, outcome);
            assertEquals(FsmState.VOLUNTEER_ASSIGNED,
                    incidents.findByCapsuleId(capsuleId).orElseThrow().fsmState());
        }

        @Test
        @DisplayName("accepting is audited against the volunteer")
        void acceptIsAudited() {
            String capsuleId = service.handleSos(trigger(TriggerType.MANUAL_SOS));

            service.handleVolunteerResponse(response(capsuleId, "VOL-1", VolunteerAction.ACCEPT));

            assertTrue(audit.findByCapsuleId(capsuleId).stream()
                    .anyMatch(e -> AuditEventRepository.VOLUNTEER_ACCEPTED.equals(e.eventType())
                            && "VOL-1".equals(e.actorId())));
        }

        @Test
        @DisplayName("accepting twice by the same volunteer is idempotent")
        void repeatedAcceptIsIdempotent() {
            String capsuleId = service.handleSos(trigger(TriggerType.MANUAL_SOS));
            service.handleVolunteerResponse(response(capsuleId, "VOL-1", VolunteerAction.ACCEPT));

            VolunteerOutcome second =
                    service.handleVolunteerResponse(response(capsuleId, "VOL-1", VolunteerAction.ACCEPT));

            assertEquals(VolunteerOutcome.ACCEPTED, second);
            assertEquals(FsmState.VOLUNTEER_ASSIGNED,
                    incidents.findByCapsuleId(capsuleId).orElseThrow().fsmState());
        }

        @Test
        @DisplayName("a volunteer who was not assigned cannot accept")
        void unassignedCannotAccept() {
            String capsuleId = service.handleSos(trigger(TriggerType.MANUAL_SOS));

            VolunteerResponseRejected e = assertThrows(VolunteerResponseRejected.class,
                    () -> service.handleVolunteerResponse(
                            response(capsuleId, "VOL-2", VolunteerAction.ACCEPT)));

            assertEquals(ResponseRejection.NOT_ASSIGNED, e.rejection());
            assertEquals(FsmState.EMERGENCY,
                    incidents.findByCapsuleId(capsuleId).orElseThrow().fsmState());
        }
    }

    @Nested
    @DisplayName("DECLINE")
    class Decline {

        @Test
        @DisplayName("declining re-matches to the next best volunteer")
        void declineRematches() {
            String capsuleId = service.handleSos(trigger(TriggerType.MANUAL_SOS));
            assertEquals("VOL-1", incidents.findByCapsuleId(capsuleId).orElseThrow().matchedResponderId());

            VolunteerOutcome outcome =
                    service.handleVolunteerResponse(response(capsuleId, "VOL-1", VolunteerAction.DECLINE));

            assertEquals(VolunteerOutcome.DECLINED_REMATCHED, outcome);
            assertEquals("VOL-2", incidents.findByCapsuleId(capsuleId).orElseThrow().matchedResponderId());
        }

        @Test
        @DisplayName("a decline keeps the incident in EMERGENCY rather than resolving it")
        void declineKeepsEmergency() {
            String capsuleId = service.handleSos(trigger(TriggerType.MANUAL_SOS));

            service.handleVolunteerResponse(response(capsuleId, "VOL-1", VolunteerAction.DECLINE));

            assertEquals(FsmState.EMERGENCY,
                    incidents.findByCapsuleId(capsuleId).orElseThrow().fsmState());
        }

        @Test
        @DisplayName("the declining volunteer is excluded from later matching")
        void declinerIsExcluded() {
            String capsuleId = service.handleSos(trigger(TriggerType.MANUAL_SOS));

            service.handleVolunteerResponse(response(capsuleId, "VOL-1", VolunteerAction.DECLINE));

            assertTrue(responders.findDeclined(capsuleId).contains("VOL-1"));
        }

        @Test
        @DisplayName("declining is audited")
        void declineIsAudited() {
            String capsuleId = service.handleSos(trigger(TriggerType.MANUAL_SOS));

            service.handleVolunteerResponse(response(capsuleId, "VOL-1", VolunteerAction.DECLINE));

            assertTrue(audit.findByCapsuleId(capsuleId).stream()
                    .anyMatch(e -> AuditEventRepository.VOLUNTEER_DECLINED.equals(e.eventType())));
        }

        @Test
        @DisplayName("declining when nobody else is available leaves the incident open")
        void declineWithNoCandidateLeavesIncidentOpen() {
            String capsuleId = service.handleSos(trigger(TriggerType.MANUAL_SOS));
            // Remove the second-best candidate so VOL-1 is the only one.
            responders.upsert(new ResponderRecord("VOL-2", "Second", 17.4500, 78.5500, 1, 0,
                    ResponderRecord.OFFLINE));

            VolunteerOutcome outcome =
                    service.handleVolunteerResponse(response(capsuleId, "VOL-1", VolunteerAction.DECLINE));

            assertEquals(VolunteerOutcome.DECLINED_NO_CANDIDATE, outcome);
            IncidentRecord stored = incidents.findByCapsuleId(capsuleId).orElseThrow();
            assertEquals(FsmState.EMERGENCY, stored.fsmState());
            assertNull(stored.matchedResponderId());
        }

        @Test
        @DisplayName("declining after accepting is refused, since the FSM has no way back")
        void declineAfterAcceptIsRefused() {
            String capsuleId = service.handleSos(trigger(TriggerType.MANUAL_SOS));
            service.handleVolunteerResponse(response(capsuleId, "VOL-1", VolunteerAction.ACCEPT));

            VolunteerResponseRejected e = assertThrows(VolunteerResponseRejected.class,
                    () -> service.handleVolunteerResponse(
                            response(capsuleId, "VOL-1", VolunteerAction.DECLINE)));

            assertEquals(ResponseRejection.INVALID_STATE, e.rejection());
        }
    }

    @Nested
    @DisplayName("ARRIVED")
    class Arrived {

        private String acceptedIncident() {
            String capsuleId = service.handleSos(trigger(TriggerType.MANUAL_SOS));
            service.handleVolunteerResponse(response(capsuleId, "VOL-1", VolunteerAction.ACCEPT));
            return capsuleId;
        }

        @Test
        @DisplayName("arrival is recorded in the audit trail")
        void arrivalIsAudited() {
            String capsuleId = acceptedIncident();

            VolunteerOutcome outcome =
                    service.handleVolunteerResponse(response(capsuleId, "VOL-1", VolunteerAction.ARRIVED));

            assertEquals(VolunteerOutcome.ARRIVED_LOGGED, outcome);
            assertTrue(audit.findByCapsuleId(capsuleId).stream()
                    .anyMatch(e -> AuditEventRepository.VOLUNTEER_ARRIVED.equals(e.eventType())
                            && "VOL-1".equals(e.actorId())));
        }

        @Test
        @DisplayName("arrival does not advance the FSM")
        void arrivalDoesNotAdvanceTheFsm() {
            String capsuleId = acceptedIncident();
            FsmState before = incidents.findByCapsuleId(capsuleId).orElseThrow().fsmState();

            service.handleVolunteerResponse(response(capsuleId, "VOL-1", VolunteerAction.ARRIVED));

            assertEquals(before, incidents.findByCapsuleId(capsuleId).orElseThrow().fsmState());
        }

        @Test
        @DisplayName("arrival does not resolve the incident")
        void arrivalDoesNotResolve() {
            String capsuleId = acceptedIncident();

            service.handleVolunteerResponse(response(capsuleId, "VOL-1", VolunteerAction.ARRIVED));

            assertFalse(FsmState.RESOLVED == incidents.findByCapsuleId(capsuleId).orElseThrow().fsmState(),
                    "a volunteer arrival is not a dispatcher close");
        }

        @Test
        @DisplayName("arrival by an unassigned volunteer is refused")
        void unassignedCannotReportArrival() {
            String capsuleId = acceptedIncident();

            VolunteerResponseRejected e = assertThrows(VolunteerResponseRejected.class,
                    () -> service.handleVolunteerResponse(
                            response(capsuleId, "VOL-2", VolunteerAction.ARRIVED)));

            assertEquals(ResponseRejection.NOT_ASSIGNED, e.rejection());
        }

        @Test
        @DisplayName("arrival before accepting is refused")
        void arrivalBeforeAcceptIsRefused() {
            String capsuleId = service.handleSos(trigger(TriggerType.MANUAL_SOS));

            VolunteerResponseRejected e = assertThrows(VolunteerResponseRejected.class,
                    () -> service.handleVolunteerResponse(
                            response(capsuleId, "VOL-1", VolunteerAction.ARRIVED)));

            assertEquals(ResponseRejection.INVALID_STATE, e.rejection());
        }
    }

    @Nested
    @DisplayName("rejections")
    class Rejections {

        @Test
        @DisplayName("an unknown incident is refused")
        void unknownIncidentRefused() {
            VolunteerResponseRejected e = assertThrows(VolunteerResponseRejected.class,
                    () -> service.handleVolunteerResponse(
                            response("CR-0000", "VOL-1", VolunteerAction.ACCEPT)));

            assertEquals(ResponseRejection.UNKNOWN_INCIDENT, e.rejection());
        }

        @Test
        @DisplayName("an unknown volunteer is refused")
        void unknownVolunteerRefused() {
            String capsuleId = service.handleSos(trigger(TriggerType.MANUAL_SOS));

            VolunteerResponseRejected e = assertThrows(VolunteerResponseRejected.class,
                    () -> service.handleVolunteerResponse(
                            response(capsuleId, "VOL-NOBODY", VolunteerAction.ACCEPT)));

            assertEquals(ResponseRejection.UNKNOWN_VOLUNTEER, e.rejection());
        }
    }
}
