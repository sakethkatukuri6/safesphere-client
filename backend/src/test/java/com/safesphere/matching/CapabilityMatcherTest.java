package com.safesphere.matching;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.safesphere.persistence.Database;
import com.safesphere.persistence.ResponderRecord;
import com.safesphere.persistence.ResponderRepository;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

/** Tests for the section 10 weighted capability match. */
class CapabilityMatcherTest {

    private static final double HYDERABAD_LAT = 17.3850;
    private static final double HYDERABAD_LON = 78.4867;

    private Database database;
    private ResponderRepository responders;
    private CapabilityMatcher matcher;

    @BeforeEach
    void setUp() {
        database = Database.inMemory("matcher-" + java.util.UUID.randomUUID());
        database.migrate();
        responders = new ResponderRepository(database);
        matcher = new CapabilityMatcher(responders);
    }

    @AfterEach
    void tearDown() {
        database.close();
    }

    @Nested
    @DisplayName("distance")
    class Distance {

        @Test
        @DisplayName("identical coordinates are zero distance apart")
        void identicalPointsAreZero() {
            assertEquals(0.0, Haversine.distanceKm(HYDERABAD_LAT, HYDERABAD_LON,
                    HYDERABAD_LAT, HYDERABAD_LON), 1e-9);
        }

        @Test
        @DisplayName("a known long-haul distance is roughly right")
        void knownDistanceIsAccurate() {
            // Hyderabad to Bengaluru is about 500 km as the crow flies; road distance is longer.
            double km = Haversine.distanceKm(17.3850, 78.4867, 12.9716, 77.5946);

            assertTrue(km > 480 && km < 520, "got " + km);
        }

        @Test
        @DisplayName("distance is symmetric")
        void distanceIsSymmetric() {
            double there = Haversine.distanceKm(17.3850, 78.4867, 19.0760, 72.8777);
            double back = Haversine.distanceKm(19.0760, 72.8777, 17.3850, 78.4867);

            assertEquals(there, back, 1e-9);
        }

        @Test
        @DisplayName("out-of-range coordinates are rejected")
        void invalidCoordinatesRejected() {
            assertThrows(IllegalArgumentException.class,
                    () -> Haversine.distanceKm(91.0, 0.0, 0.0, 0.0));
            assertThrows(IllegalArgumentException.class,
                    () -> Haversine.distanceKm(0.0, 181.0, 0.0, 0.0));
            assertThrows(IllegalArgumentException.class,
                    () -> Haversine.distanceKm(Double.NaN, 0.0, 0.0, 0.0));
        }
    }

    @Nested
    @DisplayName("scoring")
    class Scoring {

        @Test
        @DisplayName("the score is the section 10 weighted sum")
        void scoreFollowsTheFormula() {
            // 1 km away, first aid and vehicle: 1.0*0.4 + 1*0.3 + 1*0.3
            double oneKmNorth = Haversine.distanceKm(HYDERABAD_LAT, HYDERABAD_LON,
                    HYDERABAD_LAT + (1.0 / 111.32), HYDERABAD_LON);
            ResponderRecord responder = new ResponderRecord(
                    "VOL-1", "One", HYDERABAD_LAT + (1.0 / 111.32), HYDERABAD_LON, 1, 1,
                    ResponderRecord.ONLINE);

            MatchCandidate candidate = matcher.score(responder, HYDERABAD_LAT, HYDERABAD_LON);

            double expected = (1.0 / oneKmNorth) * CapabilityMatcher.PROXIMITY_WEIGHT
                    + 1 * CapabilityMatcher.FIRST_AID_WEIGHT
                    + 1 * CapabilityMatcher.VEHICLE_WEIGHT;
            assertEquals(expected, candidate.matchScore(), 1e-6);
        }

        @Test
        @DisplayName("the three weights sum to one")
        void weightsSumToOne() {
            assertEquals(1.0, CapabilityMatcher.PROXIMITY_WEIGHT
                    + CapabilityMatcher.FIRST_AID_WEIGHT
                    + CapabilityMatcher.VEHICLE_WEIGHT, 1e-9);
        }

