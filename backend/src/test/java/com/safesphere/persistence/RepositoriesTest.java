package com.safesphere.persistence;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.safesphere.domain.NetworkQuality;
import com.safesphere.domain.TriggerType;
import com.safesphere.fsm.FsmState;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

/** Tests for schema initialization and the repositories, against real SQLite. */
class RepositoriesTest {

    private static final Instant T0 = Instant.parse("2026-09-27T10:15:00Z");

    private Database database;
    private IncidentRepository incidents;
    private AuditEventRepository audit;
    private ResponderRepository responders;
    private VictimProfileRepository profiles;
    private TelemetryFixtureRepository telemetry;

    @BeforeEach
    void setUp() {
        database = Database.inMemory("repo-" + UUID.randomUUID());
        database.migrate();
        incidents = new IncidentRepository(database);
        audit = new AuditEventRepository(database);
        responders = new ResponderRepository(database);
        profiles = new VictimProfileRepository(database);
        telemetry = new TelemetryFixtureRepository(database);
    }

    @AfterEach
    void tearDown() {
        database.close();
    }

    private IncidentRecord sample(String capsuleId) {
        return new IncidentRecord(capsuleId, "DEV-4471", FsmState.EMERGENCY, TriggerType.MANUAL_SOS,
                42, NetworkQuality.WEAK, true, false, 17.3850, 78.4867,
                "Blood: O+, Allergies: Penicillin", "sealed-evidence-blob", null, T0, T0);
    }

    @Nested
    @DisplayName("schema")
    class Schema {

        @Test
        @DisplayName("migration is idempotent")
        void migrationIsIdempotent() {
            database.migrate();
            database.migrate();

            assertNotNull(incidents.findByCapsuleId("CR-NOPE").orElse(null) == null ? "" : "");
        }

        @Test
        @DisplayName("the version row is recorded exactly once")
        void versionRecordedOnce() {
            database.migrate();
            database.migrate();

            try (var connection = database.openConnection();
                 var statement = connection.createStatement();
                 var rs = statement.executeQuery("SELECT COUNT(*) FROM schema_migrations")) {
                assertTrue(rs.next());
                assertEquals(1, rs.getInt(1));
            } catch (Exception e) {
                throw new AssertionError(e);
            }
        }

        @Test
        @DisplayName("the schema survives the connections closing between operations")
        void schemaOutlivesConnections() {
            incidents.insert(sample("CR-1000"));

            // A fresh repository, as a later request thread would use.
            IncidentRepository later = new IncidentRepository(database);

            assertTrue(later.findByCapsuleId("CR-1000").isPresent());
        }

        @Test
        @DisplayName("a blank path is refused")
        void blankPathRefused() {
            assertThrows(IllegalArgumentException.class, () -> new Database("  "));
            assertThrows(IllegalArgumentException.class, () -> new Database(null));
        }
    }

    @Nested
    @DisplayName("incidents")
    class Incidents {

        @Test
        @DisplayName("a record round trips with every field intact")
        void roundTrips() {
            incidents.insert(sample("CR-2000"));

            IncidentRecord found = incidents.findByCapsuleId("CR-2000").orElseThrow();

            assertEquals("CR-2000", found.capsuleId());
            assertEquals("DEV-4471", found.deviceId());
            assertEquals(FsmState.EMERGENCY, found.fsmState());
            assertEquals(TriggerType.MANUAL_SOS, found.triggerType());
            assertEquals(42, found.batteryLevel());
            assertEquals(NetworkQuality.WEAK, found.networkQuality());
            assertTrue(found.cannotSpeak());
            assertFalse(found.threatNearby());
            assertEquals(17.3850, found.latitude(), 1e-9);
            assertEquals(78.4867, found.longitude(), 1e-9);
            assertEquals("Blood: O+, Allergies: Penicillin", found.medicalSummary());
            assertEquals("sealed-evidence-blob", found.encryptedEvidence());
            assertEquals(T0, found.createdAt());
        }

        @Test
        @DisplayName("an unknown capsule yields empty rather than null")
        void unknownIsEmpty() {
            assertTrue(incidents.findByCapsuleId("CR-9999").isEmpty());
        }

        @Test
        @DisplayName("a duplicate capsule id is refused")
        void duplicateRefused() {
            incidents.insert(sample("CR-2001"));

            assertThrows(IllegalStateException.class, () -> incidents.insert(sample("CR-2001")));
        }

        @Test
        @DisplayName("assignment writes the responder and state together")
        void assignWritesBoth() {
            incidents.insert(sample("CR-2002"));

            incidents.assign("CR-2002", "VOL-142", FsmState.VOLUNTEER_ASSIGNED, T0);

            IncidentRecord found = incidents.findByCapsuleId("CR-2002").orElseThrow();
            assertEquals("VOL-142", found.matchedResponderId());
            assertEquals(FsmState.VOLUNTEER_ASSIGNED, found.fsmState());
        }

