package com.safesphere.security;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;
import java.util.Objects;
import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

/**
 * The Evidence Vault: AES-256-GCM sealing of incident evidence.
 *
 * <p>Format is {@code base64( nonce || ciphertext || tag )} with a fresh 12-byte nonce per call,
 * drawn from {@link SecureRandom}. GCM is authenticated, so tampering fails on {@link #open} rather
 * than decrypting to garbage.
 *
 * <p>Key handling: the key is injected, never stored here and never derived from a constant. There
 * is no hard-coded secret in this file. Callers obtain the key from configuration; see
 * {@link #fromBase64(String)} and the local-only behaviour in {@code SafeSphereApplication}, which
 * generates an ephemeral key when none is configured and logs a warning.
 *
 * <p>No plaintext or key material is ever logged. {@link #toString()} deliberately reports nothing
 * useful.
 */
public final class EvidenceVault {

    /** AES key length in bits. */
    public static final int KEY_BITS = 256;
    /** Required key length in bytes. */
    public static final int KEY_BYTES = KEY_BITS / 8;
    /** GCM nonce length in bytes. */
    public static final int NONCE_BYTES = 12;
    /** GCM authentication tag length in bits. */
    public static final int TAG_BITS = 128;

    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final String ALGORITHM = "AES";

    private final SecretKey key;
    private final SecureRandom random;

    /** Uses the shared default {@link SecureRandom}. */
    public EvidenceVault(byte[] keyBytes) {
        this(keyBytes, new SecureRandom());
    }

    /**
     * Test seam: injects a specific {@link SecureRandom} so a test can assert that two seals of the
     * same plaintext differ.
     */
    EvidenceVault(byte[] keyBytes, SecureRandom random) {
        Objects.requireNonNull(keyBytes, "keyBytes is required");
        Objects.requireNonNull(random, "random is required");
        if (keyBytes.length != KEY_BYTES) {
            throw new IllegalArgumentException(
                    "AES-256 requires a " + KEY_BYTES + "-byte key, got " + keyBytes.length);
        }
        this.key = new SecretKeySpec(Arrays.copyOf(keyBytes, KEY_BYTES), ALGORITHM);
        this.random = random;
    }

    /**
     * Builds a vault from a base64 key, as supplied by configuration.
     *
     * @throws IllegalArgumentException if the value is not valid base64 of exactly 32 bytes
     */
    public static EvidenceVault fromBase64(String base64Key) {
        Objects.requireNonNull(base64Key, "base64Key is required");
        byte[] decoded;
        try {
            decoded = Base64.getDecoder().decode(base64Key.trim());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("evidence key is not valid base64", e);
        }
        return new EvidenceVault(decoded);
    }

    /** Generates a fresh random key. Intended for ephemeral local development use only. */
    public static byte[] generateKey() {
        byte[] key = new byte[KEY_BYTES];
        new SecureRandom().nextBytes(key);
        return key;
    }

    /**
     * Seals plaintext.
     *
     * @return base64 of {@code nonce || ciphertext || tag}
     */
    public String seal(String plaintext) {
        Objects.requireNonNull(plaintext, "plaintext is required");
        try {
            byte[] nonce = new byte[NONCE_BYTES];
            random.nextBytes(nonce);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, nonce));
            byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            byte[] sealed = new byte[nonce.length + ciphertext.length];
            System.arraycopy(nonce, 0, sealed, 0, nonce.length);
            System.arraycopy(ciphertext, 0, sealed, nonce.length, ciphertext.length);
            return Base64.getEncoder().encodeToString(sealed);
        } catch (GeneralSecurityException e) {
            // The plaintext is not echoed into the exception or the log.
            throw new IllegalStateException("evidence sealing failed", e);
        }
    }

    /**
     * Opens a sealed payload.
     *
     * @throws IllegalArgumentException if the payload is malformed, truncated, or fails
     *         authentication, which is what a tampered ciphertext does
     */
    public String open(String sealedBase64) {
        Objects.requireNonNull(sealedBase64, "sealedBase64 is required");
        byte[] sealed;
        try {
            sealed = Base64.getDecoder().decode(sealedBase64.trim());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("sealed evidence is not valid base64", e);
        }
        if (sealed.length <= NONCE_BYTES) {
            throw new IllegalArgumentException("sealed evidence is too short to contain a nonce");
        }
        try {
            byte[] nonce = Arrays.copyOfRange(sealed, 0, NONCE_BYTES);
            byte[] ciphertext = Arrays.copyOfRange(sealed, NONCE_BYTES, sealed.length);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, nonce));
            return new String(cipher.doFinal(ciphertext), StandardCharsets.UTF_8);
        } catch (GeneralSecurityException e) {
            throw new IllegalArgumentException("sealed evidence failed authentication", e);
        }
    }

    @Override
    public String toString() {
        return "EvidenceVault[algorithm=AES-256-GCM, key=<redacted>]";
    }
}
