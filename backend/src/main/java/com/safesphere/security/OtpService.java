package com.safesphere.security;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Internal service for the six-digit {@code silence_otp} described in {@code SafeSphere.md} section
 * 6.3 and section 8.
 *
 * <p><strong>Internal only.</strong> There is deliberately no route, WebSocket channel, or field
 * carrying an OTP anywhere in this backend. Silencing a victim's alert is a Professional App Field
 * mode action, and that app is a separate repository with its own contract. This class exists so the
 * OTP behaviour is correct and tested before the surface that will consume it is contracted.
 *
 * <p>Behaviour: digits are drawn from {@link SecureRandom}, a code expires after a fixed lifetime, and
 * verification is one-time use — a successful {@link #verify} consumes the code, so replaying the
 * same entry cannot silence anything twice.
 *
 * <p>Codes are held in memory only and are never logged. Store hashes rather than codes if this ever
 * moves to a multi-process deployment.
 */
public final class OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpService.class);

    /** The documented OTP length. */
    public static final int OTP_LENGTH = 6;
    /** The lifetime used by the local demo, matching the section 6.3 example window. */
    public static final Duration DEFAULT_LIFETIME = Duration.ofMinutes(30);

    private final SecureRandom random;
    private final Duration lifetime;
    private final Map<String, IssuedOtp> issued = new ConcurrentHashMap<>();

    public OtpService() {
        this(new SecureRandom(), DEFAULT_LIFETIME);
    }

    /** Test seam: injects the random source and the lifetime. */
    public OtpService(SecureRandom random, Duration lifetime) {
        this.random = Objects.requireNonNull(random, "random is required");
        this.lifetime = Objects.requireNonNull(lifetime, "lifetime is required");
        if (lifetime.isNegative() || lifetime.isZero()) {
            throw new IllegalArgumentException("OTP lifetime must be positive");
        }
    }

    /**
     * Issues a code for an incident and stores it in memory.
     *
     * <p>The plaintext code is returned to the caller exactly once. Issuing again for the same
     * incident replaces any previous code, so only the newest entry is ever valid.
     */
    public IssuedOtp issue(String capsuleId, Instant now) {
        Objects.requireNonNull(capsuleId, "capsuleId is required");
        Objects.requireNonNull(now, "now is required");

        StringBuilder code = new StringBuilder(OTP_LENGTH);
        for (int i = 0; i < OTP_LENGTH; i++) {
            code.append((char) ('0' + random.nextInt(10)));
        }
        String plain = code.toString();
        Instant expiresAt = now.plus(lifetime);
        issued.put(capsuleId, new IssuedOtp(plain, now, expiresAt));
        log.info("issued internal silence OTP for incident {} expiring at {}", capsuleId, expiresAt);
        return new IssuedOtp(plain, now, expiresAt);
    }

    /**
     * Checks a submitted code and consumes it on success.
     *
     * @return {@link OtpOutcome#VALID}, {@link OtpOutcome#EXPIRED}, {@link OtpOutcome#MISMATCH}, or
     *         {@link OtpOutcome#NONE_ISSUED}. Only {@link OtpOutcome#VALID} removes the code.
     */
    public OtpOutcome verify(String capsuleId, String submitted, Instant now) {
        Objects.requireNonNull(capsuleId, "capsuleId is required");
        Objects.requireNonNull(now, "now is required");

        IssuedOtp current = issued.get(capsuleId);
        if (current == null) {
            return OtpOutcome.NONE_ISSUED;
        }
        if (!now.isBefore(current.expiresAt())) {
            issued.remove(capsuleId, current);
            return OtpOutcome.EXPIRED;
        }
        if (submitted == null || !constantTimeEquals(current.code(), submitted)) {
            return OtpOutcome.MISMATCH;
        }
        // One-time use: a correct entry consumes the code.
        issued.remove(capsuleId, current);
        return OtpOutcome.VALID;
    }

    /** Whether an unconsumed, unexpired code exists. Never reveals the code. */
    public boolean hasActiveCode(String capsuleId) {
        IssuedOtp current = issued.get(capsuleId);
        return current != null;
    }

    /** Discards any code for an incident. */
    public void revoke(String capsuleId) {
        issued.remove(capsuleId);
    }

    private static boolean constantTimeEquals(String expected, String actual) {
        byte[] a = expected.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        byte[] b = actual.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        return java.security.MessageDigest.isEqual(a, b);
    }

    /**
     * A newly issued code.
     *
     * @param code      the six digits; returned once and never logged
     * @param issuedAt  when it was created
     * @param expiresAt when it stops being valid
     */
    public record IssuedOtp(String code, Instant issuedAt, Instant expiresAt) {

        public IssuedOtp {
            Objects.requireNonNull(code, "code is required");
            Objects.requireNonNull(issuedAt, "issuedAt is required");
            Objects.requireNonNull(expiresAt, "expiresAt is required");
        }

        /** Whether the code is still valid at {@code now}. */
        public boolean isValidAt(Instant now) {
            return now.isBefore(expiresAt());
        }
    }

    /** The result of a verification attempt. */
    public enum OtpOutcome {

        /** Correct and unexpired; the code has now been consumed. */
        VALID,
        /** The code existed but its lifetime elapsed. It has been discarded. */
        EXPIRED,
        /** Wrong digits. The code survives, so the responder may try again. */
        MISMATCH,
        /** No code was ever issued for this incident. */
        NONE_ISSUED;

        /** Whether the entry silenced anything. */
        public boolean isValid() {
            return this == VALID;
        }
    }

    /** Never expose the code through a stray log or toString. */
    @Override
    public String toString() {
        return "OtpService[length=" + OTP_LENGTH + ", lifetime=" + lifetime + ", codes=<redacted>]";
    }

    /** Convenience for callers that only need to know whether a code is active. */
    public Optional<Instant> expiryOf(String capsuleId) {
        IssuedOtp current = issued.get(capsuleId);
        return current == null ? Optional.empty() : Optional.of(current.expiresAt());
    }
}
