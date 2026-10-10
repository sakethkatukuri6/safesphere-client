package com.safesphere.api;

import com.safesphere.fsm.FsmState;
import java.time.Instant;
import java.util.Objects;

/**
 * The complete Help Nearby payload, frozen in {@code CitizenAppContract.md} section 4 and
 * {@code SafeSphere.md} section 6.2.
 *
 * <p><strong>This type is the stripping mechanism.</strong> It has exactly six components, and none of
 * them can hold a medical summary, hazard note, emergency contact, OTP, internal database id, or
 * debug field. There is nowhere to put such data, so no code path exists by which a matched volunteer
 * could receive it — the guarantee does not depend on the Citizen App choosing to ignore fields, and
 * it holds regardless of what the app is eventually written in.
 *
 * <p>{@code victimName}, {@code victimAge}, and {@code victimGender} come from local development
 * fixtures in this build; see {@code VictimProfileRepository}.
 *
 * @param capsuleId   the incident id, e.g. {@code CR-8924}
 * @param fsmState    lifecycle state; the app only ever observes {@code EMERGENCY} or
 *                    {@code VOLUNTEER_ASSIGNED} here
 * @param victimName  display name
 * @param victimAge   age in years
 * @param victimGender gender
 * @param location    coordinates and when they were last updated
 */
public record VolunteerIncidentView(
        String capsuleId,
        FsmState fsmState,
        String victimName,
        int victimAge,
        String victimGender,
        IncidentLocation location) {

    public VolunteerIncidentView {
        Objects.requireNonNull(capsuleId, "capsuleId is required");
        Objects.requireNonNull(fsmState, "fsmState is required");
        Objects.requireNonNull(victimName, "victimName is required");
        Objects.requireNonNull(victimGender, "victimGender is required");
        Objects.requireNonNull(location, "location is required");
    }

    /**
     * The nested {@code location} object of section 6.2.
     *
     * @param latitude   decimal degrees
     * @param longitude  decimal degrees
     * @param updatedAt  when the coordinate was recorded
     */
    public record IncidentLocation(double latitude, double longitude, Instant updatedAt) {

        public IncidentLocation {
            Objects.requireNonNull(updatedAt, "updatedAt is required");
        }
    }
}
