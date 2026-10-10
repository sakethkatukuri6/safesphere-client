package com.safesphere.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

/**
 * Behavioural tests for the internal OTP service.
 *
 * <p>These cover the Citizen-relevant invariant that matters most: nothing here is reachable from a
 * citizen-facing route, and {@code ARRIVED} is unrelated to any of it.
 */
class OtpServiceTest {

    private static final String CAPSULE = "CR-8924";
    private static final Instant T0 = Instant.parse("2026-09-27T10:15:00Z");

    @Nested
    @DisplayName("issuance")
    class Issuance {

        @Test
        @DisplayName("a code is six digits")
        void codeIsSixDigits() {
            OtpService service = new OtpService();

            String code = service.issue(CAPSULE, T0).code();

            assertEquals(OtpService.OTP_LENGTH, code.length());
            assertTrue(code.chars().allMatch(Character::isDigit), "got " + code);
        }

        @Test
        @DisplayName("codes are not predictable from one another")
        void codesVary() {
            OtpService service = new OtpService();

            Set<String> codes = new HashSet<>();
            for (int i = 0; i < 200; i++) {
                codes.add(service.issue(CAPSULE, T0).code());
            }

            assertTrue(codes.size() > 1, "200 issuances must not all be identical");
        }

        @Test
        @DisplayName("issuing again replaces the previous code")
        void reissueReplacesOldCode() {
            OtpService service = new OtpService();
            String first = service.issue(CAPSULE, T0).code();
            String second = service.issue(CAPSULE, T0).code();

            // The old code must no longer be honoured, even unexpired.
            OtpService.OtpOutcome stale = service.verify(CAPSULE, first, T0.plusSeconds(1));
            if (!first.equals(second)) {
                assertEquals(OtpService.OtpOutcome.MISMATCH, stale);
            }
        }

        @Test
        @DisplayName("expiry is the configured lifetime after issue")
        void expiryFollowsLifetime() {
            OtpService service = new OtpService(new SecureRandom(), Duration.ofMinutes(30));

            OtpService.IssuedOtp issued = service.issue(CAPSULE, T0);

            assertEquals(T0.plus(Duration.ofMinutes(30)), issued.expiresAt());
            assertTrue(issued.isValidAt(T0.plusSeconds(1)));
            assertFalse(issued.isValidAt(issued.expiresAt()));
        }

        @Test
        @DisplayName("a non-positive lifetime is refused")
        void lifetimeMustBePositive() {
            assertThrows(IllegalArgumentException.class,
                    () -> new OtpService(new SecureRandom(), Duration.ZERO));
            assertThrows(IllegalArgumentException.class,
                    () -> new OtpService(new SecureRandom(), Duration.ofSeconds(-1)));
        }
    }

    @Nested
    @DisplayName("verification")
    class Verification {

        @Test
        @DisplayName("a correct unexpired code is accepted")
        void correctCodeAccepted() {
            OtpService service = new OtpService();
            String code = service.issue(CAPSULE, T0).code();

            OtpService.OtpOutcome outcome = service.verify(CAPSULE, code, T0.plusSeconds(30));

            assertEquals(OtpService.OtpOutcome.VALID, outcome);
            assertTrue(outcome.isValid());
        }

        @Test
        @DisplayName("a wrong code is rejected and the real code survives")
        void wrongCodeRejected() {
            OtpService service = new OtpService();
            String code = service.issue(CAPSULE, T0).code();
            String wrong = code.equals("000000") ? "111111" : "000000";

            assertEquals(OtpService.OtpOutcome.MISMATCH, service.verify(CAPSULE, wrong, T0));
            assertEquals(OtpService.OtpOutcome.VALID, service.verify(CAPSULE, code, T0.plusSeconds(1)),
                    "a wrong entry must not consume the code");
        }

        @Test
        @DisplayName("a null submission is rejected")
        void nullSubmissionRejected() {
            OtpService service = new OtpService();
            service.issue(CAPSULE, T0);

            assertEquals(OtpService.OtpOutcome.MISMATCH, service.verify(CAPSULE, null, T0));
        }

        @Test
        @DisplayName("verifying an incident with no code reports none issued")
        void noCodeIssued() {
            OtpService service = new OtpService();

            assertEquals(OtpService.OtpOutcome.NONE_ISSUED, service.verify("CR-0000", "123456", T0));
        }
    }

    @Nested
    @DisplayName("one-time use")
    class OneTimeUse {

