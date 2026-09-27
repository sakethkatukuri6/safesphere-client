package com.safesphere.persistence;

import java.util.Objects;

/**
 * A verified volunteer available to be matched, as stored in {@code verified_volunteers}.
 *
 * <p>Column names mirror the weighted-match SQL in {@code SafeSphere.md} section 10. In the MVP every
 * row here is local development fixture data: there is no real provisioning, verification, or
 * authentication service behind it.
 *
 * @param responderId   the volunteer's verified id, e.g. {@code VOL-142}
 * @param displayName   a human-readable label for the demo; never sent on the Citizen wire
 * @param latitude      last known latitude
 * @param longitude     last known longitude
 * @param firstAidCert  1 if the volunteer holds a first-aid certification, else 0
 * @param vehicleAccess 1 if the volunteer can drive to the scene, else 0
 * @param status        {@link #ONLINE} or {@link #OFFLINE}; only online rows are matchable
 */
public record ResponderRecord(
        String responderId,
        String displayName,
        double latitude,
        double longitude,
        int firstAidCert,
        int vehicleAccess,
        String status) {

    /** Matchable availability value. */
    public static final String ONLINE = "ONLINE";
    /** Present but not currently matchable. */
    public static final String OFFLINE = "OFFLINE";

    public ResponderRecord {
        Objects.requireNonNull(responderId, "responderId is required");
        Objects.requireNonNull(displayName, "displayName is required");
        Objects.requireNonNull(status, "status is required");
        firstAidCert = firstAidCert != 0 ? 1 : 0;
        vehicleAccess = vehicleAccess != 0 ? 1 : 0;
        if (latitude < -90.0 || latitude > 90.0) {
            throw new IllegalArgumentException("latitude out of range: " + latitude);
        }
        if (longitude < -180.0 || longitude > 180.0) {
            throw new IllegalArgumentException("longitude out of range: " + longitude);
        }
    }

    /** Whether this volunteer is currently matchable. */
    public boolean isOnline() {
        return ONLINE.equals(status);
    }
}
