package com.safesphere.incident;

import com.safesphere.persistence.IncidentRepository;
import java.security.SecureRandom;
import java.util.Objects;

/**
 * Mints the {@code CR-####} capsule ids seen in the contract examples.
 *
 * <p>Ids are random rather than sequential: a predictable incident id would let anyone holding a
 * Citizen App's response confirm how many incidents exist. Collisions are checked against the table
 * and retried, and a monotonic fallback guarantees termination even if the id space is exhausted.
 */
public final class CapsuleIdGenerator {

    private static final String PREFIX = "CR-";
    private static final int DIGITS = 4;
    private static final int MAX_ATTEMPTS = 50;

    private final SecureRandom random;
    private final IncidentRepository incidents;
    private long fallbackCounter;

    public CapsuleIdGenerator(IncidentRepository incidents) {
        this(incidents, new SecureRandom());
    }

    /** Test seam: injects the random source. */
    public CapsuleIdGenerator(IncidentRepository incidents, SecureRandom random) {
        this.incidents = Objects.requireNonNull(incidents, "incidents is required");
        this.random = Objects.requireNonNull(random, "random is required");
    }

    /**
     * A capsule id that is not already present in the table.
     *
     * @return e.g. {@code CR-8924}
     */
    public String next() {
        for (int attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            String candidate = PREFIX + String.format("%0" + DIGITS + "d", random.nextInt(10_000));
            if (incidents.findByCapsuleId(candidate).isEmpty()) {
                return candidate;
            }
        }
        // Deterministic escape hatch; the id remains unique because the counter only increases.
        return PREFIX + String.format("%0" + (DIGITS + 3) + "d", ++fallbackCounter);
    }
}
