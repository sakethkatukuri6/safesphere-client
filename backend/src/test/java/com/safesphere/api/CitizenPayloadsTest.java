package com.safesphere.api;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.JsonNode;
import com.safesphere.domain.NetworkQuality;
import com.safesphere.domain.TriggerType;
import com.safesphere.fsm.FsmState;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

/**
 * Tests for the frozen Citizen wire payloads: strict inbound validation, and outbound payloads that
 * carry exactly the documented fields and nothing else.
 */
class CitizenPayloadsTest {

    private static final String VALID_SOS = """
            {
              "device_id": "DEV-4471",
              "trigger_type": "CRASH_DETECTED",
              "battery_level": 42,
              "network_quality": "WEAK",
              "cannot_speak": true,
              "threat_nearby": false,
              "timestamp": "2026-09-27T10:14:52Z"
            }""";

    private static final String VALID_RESPONSE = """
            {
              "capsule_id": "CR-8924",
              "volunteer_id": "VOL-142",
              "action": "ARRIVED",
              "timestamp": "2026-09-27T10:17:40Z"
            }""";

    private static JsonNode parse(String json) {
        try {
            return CitizenPayloads.mapper().readTree(json);
        } catch (Exception e) {
            throw new AssertionError("emitted payload is not valid JSON: " + json, e);
        }
    }

    @Nested
    @DisplayName("SosTriggerEvent parsing")
    class SosParsing {

        @Test
        @DisplayName("the contract example parses to the documented values")
        void parsesContractExample() {
            SosTriggerEvent event = CitizenPayloads.parseSosTrigger(VALID_SOS);

            assertEquals("DEV-4471", event.device_id());
            assertEquals(TriggerType.CRASH_DETECTED, event.trigger_type());
            assertEquals(42, event.battery_level());
            assertEquals(NetworkQuality.WEAK, event.network_quality());
            assertTrue(event.cannot_speak());
            assertFalse(event.threat_nearby());
            assertEquals(Instant.parse("2026-09-27T10:14:52Z"), event.timestamp());
        }

        @ParameterizedTest(name = "{0} is an accepted trigger type")
        @ValueSource(strings = {"MANUAL_SOS", "CRASH_DETECTED", "ROUTE_DEVIATION"})
        void acceptsEveryDocumentedTrigger(String trigger) {
            String body = VALID_SOS.replace("CRASH_DETECTED", trigger);

            assertEquals(trigger, CitizenPayloads.parseSosTrigger(body).trigger_type().name());
        }

        @ParameterizedTest(name = "{0} is an accepted network quality")
        @ValueSource(strings = {"STRONG", "WEAK", "OFFLINE"})
        void acceptsEveryDocumentedNetworkQuality(String quality) {
            String body = VALID_SOS.replace("\"WEAK\"", "\"" + quality + "\"");

            assertEquals(quality, CitizenPayloads.parseSosTrigger(body).network_quality().name());
        }

        @Test
        @DisplayName("an unknown field is rejected rather than ignored")
        void unknownFieldRejected() {
            String body = VALID_SOS.replace("\"device_id\"", "\"latitude\": 17.3, \"device_id\"");

            InvalidCitizenRequest e =
                    assertThrows(InvalidCitizenRequest.class, () -> CitizenPayloads.parseSosTrigger(body));

            assertTrue(e.getMessage().contains("unknown field"), e.getMessage());
        }

        @ParameterizedTest(name = "a medical field on the wire is rejected: {0}")
        @ValueSource(strings = {"blood_type", "medical_summary", "allergies", "silence_otp",
                "emergency_contacts", "hazard_notes", "victim_name", "latitude", "longitude"})
        void medicalAndInternalFieldsRejected(String field) {
            String body = VALID_SOS.replace("\"device_id\"", "\"" + field + "\": \"x\", \"device_id\"");

            assertThrows(InvalidCitizenRequest.class, () -> CitizenPayloads.parseSosTrigger(body),
                    field + " is not part of SosTriggerEvent and must be refused");
        }

