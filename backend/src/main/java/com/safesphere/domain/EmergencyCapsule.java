package com.safesphere.domain;

import com.safesphere.fsm.FsmState;
import java.time.Instant;
import java.util.Objects;

/**
 * The full internal incident record defined in {@code SafeSphere.md} section 6.1.
 *
 * <p><strong>Internal only.</strong> The backend is the only thing that ever constructs a capsule,
 * and it is never sent whole to either app: each client receives a role-scoped view built separately
 * (for the Citizen App, {@code VolunteerIncidentView}). This type exists so the encrypted evidence
 * and the medical summary have one auditable home, and so the stripping decision is a deliberate
 * boundary rather than an accident of serialization.
 *
 * <p>Deliberately not annotated for automatic JSON binding, so there is no code path that can dump
 * this record to a client socket.
 *
 * @param capsuleId          the opaque incident identifier, e.g. {@code CR-8924}
 * @param timestamp          when the capsule was assembled
 * @param fsmState           lifecycle state at the time of assembly
 * @param telemetry          device state, including the coordinates the SOS event does not carry
 * @param medicalSummary     sensitive; only ever reaches a full-access responder view, which is
 *                           out of scope for the Citizen surface
 * @param encryptedEvidence  AES-256-GCM ciphertext produced by the Evidence Vault. Already sealed:
 *                           the plaintext is never retained on the capsule
 */
public record EmergencyCapsule(
        String capsuleId,
        Instant timestamp,
        FsmState fsmState,
        Telemetry telemetry,
        String medicalSummary,
        String encryptedEvidence) {

    public EmergencyCapsule {
        Objects.requireNonNull(capsuleId, "capsuleId is required");
        Objects.requireNonNull(timestamp, "timestamp is required");
        Objects.requireNonNull(fsmState, "fsmState is required");
        Objects.requireNonNull(telemetry, "telemetry is required");
    }

    /**
     * The evidence field, which is already ciphertext.
     *
     * <p>Named explicitly so that a future call site has to ask for sealed evidence on purpose
     * rather than reaching in by field access.
     */
    public String sealedEvidence() {
        return encryptedEvidence;
    }

    @Override
    public String toString() {
        // Never let sensitive fields reach a log line through an accidental toString().
        return "EmergencyCapsule[capsuleId=" + capsuleId
                + ", fsmState=" + fsmState
                + ", timestamp=" + timestamp
                + ", telemetry=" + telemetry
                + ", medicalSummary=<redacted>"
                + ", encryptedEvidence=<redacted>]";
    }
}
