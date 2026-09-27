package com.safesphere.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

/** Behavioural tests for the AES-256-GCM Evidence Vault. */
class EvidenceVaultTest {

    /** A test key. Injected, never a constant the production code could depend on. */
    private static byte[] testKey() {
        byte[] key = new byte[EvidenceVault.KEY_BYTES];
        for (int i = 0; i < key.length; i++) {
            key[i] = (byte) (i * 7 + 3);
        }
        return key;
    }

    @Nested
    @DisplayName("round trip")
    class RoundTrip {

        @Test
        @DisplayName("sealed evidence opens back to the original plaintext")
        void roundTrips() {
            EvidenceVault vault = new EvidenceVault(testKey());

            String sealed = vault.seal("blood type O+, allergy penicillin");

            assertEquals("blood type O+, allergy penicillin", vault.open(sealed));
        }

        @Test
        @DisplayName("empty and unicode plaintext survive the round trip")
        void handlesEdgeCasePlaintext() {
            EvidenceVault vault = new EvidenceVault(testKey());

            assertEquals("", vault.open(vault.seal("")));
            String unicode = "/help — needs help · अमर — 中文";
            assertEquals(unicode, vault.open(vault.seal(unicode)));
        }

        @Test
        @DisplayName("a large payload round trips")
        void handlesLargePayload() {
            EvidenceVault vault = new EvidenceVault(testKey());
            String large = "x".repeat(200_000);

            assertEquals(large, vault.open(vault.seal(large)));
        }
    }

    @Nested
    @DisplayName("nonce handling")
    class NonceHandling {

        @Test
        @DisplayName("sealing the same plaintext twice yields different ciphertext")
        void nonceIsRandomPerCall() {
            EvidenceVault vault = new EvidenceVault(testKey());

            String first = vault.seal("identical");
            String second = vault.seal("identical");

            assertNotEquals(first, second,
                    "a reused nonce under one key would be a serious AES-GCM failure");
            assertEquals(vault.open(first), vault.open(second));
        }

        @Test
        @DisplayName("many seals of one plaintext are all distinct")
        void noncesDoNotRepeat() {
            EvidenceVault vault = new EvidenceVault(testKey());

            Set<String> sealed = new HashSet<>();
            for (int i = 0; i < 200; i++) {
                sealed.add(vault.seal("same input"));
            }

            assertEquals(200, sealed.size());
        }

        @Test
        @DisplayName("the nonce prefix is the expected length")
        void nonceIsTwelveBytes() {
            byte[] key = testKey();
            EvidenceVault vault = new EvidenceVault(key);

            byte[] decoded = Base64.getDecoder().decode(vault.seal("x"));

            assertTrue(decoded.length > EvidenceVault.NONCE_BYTES);
            // 12-byte nonce + 1-byte plaintext + 16-byte GCM tag
            assertEquals(EvidenceVault.NONCE_BYTES + 1 + 16, decoded.length);
        }
    }

    @Nested
    @DisplayName("failure cases")
    class FailureCases {

        @Test
        @DisplayName("the wrong key cannot open the evidence")
        void wrongKeyFails() {
            byte[] other = testKey();
            other[0] ^= 0xFF;
            EvidenceVault vault = new EvidenceVault(testKey());

            String sealed = vault.seal("confidential");

            assertThrows(IllegalArgumentException.class, () -> new EvidenceVault(other).open(sealed));
        }

        @Test
        @DisplayName("a tampered ciphertext fails authentication rather than decrypting")
        void tamperedCiphertextFails() {
            EvidenceVault vault = new EvidenceVault(testKey());
            byte[] decoded = Base64.getDecoder().decode(vault.seal("confidential"));

            decoded[decoded.length - 1] ^= 0x01; // flip a bit in the GCM tag

            String tampered = Base64.getEncoder().encodeToString(decoded);
            assertThrows(IllegalArgumentException.class, () -> vault.open(tampered));
        }

        @Test
        @DisplayName("a tampered nonce fails authentication")
        void tamperedNonceFails() {
            EvidenceVault vault = new EvidenceVault(testKey());
            byte[] decoded = Base64.getDecoder().decode(vault.seal("confidential"));

            decoded[0] ^= 0x01; // flip a bit in the nonce

            assertThrows(IllegalArgumentException.class,
                    () -> vault.open(Base64.getEncoder().encodeToString(decoded)));
        }

