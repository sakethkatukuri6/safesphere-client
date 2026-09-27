package com.safesphere.matching;

import com.safesphere.persistence.ResponderRecord;
import com.safesphere.persistence.ResponderRepository;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * The weighted capability match from {@code SafeSphere.md} section 10.
 *
 * <pre>
 *   ( (1 / distance_km) * 0.4 ) +
 *   ( first_aid_cert * 0.3 ) +
 *   ( vehicle_access * 0.3 ) AS match_score
 * </pre>
 *
 * <p>The reference SQL divides by {@code distance_km} unguarded, which in SQLite yields {@code NULL}
 * for a volunteer standing exactly on the incident and in Java would yield infinity. Both are useless
 * for ranking, so proximity is capped at {@link #MAX_PROXIMITY_SCORE} (the score of a volunteer one
 * metre away). A zero-distance responder therefore sorts first, deterministically, instead of
 * poisoning the query.
 *
 * <p>The matcher holds no mutable state, so concurrent calls are safe; the repository it reads from
 * opens a connection per query.
 */
public final class CapabilityMatcher {

    private static final Logger log = LoggerFactory.getLogger(CapabilityMatcher.class);

    /** Weight on proximity, per the section 10 formula. */
    public static final double PROXIMITY_WEIGHT = 0.4;
    /** Weight on first-aid certification. */
    public static final double FIRST_AID_WEIGHT = 0.3;
    /** Weight on vehicle access. */
    public static final double VEHICLE_WEIGHT = 0.3;

    /**
     * Closest distance treated as distinct, in kilometres. Anything nearer scores as if it were
     * exactly this far away, which bounds {@code 1 / distance_km} and keeps scores finite.
     */
    public static final double MIN_DISTANCE_KM = 0.001;

    /** The proximity score awarded at {@link #MIN_DISTANCE_KM}. */
    public static final double MAX_PROXIMITY_SCORE = 1.0 / MIN_DISTANCE_KM;

    /**
     * Highest score is best; ties break on responder id so ranking is total and reproducible rather
     * than dependent on database row order.
     */
    private static final Comparator<MatchCandidate> BY_SCORE_DESC =
            Comparator.comparingDouble(MatchCandidate::matchScore).reversed()
                    .thenComparing(MatchCandidate::responderId);

    private final ResponderRepository responders;

    public CapabilityMatcher(ResponderRepository responders) {
        this.responders = Objects.requireNonNull(responders, "responders is required");
    }

    /**
     * Scores one volunteer against an incident location.
     *
     * @return the candidate, or {@code null} if the volunteer is not online
     */
    public MatchCandidate score(ResponderRecord responder, double latitude, double longitude) {
        if (!responder.isOnline()) {
            return null;
        }
        double distanceKm = Haversine.distanceKm(
                latitude, longitude, responder.latitude(), responder.longitude());
        double proximity = proximityScore(distanceKm);
        double matchScore = proximity * PROXIMITY_WEIGHT
                + responder.firstAidCert() * FIRST_AID_WEIGHT
                + responder.vehicleAccess() * VEHICLE_WEIGHT;
        return new MatchCandidate(responder, distanceKm, matchScore);
    }

    /**
     * Proximity component, bounded so a zero distance yields a finite score.
     *
     * @param distanceKm a non-negative distance in kilometres
     */
    public static double proximityScore(double distanceKm) {
        if (Double.isNaN(distanceKm) || distanceKm < 0.0) {
            throw new IllegalArgumentException("distanceKm must be non-negative: " + distanceKm);
        }
        return 1.0 / Math.max(distanceKm, MIN_DISTANCE_KM);
    }

    /**
     * Every online, non-excluded volunteer, best first.
     *
     * @param excludedResponderIds volunteers to skip, e.g. those who already declined; may be null
     */
    public List<MatchCandidate> rank(double latitude, double longitude,
                                     Collection<String> excludedResponderIds) {
        List<ResponderRecord> online =
                responders.findOnlineExcluding(excludedResponderIds);
        return online.stream()
                .map(responder -> score(responder, latitude, longitude))
                .filter(Objects::nonNull)
                .sorted(BY_SCORE_DESC)
                .toList();
    }

    /**
     * The single best match.
     *
     * @return the winner, or {@link Optional#empty()} when nobody is online and unexcluded. An
     *         incident with no candidate is a normal outcome, not an error: it is still persisted and
     *         still returns 202, because the victim pressed the button either way.
     */
    public Optional<MatchCandidate> findBest(double latitude, double longitude,
                                             Collection<String> excludedResponderIds) {
        List<MatchCandidate> ranked = rank(latitude, longitude, excludedResponderIds);
        if (ranked.isEmpty()) {
            log.info("no matchable volunteer for incident at {},{} ({} excluded)",
                    latitude, longitude,
                    excludedResponderIds == null ? 0 : excludedResponderIds.size());
            return Optional.empty();
        }
        return Optional.of(ranked.get(0));
    }
}
