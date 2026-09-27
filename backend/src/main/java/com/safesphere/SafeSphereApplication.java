package com.safesphere;

import com.safesphere.persistence.Database;
import com.safesphere.security.EvidenceVault;
import java.time.Clock;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Executable entry point.
 *
 * <p>Listens on the {@code PORT} environment variable, defaulting to {@code 8080}. Two environment
 * variables are also read:
 *
 * <ul>
 *   <li>{@code SAFESPHERE_DB_PATH} — SQLite file, default {@code backend/data/safesphere.db}.</li>
 *   <li>{@code SAFESPHERE_EVIDENCE_KEY_BASE64} — base64 of 32 bytes for the Evidence Vault. If it is
 *       unset the process generates an <strong>ephemeral</strong> key and logs a loud warning:
 *       evidence sealed in one run becomes unreadable in the next. That is acceptable for a local
 *       demo and must never be used for real evidence.</li>
 * </ul>
 *
 * <p>No secret is hard-coded, printed, or logged.
 */
public final class SafeSphereApplication {

    private static final Logger log = LoggerFactory.getLogger(SafeSphereApplication.class);

    /** The port used when {@code PORT} is unset or unusable. */
    public static final int DEFAULT_PORT = 8080;

    private SafeSphereApplication() {
    }

    public static void main(String[] args) {
        int port = resolvePort(System.getenv("PORT"));
        String dbPath = envOrDefault("SAFESPHERE_DB_PATH", Database.DEFAULT_PATH);
        EvidenceVault vault = resolveVault(System.getenv("SAFESPHERE_EVIDENCE_KEY_BASE64"));

        Database database = new Database(
                Database.DEFAULT_PATH.equals(dbPath) ? Database.prepareDefaultFile() : dbPath);

        BackendApplication backend =
                new BackendApplication(database, vault, Clock.systemUTC(), true);
        backend.start(port);

        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            log.info("shutting down");
            backend.close();
        }, "safesphere-shutdown"));
    }

    /** Parses {@code PORT}, falling back to {@link #DEFAULT_PORT} when absent or invalid. */
    static int resolvePort(String raw) {
        if (raw == null || raw.isBlank()) {
            return DEFAULT_PORT;
        }
        try {
            int port = Integer.parseInt(raw.trim());
            if (port < 1 || port > 65535) {
                log.warn("PORT {} is out of range; using {}", raw, DEFAULT_PORT);
                return DEFAULT_PORT;
            }
            return port;
        } catch (NumberFormatException e) {
            log.warn("PORT '{}' is not a number; using {}", raw, DEFAULT_PORT);
            return DEFAULT_PORT;
        }
    }

    private static EvidenceVault resolveVault(String configuredKey) {
        if (configuredKey == null || configuredKey.isBlank()) {
            log.warn("SAFESPHERE_EVIDENCE_KEY_BASE64 is not set; generating an EPHEMERAL key. "
                    + "Evidence sealed now will not be readable after a restart. "
                    + "This is for local development only.");
            return new EvidenceVault(EvidenceVault.generateKey());
        }
        try {
            return EvidenceVault.fromBase64(configuredKey);
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException(
                    "SAFESPHERE_EVIDENCE_KEY_BASE64 must be base64 of 32 bytes; generate one with "
                            + "'openssl rand -base64 32'", e);
        }
    }

    private static String envOrDefault(String name, String fallback) {
        String value = System.getenv(name);
        return value == null || value.isBlank() ? fallback : value.trim();
    }
}