        @ParameterizedTest(name = "a missing {0} is rejected")
        @ValueSource(strings = {"device_id", "trigger_type", "battery_level", "network_quality",
                "cannot_speak", "threat_nearby", "timestamp"})
        void missingFieldRejected(String field) {
            String body = removeField(VALID_SOS, field);

            InvalidCitizenRequest e =
                    assertThrows(InvalidCitizenRequest.class, () -> CitizenPayloads.parseSosTrigger(body));

            assertTrue(e.getMessage().contains(field), e.getMessage());
        }

        @ParameterizedTest(name = "battery_level {0} is out of range")
        @ValueSource(strings = {"-1", "101", "1000", "-100"})
        void batteryRangeEnforced(String level) {
            String body = VALID_SOS.replace("\"battery_level\": 42", "\"battery_level\": " + level);

            assertThrows(InvalidCitizenRequest.class, () -> CitizenPayloads.parseSosTrigger(body));
        }

        @ParameterizedTest(name = "battery_level {0} is in range")
        @ValueSource(strings = {"0", "1", "50", "100"})
        void batteryBoundsAccepted(String level) {
            String body = VALID_SOS.replace("\"battery_level\": 42", "\"battery_level\": " + level);

            assertEquals(Integer.parseInt(level), CitizenPayloads.parseSosTrigger(body).battery_level());
        }

        @Test
        @DisplayName("a fractional battery level is rejected")
        void fractionalBatteryRejected() {
            String body = VALID_SOS.replace("\"battery_level\": 42", "\"battery_level\": 42.5");

            assertThrows(InvalidCitizenRequest.class, () -> CitizenPayloads.parseSosTrigger(body));
        }

        @Test
        @DisplayName("an unknown trigger type is rejected")
        void unknownTriggerRejected() {
            String body = VALID_SOS.replace("CRASH_DETECTED", "PANIC_BUTTON");

            InvalidCitizenRequest e =
                    assertThrows(InvalidCitizenRequest.class, () -> CitizenPayloads.parseSosTrigger(body));

            assertTrue(e.getMessage().contains("trigger_type"), e.getMessage());
        }

        @Test
        @DisplayName("a lowercase enum is rejected, since the contract is uppercase")
        void lowercaseEnumRejected() {
            String body = VALID_SOS.replace("CRASH_DETECTED", "crash_detected");

            assertThrows(InvalidCitizenRequest.class, () -> CitizenPayloads.parseSosTrigger(body));
        }

        @ParameterizedTest(name = "an unparseable timestamp is rejected: {0}")
        @ValueSource(strings = {"not-a-date", "2026-13-45T99:99:99Z", "27/09/2026", "1758912345"})
        void timestampValidated(String timestamp) {
            String body = VALID_SOS.replace("2026-09-27T10:14:52Z", timestamp);

            assertThrows(InvalidCitizenRequest.class, () -> CitizenPayloads.parseSosTrigger(body));
        }

        @Test
        @DisplayName("a non-ISO offset timestamp is accepted, since ISO-8601 permits it")
        void offsetTimestampAccepted() {
            String body = VALID_SOS.replace("2026-09-27T10:14:52Z", "2026-09-27T15:44:52+05:30");

            assertEquals(Instant.parse("2026-09-27T10:14:52Z"),
                    CitizenPayloads.parseSosTrigger(body).timestamp());
        }

        @ParameterizedTest(name = "a malformed body is rejected: {0}")
        @ValueSource(strings = {"", "   ", "not json", "[]", "\"a string\"", "42", "null"})
        void malformedBodyRejected(String body) {
            assertThrows(InvalidCitizenRequest.class, () -> CitizenPayloads.parseSosTrigger(body));
        }

        @Test
        @DisplayName("a null body is rejected")
        void nullBodyRejected() {
            assertThrows(InvalidCitizenRequest.class, () -> CitizenPayloads.parseSosTrigger(null));
        }

