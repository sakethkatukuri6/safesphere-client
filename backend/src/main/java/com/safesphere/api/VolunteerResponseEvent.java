package com.safesphere.api;

import java.time.Instant;
import java.util.Objects;

/**
 * The {@code POST /api/v1/volunteer/response} request body, exactly as frozen in
 * {@code CitizenAppContract.md} section 5.
 *
 * @param capsule_id  the incident being answered
 * @param volunteer_id the responding volunteer's verified id
 * @param action      what the volunteer is doing
 * @param timestamp   client-generated ISO-8601 send time
 */
public record VolunteerResponseEvent(
        String capsule_id,
        String volunteer_id,
        VolunteerAction action,
        Instant timestamp) {

    public VolunteerResponseEvent {
        Objects.requireNonNull(capsule_id, "capsule_id is required");
        Objects.requireNonNull(volunteer_id, "volunteer_id is required");
        Objects.requireNonNull(action, "action is required");
        Objects.requireNonNull(timestamp, "timestamp is required");
    }

    /** Java-style accessor for {@link #capsule_id}. */
    public String capsuleId() {
        return capsule_id;
    }

    /** Java-style accessor for {@link #volunteer_id}. */
    public String volunteerId() {
        return volunteer_id;
    }
}