        @Test
        @DisplayName("an offline volunteer is never scored")
        void offlineIsNotScored() {
            ResponderRecord offline = new ResponderRecord(
                    "VOL-1", "One", HYDERABAD_LAT, HYDERABAD_LON, 1, 1, ResponderRecord.OFFLINE);

            assertEquals(null, matcher.score(offline, HYDERABAD_LAT, HYDERABAD_LON));
        }
    }

    @Nested
    @DisplayName("zero distance")
    class ZeroDistance {

        @Test
        @DisplayName("a volunteer on the exact spot gets the maximum proximity score")
        void zeroDistanceIsCappedNotInfinite() {
            responders.upsert(new ResponderRecord("VOL-ONSPOT", "On the spot",
                    HYDERABAD_LAT, HYDERABAD_LON, 0, 0, ResponderRecord.ONLINE));

            MatchCandidate candidate = matcher.rank(HYDERABAD_LAT, HYDERABAD_LON, Set.of()).get(0);

            assertEquals(0.0, candidate.distanceKm(), 1e-9);
            assertTrue(Double.isFinite(candidate.matchScore()),
                    "a zero distance must not produce an infinite score, got " + candidate.matchScore());
            assertEquals(CapabilityMatcher.MAX_PROXIMITY_SCORE * CapabilityMatcher.PROXIMITY_WEIGHT,
                    candidate.matchScore(), 1e-6);
        }

        @Test
        @DisplayName("a volunteer on the spot outranks a nearby skilled one")
        void zeroDistanceWins() {
            responders.upsert(new ResponderRecord("VOL-ONSPOT", "On the spot",
                    HYDERABAD_LAT, HYDERABAD_LON, 0, 0, ResponderRecord.ONLINE));
            responders.upsert(new ResponderRecord("VOL-SKILLED", "Skilled",
                    HYDERABAD_LAT + 0.01, HYDERABAD_LON, 1, 1, ResponderRecord.ONLINE));

            Optional<MatchCandidate> best = matcher.findBest(HYDERABAD_LAT, HYDERABAD_LON, Set.of());

            assertTrue(best.isPresent());
            assertEquals("VOL-ONSPOT", best.get().responderId());
        }

        @Test
        @DisplayName("the proximity helper rejects a negative distance")
        void negativeDistanceRejected() {
            assertThrows(IllegalArgumentException.class,
                    () -> CapabilityMatcher.proximityScore(-1.0));
            assertThrows(IllegalArgumentException.class,
                    () -> CapabilityMatcher.proximityScore(Double.NaN));
        }
    }

    @Nested
    @DisplayName("ordering")
    class Ordering {

        @Test
        @DisplayName("proximity dominates when candidates are otherwise similar")
        void nearestWins() {
            responders.upsert(new ResponderRecord("VOL-FAR", "Far",
                    HYDERABAD_LAT + 0.20, HYDERABAD_LON, 1, 1, ResponderRecord.ONLINE));
            responders.upsert(new ResponderRecord("VOL-NEAR", "Near",
                    HYDERABAD_LAT + 0.01, HYDERABAD_LON, 1, 1, ResponderRecord.ONLINE));

            List<MatchCandidate> ranked = matcher.rank(HYDERABAD_LAT, HYDERABAD_LON, Set.of());

            assertEquals("VOL-NEAR", ranked.get(0).responderId());
            assertEquals("VOL-FAR", ranked.get(1).responderId());
            assertTrue(ranked.get(0).matchScore() > ranked.get(1).matchScore());
        }

        @Test
        @DisplayName("a skilled far volunteer can outrank an unskilled near one")
        void skillsCanBeatProximity() {
            responders.upsert(new ResponderRecord("VOL-NEAR-PLAIN", "Near plain",
                    HYDERABAD_LAT + 0.01, HYDERABAD_LON, 0, 0, ResponderRecord.ONLINE));
            responders.upsert(new ResponderRecord("VOL-FAR-SKILLED", "Far skilled",
                    HYDERABAD_LAT + 0.20, HYDERABAD_LON, 1, 1, ResponderRecord.ONLINE));

            // ~22 km away caps proximity at ~1/22 = 0.045 * 0.4 = 0.018, versus 0.6 from both skills.
            List<MatchCandidate> ranked = matcher.rank(HYDERABAD_LAT, HYDERABAD_LON, Set.of());

            assertEquals("VOL-FAR-SKILLED", ranked.get(0).responderId());
        }