        @Test
        @DisplayName("a blank device id is rejected")
        void blankDeviceIdRejected() {
            String body = VALID_SOS.replace("\"DEV-4471\"", "\"   \"");

            assertThrows(InvalidCitizenRequest.class, () -> CitizenPayloads.parseSosTrigger(body));
        }

        @Test
        @DisplayName("a null value for a present field is treated as missing")
        void explicitNullRejected() {
            String body = VALID_SOS.replace("\"battery_level\": 42", "\"battery_level\": null");

            assertThrows(InvalidCitizenRequest.class, () -> CitizenPayloads.parseSosTrigger(body));
        }
    }

    @Nested
    @DisplayName("VolunteerResponseEvent parsing")
    class VolunteerResponseParsing {

        @Test
        @DisplayName("the contract example parses to the documented values")
        void parsesContractExample() {
            VolunteerResponseEvent event = CitizenPayloads.parseVolunteerResponse(VALID_RESPONSE);

            assertEquals("CR-8924", event.capsule_id());
            assertEquals("VOL-142", event.volunteer_id());
            assertEquals(VolunteerAction.ARRIVED, event.action());
            assertEquals(Instant.parse("2026-09-27T10:17:40Z"), event.timestamp());
        }

        @ParameterizedTest(name = "{0} is an accepted action")
        @ValueSource(strings = {"ACCEPT", "DECLINE", "ARRIVED"})
        void acceptsEveryDocumentedAction(String action) {
            String body = VALID_RESPONSE.replace("ARRIVED", action);

            assertEquals(action, CitizenPayloads.parseVolunteerResponse(body).action().name());
        }

        @Test
        @DisplayName("an undocumented action is rejected")
        void unknownActionRejected() {
            String body = VALID_RESPONSE.replace("ARRIVED", "SILENCE");

            assertThrows(InvalidCitizenRequest.class,
                    () -> CitizenPayloads.parseVolunteerResponse(body));
        }

        @Test
        @DisplayName("an unknown field is rejected")
        void unknownFieldRejected() {
            String body = VALID_RESPONSE.replace("\"action\"", "\"silence_otp\": \"482913\", \"action\"");

            assertThrows(InvalidCitizenRequest.class,
                    () -> CitizenPayloads.parseVolunteerResponse(body));
        }

        @Test
        @DisplayName("the SOS-only device_id field is not accepted here")
        void sosFieldRejected() {
            String body = VALID_RESPONSE.replace("\"capsule_id\"", "\"device_id\": \"DEV-1\", \"capsule_id\"");

            assertThrows(InvalidCitizenRequest.class,
                    () -> CitizenPayloads.parseVolunteerResponse(body));
        }
    }

    @Nested
    @DisplayName("the 202 response body")
    class AcceptedResponse {

        @Test
        @DisplayName("contains exactly one field, capsule_id")
        void containsOnlyCapsuleId() {
            JsonNode node = parse(CitizenPayloads.sosAccepted("CR-8924"));

            assertEquals(1, node.size());
            assertTrue(node.has("capsule_id"));
            assertEquals("CR-8924", node.get("capsule_id").asText());
        }

        @Test
        @DisplayName("leaks nothing else about the incident")
        void leaksNothingElse() {
            JsonNode node = parse(CitizenPayloads.sosAccepted("CR-8924"));
            List<String> fields = new ArrayList<>();
            node.fieldNames().forEachRemaining(fields::add);

            assertEquals(List.of("capsule_id"), fields);
        }
    }

    @Nested
    @DisplayName("VolunteerIncidentView stripping")
    class ViewStripping {

        private VolunteerIncidentView sampleView() {
            return new VolunteerIncidentView(
                    "CR-8924",
                    FsmState.EMERGENCY,
                    "Jane Doe",
                    24,
                    "Female",
                    new VolunteerIncidentView.IncidentLocation(
                            17.3850, 78.4867, Instant.parse("2026-09-27T10:15:30Z")));
        }

