package com.safesphere;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.JsonNode;
import com.safesphere.api.CitizenPayloads;
import com.safesphere.fsm.FsmState;
import com.safesphere.persistence.AuditEventRepository;
import com.safesphere.persistence.Database;
import com.safesphere.persistence.IncidentRecord;
import com.safesphere.persistence.IncidentRepository;
import com.safesphere.security.EvidenceVault;
import java.io.IOException;
import java.net.ServerSocket;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.WebSocket;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

/**
 * End-to-end test of the local Citizen-only demo over real HTTP and a real WebSocket.
 *
 * <p>Covers the sequence the backend is meant to be demoable with no UI at all: seed fixtures, fire
 * an SOS, receive the stripped incident on the matched volunteer's socket, respond, and confirm the
 * result was persisted and audited.
 */
class CitizenFlowEndToEndTest {

    private static final Duration TIMEOUT = Duration.ofSeconds(20);

    private Database database;
    private BackendApplication backend;
    private int port;
    private IncidentRepository incidents;
    private AuditEventRepository audit;
    private HttpClient http;

    @BeforeEach
    void startBackend() throws IOException {
        database = Database.inMemory("e2e-" + UUID.randomUUID());
        port = freePort();
        backend = new BackendApplication(
                database, new EvidenceVault(EvidenceVault.generateKey()), Clock.systemUTC(), true);
        backend.start(port);
        incidents = new IncidentRepository(database);
        audit = new AuditEventRepository(database);
        http = HttpClient.newBuilder().connectTimeout(TIMEOUT).build();
    }

    @AfterEach
    void stopBackend() {
        if (backend != null) {
            backend.close();
        }
        if (database != null) {
            database.close();
        }
    }

    private static int freePort() throws IOException {
        try (ServerSocket socket = new ServerSocket(0)) {
            return socket.getLocalPort();
        }
    }

    private String url(String path) {
        return "http://localhost:" + port + path;
    }

    private HttpResponse<String> post(String path, String body) throws Exception {
        return http.send(HttpRequest.newBuilder(URI.create(url(path)))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build(), HttpResponse.BodyHandlers.ofString());
    }

    private static String sosBody(String deviceId, String triggerType) {
        return """
                {
                  "device_id": "%s",
                  "trigger_type": "%s",
                  "battery_level": 42,
                  "network_quality": "WEAK",
                  "cannot_speak": true,
                  "threat_nearby": false,
                  "timestamp": "2026-09-27T10:14:52Z"
                }""".formatted(deviceId, triggerType);
    }

    /** A live volunteer socket that collects the messages pushed to it. */
    private static final class VolunteerSocket implements AutoCloseable {
        private final WebSocket socket;
        private final BlockingQueue<String> messages = new LinkedBlockingQueue<>();
        private final StringBuilder partial = new StringBuilder();

        VolunteerSocket(int port, String volunteerId) throws Exception {
            URI uri = URI.create("ws://localhost:" + port
                    + "/ws/v1/incidents/volunteer?volunteer_id=" + volunteerId);
            socket = httpClient().newWebSocketBuilder()
                    .connectTimeout(TIMEOUT)
                    .buildAsync(uri, new WebSocket.Listener() {
                        @Override
                        public java.util.concurrent.CompletionStage<?> onText(
                                WebSocket webSocket, CharSequence data, boolean last) {
                            partial.append(data);
                            if (last) {
                                messages.add(partial.toString());
                                partial.setLength(0);
                                webSocket.request(1);
                            }
                            return null;
                        }
                    })
                    .get(TIMEOUT.toSeconds(), TimeUnit.SECONDS);
        }

        private static HttpClient httpClient() {
            return HttpClient.newBuilder().connectTimeout(TIMEOUT).build();
        }

        /** The next pushed message, or null if none arrives within the timeout. */
        String poll() throws InterruptedException {
            return messages.poll(TIMEOUT.toSeconds(), TimeUnit.SECONDS);
        }