        @Test
        @DisplayName("the ranking is sorted best first")
        void rankingIsSorted() {
            responders.upsert(new ResponderRecord("VOL-A", "A", HYDERABAD_LAT + 0.30, HYDERABAD_LON, 0, 0,
                    ResponderRecord.ONLINE));
            responders.upsert(new ResponderRecord("VOL-B", "B", HYDERABAD_LAT + 0.02, HYDERABAD_LON, 1, 0,
                    ResponderRecord.ONLINE));
            responders.upsert(new ResponderRecord("VOL-C", "C", HYDERABAD_LAT + 0.10, HYDERABAD_LON, 0, 1,
                    ResponderRecord.ONLINE));

            List<MatchCandidate> ranked = matcher.rank(HYDERABAD_LAT, HYDERABAD_LON, Set.of());

            for (int i = 1; i < ranked.size(); i++) {
                assertTrue(ranked.get(i - 1).matchScore() >= ranked.get(i).matchScore(),
                        "ranking must be descending by score");
            }
        }

        @Test
        @DisplayName("ties break deterministically on responder id")
        void tiesAreDeterministic() {
            // Perfectly symmetric pair, identical scores.
            responders.upsert(new ResponderRecord("VOL-B", "B", HYDERABAD_LAT + 0.05, HYDERABAD_LON, 1, 1,
                    ResponderRecord.ONLINE));
            responders.upsert(new ResponderRecord("VOL-A", "A", HYDERABAD_LAT - 0.05, HYDERABAD_LON, 1, 1,
                    ResponderRecord.ONLINE));

            for (int attempt = 0; attempt < 5; attempt++) {
                assertEquals("VOL-A", matcher.rank(HYDERABAD_LAT, HYDERABAD_LON, Set.of())
                        .get(0).responderId());
            }
        }

        @Test
        @DisplayName("offline volunteers never appear in the ranking")
        void offlineExcluded() {
            responders.upsert(new ResponderRecord("VOL-ONLINE", "Online",
                    HYDERABAD_LAT, HYDERABAD_LON, 1, 1, ResponderRecord.ONLINE));
            responders.upsert(new ResponderRecord("VOL-OFFLINE", "Offline",
                    HYDERABAD_LAT, HYDERABAD_LON, 1, 1, ResponderRecord.OFFLINE));

            List<MatchCandidate> ranked = matcher.rank(HYDERABAD_LAT, HYDERABAD_LON, Set.of());

            assertEquals(1, ranked.size());
            assertEquals("VOL-ONLINE", ranked.get(0).responderId());
        }
    }

    @Nested
    @DisplayName("edge cases")
    class EdgeCases {

        @Test
        @DisplayName("no volunteers at all yields no match rather than an error")
        void noCandidatesYieldsEmpty() {
            Optional<MatchCandidate> best = matcher.findBest(HYDERABAD_LAT, HYDERABAD_LON, Set.of());

            assertTrue(best.isEmpty());
        }

        @Test
        @DisplayName("excluding every candidate yields no match")
        void allExcludedYieldsEmpty() {
            responders.upsert(new ResponderRecord("VOL-1", "One", HYDERABAD_LAT, HYDERABAD_LON, 1, 1,
                    ResponderRecord.ONLINE));

            Optional<MatchCandidate> best = matcher
                    .findBest(HYDERABAD_LAT, HYDERABAD_LON, Set.of("VOL-1"));

            assertTrue(best.isEmpty());
        }