        @Test
        @DisplayName("contains exactly the six documented top-level fields")
        void containsExactlyTheContractFields() {
            JsonNode node = parse(CitizenPayloads.volunteerIncident(sampleView()));
            Set<String> actual = new HashSet<>();
            node.fieldNames().forEachRemaining(actual::add);

            assertEquals(Set.of("capsule_id", "fsm_state", "victim_name", "victim_age",
                    "victim_gender", "location"), actual);
        }

        @Test
        @DisplayName("the location object contains exactly latitude, longitude, and updated_at")
        void locationShapeIsExact() {
            JsonNode location = parse(CitizenPayloads.volunteerIncident(sampleView())).get("location");
            Set<String> actual = new HashSet<>();
            location.fieldNames().forEachRemaining(actual::add);

            assertEquals(Set.of("latitude", "longitude", "updated_at"), actual);
        }

        @Test
        @DisplayName("the values match the contract example")
        void valuesMatchTheExample() {
            JsonNode node = parse(CitizenPayloads.volunteerIncident(sampleView()));

            assertEquals("CR-8924", node.get("capsule_id").asText());
            assertEquals("EMERGENCY", node.get("fsm_state").asText());
            assertEquals("Jane Doe", node.get("victim_name").asText());
            assertEquals(24, node.get("victim_age").asInt());
            assertEquals("Female", node.get("victim_gender").asText());
            assertEquals(17.3850, node.get("location").get("latitude").asDouble(), 1e-9);
            assertEquals(78.4867, node.get("location").get("longitude").asDouble(), 1e-9);
            assertEquals("2026-09-27T10:15:30Z", node.get("location").get("updated_at").asText());
        }

        @Test
        @DisplayName("the whole serialized payload has no medical, contact, or OTP field")
        void noSensitiveFieldAnywhere() {
            String json = CitizenPayloads.volunteerIncident(sampleView()).toLowerCase();

            for (String forbidden : new String[]{
                    "medical", "blood", "allerg", "condition", "contact", "phone",
                    "hazard", "otp", "silence", "evidence", "encrypt", "device_id",
                    "battery", "network", "cannot_speak", "threat", "internal", "debug",
                    "responder_id", "matched", "latitude_longitude"}) {
                assertFalse(json.contains(forbidden),
                        "the volunteer payload must not contain '" + forbidden + "': " + json);
            }
        }

        @Test
        @DisplayName("the view record itself has no component that could hold sensitive data")
        void recordHasNoSensitiveComponent() {
            List<String> components = new ArrayList<>();
            for (var component : VolunteerIncidentView.class.getRecordComponents()) {
                components.add(component.getName());
            }

            assertEquals(List.of("capsuleId", "fsmState", "victimName", "victimAge",
                    "victimGender", "location"), components);
        }

        @Test
        @DisplayName("a VOLUNTEER_ASSIGNED state is serialized under its contract name")
        void serializesStateName() {
            VolunteerIncidentView assigned = new VolunteerIncidentView(
                    "CR-1", FsmState.VOLUNTEER_ASSIGNED, "A", 1, "B",
                    new VolunteerIncidentView.IncidentLocation(
                            1.0, 2.0, Instant.parse("2026-09-27T10:15:30Z")));

            assertEquals("VOLUNTEER_ASSIGNED",
                    parse(CitizenPayloads.volunteerIncident(assigned)).get("fsm_state").asText());
        }
    }

    /** Removes a top-level field from a JSON object literal, leaving the rest valid. */
    private static String removeField(String json, String field) {
        try {
            var node = (com.fasterxml.jackson.databind.node.ObjectNode)
                    CitizenPayloads.mapper().readTree(json);
            node.remove(field);
            return CitizenPayloads.mapper().writeValueAsString(node);
        } catch (Exception e) {
            throw new AssertionError("test helper failed for field " + field, e);
        }
    }
}