        @Override
        public void close() {
            socket.sendClose(WebSocket.NORMAL_CLOSURE, "done");
        }
    }

    /** Waits for the backend to have registered the volunteer as a subscriber. */
    private void awaitSubscriber(String volunteerId) throws InterruptedException {
        long deadline = System.nanoTime() + TIMEOUT.toNanos();
        while (System.nanoTime() < deadline) {
            if (backend.broadcaster().isSubscribed(volunteerId)) {
                return;
            }
            Thread.sleep(25);
        }
        throw new AssertionError("volunteer " + volunteerId + " never subscribed");
    }

    @Nested
    @DisplayName("health")
    class Health {

        @Test
        @DisplayName("GET /health reports ok as JSON")
        void healthIsOk() throws Exception {
            HttpResponse<String> response = http.send(
                    HttpRequest.newBuilder(URI.create(url("/health"))).build(),
                    HttpResponse.BodyHandlers.ofString());

            assertEquals(200, response.statusCode());
            JsonNode body = CitizenPayloads.mapper().readTree(response.body());
            assertEquals("ok", body.get("status").asText());
        }

        @Test
        @DisplayName("health leaks no incident or host detail")
        void healthLeaksNothing() throws Exception {
            HttpResponse<String> response = http.send(
                    HttpRequest.newBuilder(URI.create(url("/health"))).build(),
                    HttpResponse.BodyHandlers.ofString());

            String body = response.body().toLowerCase();
            for (String forbidden : new String[]{"capsule", "incident", "device", "latitude",
                    "longitude", "localhost", "jdbc", "sqlite"}) {
                assertFalse(body.contains(forbidden),
                        "health must not expose '" + forbidden + "': " + body);
            }
        }
    }

    @Nested
    @DisplayName("SOS trigger over HTTP")
    class SosOverHttp {

        @Test
        @DisplayName("a valid trigger returns 202 with only the capsule id")
        void returns202WithCapsuleId() throws Exception {
            HttpResponse<String> response =
                    post("/api/v1/sos/trigger", sosBody("DEV-4471", "CRASH_DETECTED"));

            assertEquals(202, response.statusCode());
            JsonNode body = CitizenPayloads.mapper().readTree(response.body());
            assertEquals(1, body.size());
            assertTrue(body.get("capsule_id").asText().matches("CR-\\d{4,}"), response.body());
        }

        @Test
        @DisplayName("the 202 body contains no other incident detail")
        void responseBodyIsMinimal() throws Exception {
            HttpResponse<String> response =
                    post("/api/v1/sos/trigger", sosBody("DEV-4471", "MANUAL_SOS"));

            String body = response.body().toLowerCase();
            for (String forbidden : new String[]{"latitude", "longitude", "fsm_state", "victim",
                    "medical", "device_id", "battery"}) {
                assertFalse(body.contains(forbidden), "202 body must not contain " + forbidden);
            }
        }

        @Test
        @DisplayName("an invalid trigger returns 400 and creates no incident")
        void invalidTriggerIsRejected() throws Exception {
            HttpResponse<String> response = post("/api/v1/sos/trigger", """
                    {"device_id":"DEV-4471","trigger_type":"PANIC","battery_level":42,
                     "network_quality":"WEAK","cannot_speak":true,"threat_nearby":false,
                     "timestamp":"2026-09-27T10:14:52Z"}""");

            assertEquals(400, response.statusCode());
            assertTrue(incidents.findByDeviceId("DEV-4471").isEmpty(),
                    "a rejected trigger must not create an incident");
        }

        @Test
        @DisplayName("an unknown field returns 400")
        void unknownFieldIsRejected() throws Exception {
            String body = sosBody("DEV-4471", "MANUAL_SOS")
                    .replace("\"device_id\"", "\"blood_type\": \"O+\", \"device_id\"");

            assertEquals(400, post("/api/v1/sos/trigger", body).statusCode());
        }
    }

