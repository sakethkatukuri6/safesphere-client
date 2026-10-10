package com.safesphere.api;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.safesphere.domain.NetworkQuality;
import com.safesphere.domain.TriggerType;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.Iterator;
import java.util.Set;

/**
 * Reads and writes the Citizen wire payloads.
 *
 * <p><strong>Outbound is built from an explicit whitelist.</strong> Serialization does not reflect
 * over a domain object; it writes named fields into a fresh {@link ObjectNode}. Adding a field to a
 * domain record therefore cannot leak it to a client, and {@code VolunteerIncidentView} serialization
 * has exactly one place where a field could be added. This is the mechanism behind the section 4
 * requirement that the stripping happen inside {@code backend/} before serialization.
 *
 * <p><strong>Inbound is strict.</strong> Unknown fields are rejected rather than ignored, so a client
 * cannot believe it sent something the backend acted on. Enum names, the 0..100 battery range, and
 * ISO-8601 timestamps are all validated here, before any state changes.
 */
public final class CitizenPayloads {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private static final Set<String> SOS_FIELDS = Set.of(
            "device_id", "trigger_type", "battery_level", "network_quality",
            "cannot_speak", "threat_nearby", "timestamp");

    private static final Set<String> VOLUNTEER_RESPONSE_FIELDS = Set.of(
            "capsule_id", "volunteer_id", "action", "timestamp");

    private CitizenPayloads() {
    }

    /**
     * The {@code 202 Accepted} body of {@code POST /api/v1/sos/trigger}: exactly
     * {@code { "capsule_id": "..." }}. This is the only thing the Citizen App ever receives from a
     * trigger.
     */
    public static String sosAccepted(String capsuleId) {
        ObjectNode node = MAPPER.createObjectNode();
        node.put("capsule_id", capsuleId);
        return write(node);
    }

    /**
     * The Help Nearby payload, containing exactly the six documented fields and nothing else.
     *
     * <p>No medical summary, no hazard notes, no contacts, no OTP, no internal id, no debug field —
     * there is no code here that could add one.
     */
    public static String volunteerIncident(VolunteerIncidentView view) {
        ObjectNode node = MAPPER.createObjectNode();
        node.put("capsule_id", view.capsuleId());
        node.put("fsm_state", view.fsmState().name());

        ObjectNode location = node.putObject("location");
        location.put("latitude", view.location().latitude());
        location.put("longitude", view.location().longitude());
        location.put("updated_at", view.location().updatedAt().toString());

        node.put("victim_name", view.victimName());
        node.put("victim_age", view.victimAge());
        node.put("victim_gender", view.victimGender());

        return write(node);
    }

    /**
     * Parses and validates an {@code SosTriggerEvent}.
     *
     * @throws InvalidCitizenRequest if the body is not a JSON object matching the frozen schema
     */
    public static SosTriggerEvent parseSosTrigger(String body) {
        ObjectNode node = parseObject(body, SOS_FIELDS, "SosTriggerEvent");

        String deviceId = requireText(node, "device_id");
        TriggerType triggerType = requireEnum(node, "trigger_type", TriggerType.class);
        int batteryLevel = requireBatteryLevel(node);
        NetworkQuality networkQuality = requireEnum(node, "network_quality", NetworkQuality.class);
        boolean cannotSpeak = requireBoolean(node, "cannot_speak");
        boolean threatNearby = requireBoolean(node, "threat_nearby");
        Instant timestamp = requireTimestamp(node);

        return new SosTriggerEvent(deviceId, triggerType, batteryLevel, networkQuality,
                cannotSpeak, threatNearby, timestamp);
    }