        @Test
        @DisplayName("a decline exclusion moves the match to the next best")
        void exclusionPromotesNextBest() {
            responders.upsert(new ResponderRecord("VOL-BEST", "Best",
                    HYDERABAD_LAT, HYDERABAD_LON, 1, 1, ResponderRecord.ONLINE));
            responders.upsert(new ResponderRecord("VOL-SECOND", "Second",
                    HYDERABAD_LAT + 0.05, HYDERABAD_LON, 0, 1, ResponderRecord.ONLINE));

            assertEquals("VOL-BEST",
                    matcher.findBest(HYDERABAD_LAT, HYDERABAD_LON, Set.of()).orElseThrow().responderId());
            assertEquals("VOL-SECOND", matcher.findBest(HYDERABAD_LAT, HYDERABAD_LON, Set.of("VOL-BEST"))
                    .orElseThrow().responderId());
        }

        @Test
        @DisplayName("a null exclusion set is treated as empty")
        void nullExclusionsTreatedAsEmpty() {
            responders.upsert(new ResponderRecord("VOL-1", "One", HYDERABAD_LAT, HYDERABAD_LON, 1, 1,
                    ResponderRecord.ONLINE));

            assertTrue(matcher.findBest(HYDERABAD_LAT, HYDERABAD_LON, null).isPresent());
        }

        @Test
        @DisplayName("only online candidates are counted when everything is offline")
        void allOfflineYieldsEmpty() {
            responders.upsert(new ResponderRecord("VOL-1", "One", HYDERABAD_LAT, HYDERABAD_LON, 1, 1,
                    ResponderRecord.OFFLINE));

            assertTrue(matcher.findBest(HYDERABAD_LAT, HYDERABAD_LON, Set.of()).isEmpty());
        }
    }

    @Nested
    @DisplayName("concurrent use")
    class Concurrent {

        @Test
        @DisplayName("parallel matching returns consistent winners")
        void parallelMatchingIsConsistent() throws Exception {
            responders.upsert(new ResponderRecord("VOL-A", "A", HYDERABAD_LAT, HYDERABAD_LON, 1, 1,
                    ResponderRecord.ONLINE));
            responders.upsert(new ResponderRecord("VOL-B", "B", HYDERABAD_LAT + 0.05, HYDERABAD_LON, 1, 0,
                    ResponderRecord.ONLINE));

            int threads = 12;
            ExecutorService pool = Executors.newFixedThreadPool(threads);
            try {
                List<Callable<String>> jobs = java.util.stream.IntStream.range(0, threads)
                        .<Callable<String>>mapToObj(i -> () ->
                                matcher.findBest(HYDERABAD_LAT, HYDERABAD_LON, Set.of())
                                        .orElseThrow().responderId())
                        .toList();
                List<Future<String>> futures = pool.invokeAll(jobs, 60, TimeUnit.SECONDS);

                for (Future<String> future : futures) {
                    assertEquals("VOL-A", future.get());
                }
            } finally {
                pool.shutdownNow();
            }
        }
    }

    @Nested
    @DisplayName("record validation")
    class RecordValidation {

        @Test
        @DisplayName("a responder normalizes its capability flags to 0 or 1")
        void flagsNormalize() {
            ResponderRecord record = new ResponderRecord("VOL-1", "One", 0.0, 0.0, 7, -3,
                    ResponderRecord.ONLINE);

            assertEquals(1, record.firstAidCert());
            assertEquals(1, record.vehicleAccess());
        }

        @Test
        @DisplayName("out-of-range responder coordinates are refused")
        void coordinatesValidated() {
            assertThrows(IllegalArgumentException.class, () -> new ResponderRecord(
                    "VOL-1", "One", 91.0, 0.0, 1, 1, ResponderRecord.ONLINE));
        }

        @Test
        @DisplayName("a negative distance on a candidate is refused")
        void candidateValidatesDistance() {
            ResponderRecord responder = new ResponderRecord(
                    "VOL-1", "One", 0.0, 0.0, 1, 1, ResponderRecord.ONLINE);

            assertThrows(IllegalArgumentException.class, () -> new MatchCandidate(responder, -1.0, 1.0));
            assertFalse(responder.isOnline() && "OFFLINE".equals(responder.status()));
        }
    }
}
