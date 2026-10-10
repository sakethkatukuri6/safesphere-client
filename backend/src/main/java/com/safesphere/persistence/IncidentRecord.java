package com.safesphere.persistence;

import com.safesphere.domain.NetworkQuality;
import com.safesphere.domain.TriggerType;
import com.safesphere.fsm.FsmState;
import java.time.Instant;
import java.util.Objects;

/**
 * A persisted incident row: the durable half of an {@code EmergencyCapsule}.
 *
 * <p>Internal record. The sensitive members ({@code medicalSummary}, {@code encryptedEvidence}) are
 * stored here and are never projected into a Citizen payload; see
 * {@code com.safesphere.api.VolunteerIncidentView}, which has no field able to hold them.
 *
 * @param capsuleId          opaque incident id, e.g. {@code CR-8924}
 * @param deviceId           stable per-install identifier reported by the Citizen App
 * @param fsmState           lifecycle state as of {@code updatedAt}
 * @param triggerType        why the alert was raised
 * @param batteryLevel       0..100, as reported by the device
 * @param networkQuality     connection quality at trigger time
 * @param cannotSpeak        "I Can't Speak" questionnaire answer
 * @param threatNearby       "I Can't Speak" questionnaire answer
 * @param latitude           incident latitude
 * @param longitude          incident longitude
 * @param medicalSummary     sensitive, may be null
 * @param encryptedEvidence  sealed AES-256-GCM evidence, may be null
 * @param matchedResponderId the volunteer currently assigned, may be null
 * @param createdAt          when the incident was opened
 * @param updatedAt          when the row was last written
 */
public record IncidentRecord(
        String capsuleId,
        String deviceId,
        FsmState fsmState,
        TriggerType triggerType,
        int batteryLevel,
        NetworkQuality networkQuality,
        boolean cannotSpeak,
        boolean threatNearby,
        double latitude,
        double longitude,
        String medicalSummary,
        String encryptedEvidence,
        String matchedResponderId,
        Instant createdAt,
        Instant updatedAt) {

    public IncidentRecord {
        Objects.requireNonNull(capsuleId, "capsuleId is required");
        Objects.requireNonNull(deviceId, "deviceId is required");
        Objects.requireNonNull(fsmState, "fsmState is required");
        Objects.requireNonNull(triggerType, "triggerType is required");
        Objects.requireNonNull(networkQuality, "networkQuality is required");
        Objects.requireNonNull(createdAt, "createdAt is required");
        Objects.requireNonNull(updatedAt, "updatedAt is required");
    }

    /** Returns a copy in a new FSM state, stamping {@code updatedAt}. */
    public IncidentRecord withState(FsmState next, Instant now) {
        return new IncidentRecord(capsuleId, deviceId, next, triggerType, batteryLevel, networkQuality,
                cannotSpeak, threatNearby, latitude, longitude, medicalSummary, encryptedEvidence,
                matchedResponderId, createdAt, now);
    }

    /** Returns a copy assigned to a responder, stamping {@code updatedAt}. */
    public IncidentRecord withMatchedResponder(String responderId, Instant now) {
        return new IncidentRecord(capsuleId, deviceId, fsmState, triggerType, batteryLevel,
                networkQuality, cannotSpeak, threatNearby, latitude, longitude, medicalSummary,
                encryptedEvidence, responderId, createdAt, now);
    }

    /** Returns a copy carrying sealed evidence, stamping {@code updatedAt}. */
    public IncidentRecord withEvidence(String sealedEvidence, Instant now) {
        return new IncidentRecord(capsuleId, deviceId, fsmState, triggerType, batteryLevel,
                networkQuality, cannotSpeak, threatNearby, latitude, longitude, medicalSummary,
                sealedEvidence, matchedResponderId, createdAt, now);
    }
}