    /**
     * Parses and validates a {@code VolunteerResponseEvent}.
     *
     * @throws InvalidCitizenRequest if the body is not a JSON object matching the frozen schema
     */
    public static VolunteerResponseEvent parseVolunteerResponse(String body) {
        ObjectNode node = parseObject(body, VOLUNTEER_RESPONSE_FIELDS, "VolunteerResponseEvent");

        String capsuleId = requireText(node, "capsule_id");
        String volunteerId = requireText(node, "volunteer_id");
        VolunteerAction action = requireEnum(node, "action", VolunteerAction.class);
        Instant timestamp = requireTimestamp(node);

        return new VolunteerResponseEvent(capsuleId, volunteerId, action, timestamp);
    }

    /** The shared mapper, for tests that need to inspect emitted JSON. */
    public static ObjectMapper mapper() {
        return MAPPER;
    }

    private static ObjectNode parseObject(String body, Set<String> allowed, String label) {
        if (body == null || body.isBlank()) {
            throw new InvalidCitizenRequest(label + " body is empty");
        }
        JsonNode parsed;
        try {
            parsed = MAPPER.readTree(body);
        } catch (JsonProcessingException e) {
            throw new InvalidCitizenRequest(label + " body is not valid JSON");
        }
        if (parsed == null || !parsed.isObject()) {
            throw new InvalidCitizenRequest(label + " body must be a JSON object");
        }
        ObjectNode node = (ObjectNode) parsed;

        for (Iterator<String> it = node.fieldNames(); it.hasNext(); ) {
            String field = it.next();
            if (!allowed.contains(field)) {
                throw new InvalidCitizenRequest(
                        "unknown field '" + field + "'; " + label + " accepts only " + allowed);
            }
        }
        for (String field : allowed) {
            if (!node.has(field) || node.get(field).isNull()) {
                throw new InvalidCitizenRequest("missing required field '" + field + "'");
            }
        }
        return node;
    }

    private static String requireText(ObjectNode node, String field) {
        JsonNode value = node.get(field);
        if (!value.isTextual() || value.textValue().isBlank()) {
            throw new InvalidCitizenRequest("field '" + field + "' must be a non-empty string");
        }
        return value.textValue();
    }

    private static boolean requireBoolean(ObjectNode node, String field) {
        JsonNode value = node.get(field);
        if (!value.isBoolean()) {
            throw new InvalidCitizenRequest("field '" + field + "' must be a boolean");
        }
        return value.booleanValue();
    }

    private static int requireBatteryLevel(ObjectNode node) {
        JsonNode value = node.get("battery_level");
        if (!value.isIntegralNumber() || !value.canConvertToInt()) {
            throw new InvalidCitizenRequest("field 'battery_level' must be a whole number");
        }
        int level = value.intValue();
        if (level < 0 || level > 100) {
            throw new InvalidCitizenRequest(
                    "field 'battery_level' must be between 0 and 100, got " + level);
        }
        return level;
    }

    private static <E extends Enum<E>> E requireEnum(ObjectNode node, String field, Class<E> type) {
        JsonNode value = node.get(field);
        if (!value.isTextual()) {
            throw new InvalidCitizenRequest("field '" + field + "' must be a string");
        }
        String raw = value.textValue();
        for (E constant : type.getEnumConstants()) {
            if (constant.name().equals(raw)) {
                return constant;
            }
        }
        throw new InvalidCitizenRequest(
                "field '" + field + "' must be one of " + java.util.Arrays.toString(type.getEnumConstants())
                        + ", got '" + raw + "'");
    }

    private static Instant requireTimestamp(ObjectNode node) {
        JsonNode value = node.get("timestamp");
        if (!value.isTextual()) {
            throw new InvalidCitizenRequest("field 'timestamp' must be an ISO-8601 string");
        }
        try {
            return Instant.parse(value.textValue());
        } catch (DateTimeParseException e) {
            throw new InvalidCitizenRequest("field 'timestamp' is not a valid ISO-8601 instant");
        }
    }

    private static String write(ObjectNode node) {
        try {
            return MAPPER.writeValueAsString(node);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("cannot serialize outbound payload", e);
        }
    }
}