    @Nested
    @DisplayName("the full Citizen flow")
    class FullFlow {

        @Test
        @DisplayName("seed -> SOS -> matched volunteer socket -> accept -> persisted and audited")
        void happyPathEndToEnd() throws Exception {
            // The best match for DEV-4471's fixture coordinate is the volunteer standing on it.
            try (VolunteerSocket matched = new VolunteerSocket(port, "VOL-145");
                 VolunteerSocket bystander = new VolunteerSocket(port, "VOL-142")) {
                awaitSubscriber("VOL-145");
                awaitSubscriber("VOL-142");

                HttpResponse<String> sos =
                        post("/api/v1/sos/trigger", sosBody("DEV-4471", "CRASH_DETECTED"));
                assertEquals(202, sos.statusCode());
                String capsuleId = CitizenPayloads.mapper()
                        .readTree(sos.body()).get("capsule_id").asText();

                // The matched volunteer receives the incident.
                String pushed = matched.poll();
                assertNotNull(pushed, "the matched volunteer must receive the incident");

                // The bystander, who was not matched, receives nothing.
                assertEquals(null, bystander.messages.poll(2, TimeUnit.SECONDS),
                        "an unmatched volunteer must never be pushed an incident");

                JsonNode view = CitizenPayloads.mapper().readTree(pushed);
                assertEquals(capsuleId, view.get("capsule_id").asText());
                assertEquals("EMERGENCY", view.get("fsm_state").asText());
                assertEquals("Jane Doe", view.get("victim_name").asText());
                assertEquals(24, view.get("victim_age").asInt());
                assertEquals("Female", view.get("victim_gender").asText());
                assertNotNull(view.get("location").get("latitude"));
                assertEquals(Set.of("capsule_id", "fsm_state", "victim_name", "victim_age",
                                "victim_gender", "location"),
                        fieldNames(view));

                // The volunteer accepts.
                HttpResponse<String> accept = post("/api/v1/volunteer/response", """
                        {"capsule_id":"%s","volunteer_id":"VOL-145","action":"ACCEPT",
                         "timestamp":"2026-09-27T10:17:40Z"}""".formatted(capsuleId));
                assertEquals(200, accept.statusCode());

                // The accept is visible to the same volunteer as a state change.
                String update = matched.poll();
                assertNotNull(update, "the accepting volunteer should see the state change");
                assertEquals("VOLUNTEER_ASSIGNED",
                        CitizenPayloads.mapper().readTree(update).get("fsm_state").asText());

                // And it is persisted and audited.
                IncidentRecord stored = incidents.findByCapsuleId(capsuleId).orElseThrow();
                assertEquals(FsmState.VOLUNTEER_ASSIGNED, stored.fsmState());
                assertEquals("VOL-145", stored.matchedResponderId());

                List<AuditEventRepository.AuditEvent> events = audit.findByCapsuleId(capsuleId);
                assertTrue(events.stream()
                        .anyMatch(e -> AuditEventRepository.SOS_TRIGGERED.equals(e.eventType())));
                assertTrue(events.stream()
                        .anyMatch(e -> AuditEventRepository.VOLUNTEER_ACCEPTED.equals(e.eventType())));
            }
        }

        @Test
        @DisplayName("a decline re-matches and notifies the next volunteer instead")
        void declineRematchesEndToEnd() throws Exception {
            try (VolunteerSocket first = new VolunteerSocket(port, "VOL-145");
                 VolunteerSocket second = new VolunteerSocket(port, "VOL-142")) {
                awaitSubscriber("VOL-145");
                awaitSubscriber("VOL-142");

                String capsuleId = CitizenPayloads.mapper().readTree(
                        post("/api/v1/sos/trigger", sosBody("DEV-4471", "MANUAL_SOS")).body())
                        .get("capsule_id").asText();
                assertNotNull(first.poll());

                HttpResponse<String> decline = post("/api/v1/volunteer/response", """
                        {"capsule_id":"%s","volunteer_id":"VOL-145","action":"DECLINE",
                         "timestamp":"2026-09-27T10:17:40Z"}""".formatted(capsuleId));
                assertEquals(200, decline.statusCode());

                // The second-best volunteer is now told about it.
                assertNotNull(second.poll(), "the re-matched volunteer must be notified");

                IncidentRecord stored = incidents.findByCapsuleId(capsuleId).orElseThrow();
                assertEquals("VOL-142", stored.matchedResponderId());
                assertEquals(FsmState.EMERGENCY, stored.fsmState(),
                        "a decline leaves the incident escalated, not resolved");
            }
        }