        @Test
        @DisplayName("malformed base64 is rejected")
        void malformedBase64Rejected() {
            EvidenceVault vault = new EvidenceVault(testKey());

            assertThrows(IllegalArgumentException.class, () -> vault.open("not base64 !!!"));
        }

        @Test
        @DisplayName("a payload too short to hold a nonce is rejected")
        void truncatedPayloadRejected() {
            EvidenceVault vault = new EvidenceVault(testKey());
            String tooShort = Base64.getEncoder().encodeToString(new byte[4]);

            assertThrows(IllegalArgumentException.class, () -> vault.open(tooShort));
        }

        @Test
        @DisplayName("a key of the wrong length is refused")
        void wrongKeyLengthRejected() {
            assertThrows(IllegalArgumentException.class, () -> new EvidenceVault(new byte[16]));
            assertThrows(IllegalArgumentException.class, () -> new EvidenceVault(new byte[64]));
        }

        @Test
        @DisplayName("a base64 key of the wrong length is refused")
        void base64KeyLengthChecked() {
            assertThrows(IllegalArgumentException.class,
                    () -> EvidenceVault.fromBase64(Base64.getEncoder().encodeToString(new byte[16])));
        }
    }

    @Nested
    @DisplayName("key handling and secrecy")
    class KeyHandling {

        @Test
        @DisplayName("a generated key is 32 bytes and works")
        void generatedKeyWorks() {
            EvidenceVault vault = new EvidenceVault(EvidenceVault.generateKey());

            String sealed = vault.seal("payload");

            assertEquals("payload", vault.open(sealed));
        }

        @Test
        @DisplayName("two generated keys differ")
        void generatedKeysDiffer() {
            assertFalse(java.util.Arrays.equals(
                    EvidenceVault.generateKey(), EvidenceVault.generateKey()));
        }

        @Test
        @DisplayName("a base64 key round trips through the factory")
        void base64KeyRoundTrips() {
            byte[] key = testKey();
            EvidenceVault vault = EvidenceVault.fromBase64(
                    Base64.getEncoder().encodeToString(key));

            assertEquals("secret", vault.open(vault.seal("secret")));
        }

        @Test
        @DisplayName("neither the key nor the plaintext appears in toString")
        void toStringLeaksNothing() {
            EvidenceVault vault = new EvidenceVault(testKey());
            String sealed = vault.seal("top secret medical summary");
            String text = vault.toString();

            assertFalse(text.contains(Base64.getEncoder().encodeToString(testKey())), text);
            assertFalse(text.contains("top secret"), text);
            assertFalse(sealed.contains("top secret"));
        }

        @Test
        @DisplayName("sealed output does not contain the plaintext")
        void ciphertextHidesPlaintext() {
            EvidenceVault vault = new EvidenceVault(testKey());

            String sealed = vault.seal("distinctive-marker-string");

            assertFalse(sealed.contains("distinctive-marker-string"));
            assertFalse(new String(Base64.getDecoder().decode(sealed), StandardCharsets.UTF_8)
                    .contains("distinctive-marker-string"));
        }
    }

    @Nested
    @DisplayName("concurrency")
    class Concurrency {

        @Test
        @DisplayName("a single vault seals correctly from many threads at once")
        void sealsConcurrently() throws Exception {
            EvidenceVault vault = new EvidenceVault(testKey());
            int threads = 16;
            int perThread = 40;
            ExecutorService pool = Executors.newFixedThreadPool(threads);
            CountDownLatch start = new CountDownLatch(1);
            AtomicInteger failures = new AtomicInteger();

            try {
                for (int t = 0; t < threads; t++) {
                    final int id = t;
                    pool.submit(() -> {
                        try {
                            start.await();
                            for (int i = 0; i < perThread; i++) {
                                String plaintext = "thread-" + id + "-" + i;
                                if (!plaintext.equals(vault.open(vault.seal(plaintext)))) {
                                    failures.incrementAndGet();
                                }
                            }
                        } catch (Exception e) {
                            failures.incrementAndGet();
                        }
                    });
                }
                start.countDown();
                pool.shutdown();
                assertTrue(pool.awaitTermination(60, TimeUnit.SECONDS));
            } finally {
                pool.shutdownNow();
            }

            assertEquals(0, failures.get(), "concurrent seal/open round trips must all succeed");
        }
    }
}
