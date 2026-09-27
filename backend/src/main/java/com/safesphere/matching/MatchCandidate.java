package com.safesphere.matching;

import com.safesphere.persistence.ResponderRecord;
import java.util.Objects;

/**
 * A scored volunteer: the raw inputs plus the score the matcher computed.
 *
 * @param responder  the matched volunteer
 * @param distanceKm great-circle distance from the incident, never negative
 * @param matchScore the weighted score from {@code SafeSphere.md} section 10
 */
public record MatchCandidate(ResponderRecord responder, double distanceKm, double matchScore) {

    public MatchCandidate {
        Objects.requireNonNull(responder, "responder is required");
        if (distanceKm < 0.0 || Double.isNaN(distanceKm)) {
            throw new IllegalArgumentException("distanceKm must be a non-negative number");
        }
        if (Double.isNaN(matchScore)) {
            throw new IllegalArgumentException("matchScore must be a number");
        }
    }

    /** The volunteer's verified id, which is the only identity ever placed on the wire. */
    public String responderId() {
        return responder.responderId();
    }
}