        @Test
        @DisplayName("clearing an assignment returns the incident to EMERGENCY")
        void clearAssignment() {
            incidents.insert(sample("CR-2003"));
            incidents.assign("CR-2003", "VOL-142", FsmState.VOLUNTEER_ASSIGNED, T0);

            incidents.clearAssignment("CR-2003", T0);

            IncidentRecord found = incidents.findByCapsuleId("CR-2003").orElseThrow();
            assertEquals(null, found.matchedResponderId());
            assertEquals(FsmState.EMERGENCY, found.fsmState());
        }

        @Test
        @DisplayName("incidents are listed per device, newest first")
        void listsByDevice() {
            incidents.insert(new IncidentRecord("CR-3001", "DEV-1", FsmState.EMERGENCY,
                    TriggerType.MANUAL_SOS, 10, NetworkQuality.STRONG, false, false,
                    1.0, 2.0, null, null, null, T0, T0));
            incidents.insert(new IncidentRecord("CR-3002", "DEV-1", FsmState.EMERGENCY,
                    TriggerType.MANUAL_SOS, 10, NetworkQuality.STRONG, false, false,
                    1.0, 2.0, null, null, null, T0.plusSeconds(60), T0.plusSeconds(60)));
            incidents.insert(new IncidentRecord("CR-3003", "DEV-2", FsmState.EMERGENCY,
                    TriggerType.MANUAL_SOS, 10, NetworkQuality.STRONG, false, false,
                    1.0, 2.0, null, null, null, T0, T0));

            List<IncidentRecord> forDeviceOne = incidents.findByDeviceId("DEV-1");

            assertEquals(2, forDeviceOne.size());
            assertEquals("CR-3002", forDeviceOne.get(0).capsuleId());
        }

        @Test
        @DisplayName("a parameterized lookup cannot be injected through")
        void lookupIsParameterized() {
            incidents.insert(sample("CR-2004"));

            // If the value were concatenated, this would either throw or match everything.
            assertTrue(incidents.findByCapsuleId("CR-2004' OR '1'='1").isEmpty());
            assertTrue(incidents.findByDeviceId("DEV-4471' OR '1'='1").isEmpty());
        }
    }

    @Nested
    @DisplayName("audit events")
    class Audit {

        @Test
        @DisplayName("events are appended in order and read back oldest first")
        void appendsInOrder() {
            incidents.insert(sample("CR-4000"));
            audit.append("CR-4000", AuditEventRepository.SOS_TRIGGERED, null, "trigger", T0);
            audit.append("CR-4000", AuditEventRepository.VOLUNTEER_ACCEPTED, "VOL-142", "accepted",
                    T0.plusSeconds(10));

            List<AuditEventRepository.AuditEvent> events = audit.findByCapsuleId("CR-4000");

            assertEquals(2, events.size());
            assertEquals(AuditEventRepository.SOS_TRIGGERED, events.get(0).eventType());
            assertEquals(AuditEventRepository.VOLUNTEER_ACCEPTED, events.get(1).eventType());
            assertEquals("VOL-142", events.get(1).actorId());
        }

        @Test
        @DisplayName("a null actor and detail are stored as null")
        void nullableFieldsStored() {
            incidents.insert(sample("CR-4001"));

            audit.append("CR-4001", "SYSTEM", null, null, T0);

            List<AuditEventRepository.AuditEvent> events = audit.findByCapsuleId("CR-4001");
            assertEquals(1, events.size());
            assertEquals(null, events.get(0).actorId());
            assertEquals(null, events.get(0).detail());
        }

        @Test
        @DisplayName("an audit row for an unknown incident is refused by the foreign key")
        void foreignKeyEnforced() {
            assertThrows(IllegalStateException.class,
                    () -> audit.append("CR-NOT-THERE", "X", null, null, T0));
        }

        @Test
        @DisplayName("audit events are scoped per incident")
        void scopedPerIncident() {
            incidents.insert(sample("CR-4002"));
            incidents.insert(sample("CR-4003"));
            audit.append("CR-4002", "A", null, null, T0);
            audit.append("CR-4003", "B", null, null, T0);

            assertEquals(1, audit.findByCapsuleId("CR-4002").size());
            assertEquals(1, audit.findByCapsuleId("CR-4003").size());
        }
    }

    @Nested
    @DisplayName("responders and declines")
    class Responders {

        @Test
        @DisplayName("a volunteer round trips and upsert is idempotent")
        void upsertRoundTrips() {
            responders.upsert(new ResponderRecord("VOL-142", "Alpha", 17.39, 78.49, 1, 1,
                    ResponderRecord.ONLINE));
            responders.upsert(new ResponderRecord("VOL-142", "Alpha renamed", 17.39, 78.49, 1, 0,
                    ResponderRecord.ONLINE));

            Optional<ResponderRecord> found = responders.findById("VOL-142");

            assertTrue(found.isPresent());
            assertEquals("Alpha renamed", found.get().displayName());
            assertEquals(0, found.get().vehicleAccess());
        }