        @Test
        @DisplayName("an arrival is audited without changing the state or silencing anything")
        void arrivalIsAuditOnlyEndToEnd() throws Exception {
            try (VolunteerSocket matched = new VolunteerSocket(port, "VOL-145")) {
                awaitSubscriber("VOL-145");

                String capsuleId = CitizenPayloads.mapper().readTree(
                        post("/api/v1/sos/trigger", sosBody("DEV-4471", "MANUAL_SOS")).body())
                        .get("capsule_id").asText();
                assertNotNull(matched.poll());

                post("/api/v1/volunteer/response", """
                        {"capsule_id":"%s","volunteer_id":"VOL-145","action":"ACCEPT",
                         "timestamp":"2026-09-27T10:17:40Z"}""".formatted(capsuleId));
                assertNotNull(matched.poll());

                HttpResponse<String> arrived = post("/api/v1/volunteer/response", """
                        {"capsule_id":"%s","volunteer_id":"VOL-145","action":"ARRIVED",
                         "timestamp":"2026-09-27T10:25:00Z"}""".formatted(capsuleId));
                assertEquals(200, arrived.statusCode());

                // Still VOLUNTEER_ASSIGNED, not RESOLVED: a volunteer arrival silences nothing.
                assertEquals(FsmState.VOLUNTEER_ASSIGNED,
                        incidents.findByCapsuleId(capsuleId).orElseThrow().fsmState());
                assertTrue(audit.findByCapsuleId(capsuleId).stream()
                        .anyMatch(e -> AuditEventRepository.VOLUNTEER_ARRIVED.equals(e.eventType())));
            }
        }
    }

    @Nested
    @DisplayName("the public surface")
    class PublicSurface {

        @Test
        @DisplayName("an undocumented route returns 404")
        void undocumentedRouteIs404() throws Exception {
            for (String path : new String[]{
                    "/api/v1/telemetry",
                    "/api/v1/agent/trigger",
                    "/api/v1/admin/volunteers",
                    "/api/v1/dispatch/decision",
                    "/api/v1/field/silence-ack",
                    "/api/v1/queue/incidents",
                    "/api/v1/provision"}) {
                HttpResponse<String> response = http.send(
                        HttpRequest.newBuilder(URI.create(url(path))).build(),
                        HttpResponse.BodyHandlers.ofString());
                assertEquals(404, response.statusCode(), path + " must not exist");
            }
        }

        @Test
        @DisplayName("an undocumented WebSocket path refuses the handshake")
        void undocumentedSocketIsRefused() {
            URI uri = URI.create("ws://localhost:" + port + "/ws/v1/incidents/official?official_id=OFF-1");

            // No official or queue channel exists: that surface belongs to the Professional App.
            assertThrows(Exception.class, () -> http.newWebSocketBuilder()
                    .connectTimeout(Duration.ofSeconds(5))
                    .buildAsync(uri, new WebSocket.Listener() {
                    })
                    .get(10, TimeUnit.SECONDS),
                    "only the documented volunteer socket may exist");
        }
    }

    private static Set<String> fieldNames(JsonNode node) {
        Set<String> names = new java.util.HashSet<>();
        node.fieldNames().forEachRemaining(names::add);
        return names;
    }
}
