package com.safesphere.api;

import com.fasterxml.jackson.databind.node.ObjectNode;
import com.safesphere.incident.IncidentService;
import com.safesphere.incident.ResponseRejection;
import com.safesphere.incident.VolunteerResponseRejected;
import io.javalin.http.Context;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * The three Citizen-contract routes from {@code CitizenAppContract.md} section 2, and nothing else.
 *
 * <p>There is no agent-trigger, telemetry, dispatch, silence-ack, admin, provisioning, or official
 * queue endpoint here, and no WebSocket other than the volunteer one. Those belong to contracts this
 * backend has not been given.
 *
 * <p>Error responses are a bare status code with a short plain-text reason. They are deliberately not
 * a JSON object: the Citizen contract defines no error message type, and inventing one would put an
 * undocumented shape on the wire.
 */
public final class CitizenRoutes {

    private static final Logger log = LoggerFactory.getLogger(CitizenRoutes.class);

    private final IncidentService incidents;

    public CitizenRoutes(IncidentService incidents) {
        this.incidents = incidents;
    }

    /**
     * {@code POST /api/v1/sos/trigger} — the raw signal.
     *
     * <p>Returns {@code 202 Accepted} with exactly {@code { "capsule_id": "..." }}, which is the only
     * thing the Citizen App ever receives from a trigger. The full capsule never leaves the backend.
     */
    public void registerSosTrigger(Context ctx) {
        SosTriggerEvent event;
        try {
            event = CitizenPayloads.parseSosTrigger(ctx.body());
        } catch (InvalidCitizenRequest e) {
            ctx.status(400);
            ctx.contentType("text/plain");
            ctx.result(e.getMessage());
            return;
        }

        String capsuleId = incidents.handleSos(event);
        ctx.status(202);
        ctx.contentType("application/json");
        ctx.result(CitizenPayloads.sosAccepted(capsuleId));
    }

    /**
     * {@code POST /api/v1/volunteer/response} — Accept, Decline, or Arrived.
     *
     * <p>Returns {@code 200} with a short plain-text outcome. The contract defines no response body
     * for this route, so none is invented.
     */
    public void registerVolunteerResponse(Context ctx) {
        VolunteerResponseEvent event;
        try {
            event = CitizenPayloads.parseVolunteerResponse(ctx.body());
        } catch (InvalidCitizenRequest e) {
            ctx.status(400);
            ctx.contentType("text/plain");
            ctx.result(e.getMessage());
            return;
        }

        try {
            var outcome = incidents.handleVolunteerResponse(event);
            ctx.status(200);
            ctx.contentType("text/plain");
            ctx.result(outcome.name());
        } catch (VolunteerResponseRejected e) {
            ctx.status(statusFor(e.rejection()));
            ctx.contentType("text/plain");
            ctx.result(e.getMessage());
        }
    }

    /**
     * {@code GET /health} — a liveness probe that leaks nothing.
     *
     * <p>Reports only that the process is up and its version. It deliberately exposes no incident
     * counts, no database contents, no hostnames, and no configuration, so it is safe to leave
     * unauthenticated.
     */
    public void registerHealth(Context ctx) {
        ObjectNode node = CitizenPayloads.mapper().createObjectNode();
        node.put("status", "ok");
        node.put("service", "safesphere-backend");
        node.put("contract", "citizen-v4");
        try {
            ctx.contentType("application/json");
            ctx.result(CitizenPayloads.mapper().writeValueAsString(node));
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            ctx.status(500);
            ctx.result("health serialization failed");
        }
    }

    private static int statusFor(ResponseRejection rejection) {
        return switch (rejection) {
            case UNKNOWN_INCIDENT -> 404;
            case UNKNOWN_VOLUNTEER -> 403;
            case NOT_ASSIGNED, INVALID_STATE -> 409;
        };
    }

    /** Logs an unexpected failure without echoing request bodies, which may carry personal data. */
    public static void logUnexpected(String route, Exception e) {
        log.error("unhandled failure on {}: {}", route, e.toString());
    }
}