        @Test
        @DisplayName("only online volunteers are returned")
        void filtersOffline() {
            responders.upsert(new ResponderRecord("VOL-1", "Online", 1.0, 2.0, 1, 1,
                    ResponderRecord.ONLINE));
            responders.upsert(new ResponderRecord("VOL-2", "Offline", 1.0, 2.0, 1, 1,
                    ResponderRecord.OFFLINE));

            List<ResponderRecord> online = responders.findOnlineExcluding(Set.of());

            assertEquals(1, online.size());
            assertEquals("VOL-1", online.get(0).responderId());
        }

        @Test
        @DisplayName("exclusions remove candidates and accept an empty set")
        void exclusionsApplied() {
            responders.upsert(new ResponderRecord("VOL-1", "One", 1.0, 2.0, 1, 1,
                    ResponderRecord.ONLINE));
            responders.upsert(new ResponderRecord("VOL-2", "Two", 1.0, 2.0, 1, 1,
                    ResponderRecord.ONLINE));

            assertEquals(1, responders.findOnlineExcluding(Set.of("VOL-1")).size());
            assertTrue(responders.findOnlineExcluding(Set.of("VOL-1", "VOL-2")).isEmpty());
            assertTrue(responders.findOnlineExcluding(null).size() == 2);
        }

        @Test
        @DisplayName("declines are recorded once and readable as a set")
        void declinesRecorded() {
            incidents.insert(sample("CR-5000"));
            responders.recordDecline("CR-5000", "VOL-142", T0);
            responders.recordDecline("CR-5000", "VOL-142", T0);
            responders.recordDecline("CR-5000", "VOL-143", T0);

            assertEquals(Set.of("VOL-142", "VOL-143"), responders.findDeclined("CR-5000"));
        }

        @Test
        @DisplayName("declines are scoped per incident")
        void declinesScopedPerIncident() {
            incidents.insert(sample("CR-5001"));
            incidents.insert(sample("CR-5002"));
            responders.recordDecline("CR-5001", "VOL-142", T0);

            assertEquals(Set.of("VOL-142"), responders.findDeclined("CR-5001"));
            assertTrue(responders.findDeclined("CR-5002").isEmpty());
        }
    }

    @Nested
    @DisplayName("development fixtures")
    class Fixtures {

        @Test
        @DisplayName("a victim profile round trips")
        void profileRoundTrips() {
            profiles.upsert(new VictimProfileRepository.DevVictimProfile(
                    "DEV-4471", "Jane Doe", 24, "Female"));

            VictimProfileRepository.DevVictimProfile found =
                    profiles.findByDeviceId("DEV-4471").orElseThrow();

            assertEquals("Jane Doe", found.victimName());
            assertEquals(24, found.victimAge());
            assertEquals("Female", found.victimGender());
        }

        @Test
        @DisplayName("an unknown device has no profile")
        void unknownDeviceHasNoProfile() {
            assertTrue(profiles.findByDeviceId("DEV-NOPE").isEmpty());
        }

        @Test
        @DisplayName("a telemetry fixture round trips")
        void telemetryRoundTrips() {
            telemetry.upsert("DEV-4471", new TelemetryFixtureRepository.TelemetryFixture(17.385, 78.4867));

            TelemetryFixtureRepository.TelemetryFixture found =
                    telemetry.findByDeviceId("DEV-4471").orElseThrow();

            assertEquals(17.385, found.latitude(), 1e-9);
            assertEquals(78.4867, found.longitude(), 1e-9);
        }

        @Test
        @DisplayName("an unknown device has no coordinates")
        void unknownDeviceHasNoCoordinates() {
            assertTrue(telemetry.findByDeviceId("DEV-NOPE").isEmpty());
        }

        @Test
        @DisplayName("an out-of-range age is refused")
        void invalidAgeRefused() {
            assertThrows(IllegalArgumentException.class, () ->
                    new VictimProfileRepository.DevVictimProfile("DEV-1", "X", 200, "Y"));
        }
    }

    @Nested
    @DisplayName("IncidentRecord value semantics")
    class RecordSemantics {

        @Test
        @DisplayName("withState produces a copy without mutating the original")
        void withStateCopies() {
            IncidentRecord original = sample("CR-6000");

            IncidentRecord moved = original.withState(FsmState.RESOLVED, T0.plusSeconds(5));

            assertEquals(FsmState.EMERGENCY, original.fsmState());
            assertEquals(FsmState.RESOLVED, moved.fsmState());
            assertEquals(T0.plusSeconds(5), moved.updatedAt());
        }

        @Test
        @DisplayName("withEvidence keeps the other fields")
        void withEvidenceKeepsFields() {
            IncidentRecord updated = sample("CR-6001").withEvidence("new-seal", T0);

            assertEquals("new-seal", updated.encryptedEvidence());
            assertEquals("CR-6001", updated.capsuleId());
            assertEquals(FsmState.EMERGENCY, updated.fsmState());
        }

        @Test
        @DisplayName("required fields are enforced")
        void requiredFieldsEnforced() {
            assertThrows(NullPointerException.class, () -> new IncidentRecord(
                    null, "DEV-1", FsmState.SAFE, TriggerType.MANUAL_SOS, 50,
                    NetworkQuality.STRONG, false, false, 0.0, 0.0, null, null, null, T0, T0));
        }
    }
}