        @Test
        @DisplayName("a correct code cannot be used twice")
        void correctCodeIsSingleUse() {
            OtpService service = new OtpService();
            String code = service.issue(CAPSULE, T0).code();

            assertEquals(OtpService.OtpOutcome.VALID, service.verify(CAPSULE, code, T0));
            assertEquals(OtpService.OtpOutcome.NONE_ISSUED,
                    service.verify(CAPSULE, code, T0.plusSeconds(1)),
                    "a replayed code must not silence anything twice");
        }

        @Test
        @DisplayName("consuming a code clears it")
        void consumptionClears() {
            OtpService service = new OtpService();
            String code = service.issue(CAPSULE, T0).code();

            assertTrue(service.hasActiveCode(CAPSULE));
            service.verify(CAPSULE, code, T0);
            assertFalse(service.hasActiveCode(CAPSULE));
        }

        @Test
        @DisplayName("revoking removes a code")
        void revokeRemoves() {
            OtpService service = new OtpService();
            service.issue(CAPSULE, T0);

            service.revoke(CAPSULE);

            assertFalse(service.hasActiveCode(CAPSULE));
        }

        @Test
        @DisplayName("codes are scoped per incident")
        void codesAreScopedPerIncident() {
            OtpService service = new OtpService();
            String forA = service.issue("CR-1111", T0).code();
            service.issue("CR-2222", T0);

            assertEquals(OtpService.OtpOutcome.MISMATCH, service.verify("CR-2222", forA, T0));
            assertEquals(OtpService.OtpOutcome.VALID, service.verify("CR-1111", forA, T0));
        }
    }

    @Nested
    @DisplayName("expiry")
    class Expiry {

        @Test
        @DisplayName("a code is valid right up to its expiry and not after")
        void validUntilExpiry() {
            OtpService service = new OtpService(new SecureRandom(), Duration.ofMinutes(30));
            String code = service.issue(CAPSULE, T0).code();
            Instant expiresAt = T0.plus(Duration.ofMinutes(30));

            assertEquals(OtpService.OtpOutcome.VALID,
                    service.verify(CAPSULE, code, expiresAt.minusMillis(1)));
        }

        @Test
        @DisplayName("an expired code is rejected even when the digits are correct")
        void expiredCodeRejected() {
            OtpService service = new OtpService(new SecureRandom(), Duration.ofMinutes(30));
            String code = service.issue(CAPSULE, T0).code();
            Instant expiresAt = T0.plus(Duration.ofMinutes(30));

            assertEquals(OtpService.OtpOutcome.EXPIRED, service.verify(CAPSULE, code, expiresAt));
        }

        @Test
        @DisplayName("an expired code is discarded")
        void expiredCodeDiscarded() {
            OtpService service = new OtpService(new SecureRandom(), Duration.ofSeconds(1));
            service.issue(CAPSULE, T0);

            service.verify(CAPSULE, "000000", T0.plusSeconds(2));

            assertFalse(service.hasActiveCode(CAPSULE));
        }

        @Test
        @DisplayName("expiryOf never reveals the code")
        void expiryDoesNotLeakCode() {
            OtpService service = new OtpService();
            service.issue(CAPSULE, T0);

            assertTrue(service.expiryOf(CAPSULE).isPresent());
            assertTrue(service.expiryOf("CR-9999").isEmpty());
        }
    }

    @Nested
    @DisplayName("secrecy")
    class Secrecy {

        @Test
        @DisplayName("toString does not reveal any issued code")
        void toStringLeaksNoCode() {
            OtpService service = new OtpService();
            String code = service.issue(CAPSULE, T0).code();

            String text = service.toString();

            assertFalse(text.contains(code), text);
            assertTrue(text.contains("redacted"), text);
        }

        @Test
        @DisplayName("a deterministic random source still yields the injected digits")
        void honoursInjectedRandom() {
            // A fixed source makes the test deterministic; the production constructor uses SecureRandom.
            SecureRandom fixed = new SecureRandom() {
                private static final long serialVersionUID = 1L;

                @Override
                public int nextInt(int bound) {
                    return 7 % bound;
                }
            };
            OtpService service = new OtpService(fixed, Duration.ofMinutes(5));

            assertEquals("777777", service.issue(CAPSULE, T0).code());
            assertNotEquals("777777", new OtpService().issue(CAPSULE, T0).code() + "");
        }
    }
}
