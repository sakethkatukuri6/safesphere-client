package com.safesphere.api;

import com.safesphere.domain.NetworkQuality;
import com.safesphere.domain.TriggerType;
import java.time.Instant;
import java.util.Objects;

/**
 * The {@code POST /api/v1/sos/trigger} request body, exactly as frozen in
 * {@code CitizenAppContract.md} section 3.
 *
 * <p>Carries no coordinates and no victim identity: the device reports only the raw signal, and the
 * backend owns everything downstream. The property names are the wire names, because this record is
 * the inbound contract and must not drift from it.
 *
 * @param deviceId       stable per-install identifier
 * @param triggerType    why the alert was raised; {@code CRASH_DETECTED} drives the server-side bypass
 * @param batteryLevel   real device battery percentage, 0..100
 * @param networkQuality device connection quality at trigger time
 * @param cannotSpeak    "I Can't Speak" questionnaire answer
 * @param threatNearby   "I Can't Speak" questionnaire answer
 * @param timestamp      client-generated ISO-8601 send time
 */
public record SosTriggerEvent(
        String device_id,
        TriggerType trigger_type,
        int battery_level,
        NetworkQuality network_quality,
        boolean cannot_speak,
        boolean threat_nearby,
        Instant timestamp) {

    public SosTriggerEvent {
        Objects.requireNonNull(device_id, "device_id is required");
        Objects.requireNonNull(trigger_type, "trigger_type is required");
        Objects.requireNonNull(network_quality, "network_quality is required");
        Objects.requireNonNull(timestamp, "timestamp is required");
    }

    /** Java-style accessor for {@link #device_id}. */
    public String deviceId() {
        return device_id;
    }

    /** Java-style accessor for {@link #battery_level}. */
    public int batteryLevel() {
        return battery_level;
    }
}
