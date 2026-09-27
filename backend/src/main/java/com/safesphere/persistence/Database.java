package com.safesphere.persistence;

import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Owns the SQLite connection lifecycle and applies the schema.
 *
 * <p>SQLite is the relational store for the M6 capability matcher ({@code SafeSphere.md} section 12).
 * Each unit of work opens its own short-lived connection and closes it, so there is no shared
 * mutable connection to synchronize; WAL mode plus a busy timeout let readers and the single writer
 * coexist, and every statement in the repositories is parameterized.
 *
 * <p>This is local-development infrastructure. It is not a production store and holds no
 * production personal data.
 */
public final class Database implements AutoCloseable {

    private static final Logger log = LoggerFactory.getLogger(Database.class);

    /**
     * The default local file, relative to the working directory the process is started in. Run from
     * {@code backend/}, that is {@code backend/data/safesphere.db}, which is git-ignored. Ignored by
     * git; created on first start.
     */
    public static final String DEFAULT_PATH = "data/safesphere.db";

    private final String jdbcUrl;

    /**
     * Keeps an in-memory database alive.
     *
     * <p>A {@code mode=memory} SQLite database exists only while at least one connection is open.
     * Since every unit of work opens and closes its own connection, the schema would otherwise be
     * destroyed between operations, so one connection is held for the lifetime of this object. Null
     * for file-backed databases, which persist on their own.
     */
    private Connection keeper;

    /**
     * Opens (or creates) a database file.
     *
     * @param path filesystem path, or {@code ":memory:"} for an ephemeral store
     */
    public Database(String path) {
        if (path == null || path.isBlank()) {
            throw new IllegalArgumentException("database path is required");
        }
        if (":memory:".equals(path)) {
            this.jdbcUrl = "jdbc:sqlite:file:safesphere_shared_mem?mode=memory&cache=shared";
        } else {
            this.jdbcUrl = "jdbc:sqlite:" + path;
            createParentDirectory(path);
        }
    }

    /**
     * Creates the directory a file-backed database lives in.
     *
     * <p>SQLite will not create missing parent directories, so pointing
     * {@code SAFESPHERE_DB_PATH} at a new location would otherwise fail on first start.
     */
    private static void createParentDirectory(String path) {
        Path parent = Path.of(path).toAbsolutePath().getParent();
        if (parent == null || Files.isDirectory(parent)) {
            return;
        }
        try {
            Files.createDirectories(parent);
        } catch (java.io.IOException e) {
            throw new IllegalStateException("cannot create database directory " + parent, e);
        }
    }

    private Database(String jdbcUrl, boolean rawUrl) {
        this.jdbcUrl = jdbcUrl;
    }

    /**
     * A uniquely named shared in-memory database, for tests that need real SQL behaviour without
     * touching disk. Each name is an independent database, so parallel tests cannot collide.
     */
    public static Database inMemory(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("in-memory database name is required");
        }
        return new Database("jdbc:sqlite:file:" + name + "?mode=memory&cache=shared", true);
    }

    /** The JDBC URL in use, for diagnostics. SQLite has no credentials to leak. */
    public String jdbcUrl() {
        return jdbcUrl;
    }

    /**
     * Opens a connection with the pragmas this application depends on. Callers must close it.
     */
    public Connection openConnection() throws SQLException {
        Connection connection = DriverManager.getConnection(jdbcUrl);
        try (Statement statement = connection.createStatement()) {
            statement.execute("PRAGMA foreign_keys = ON");
            statement.execute("PRAGMA busy_timeout = 5000");
        }
        return connection;
    }

    private void openKeeperIfEphemeral() {
        if (jdbcUrl.contains("mode=memory") && keeper == null) {
            try {
                keeper = DriverManager.getConnection(jdbcUrl);
            } catch (SQLException e) {
                throw new IllegalStateException("cannot open the in-memory database", e);
            }
        }
    }

    /**
     * Creates the schema if it is absent. Idempotent, so it is safe to call on every start. All
     * statements are {@code IF NOT EXISTS} and the applied version is recorded.
     */
    public void migrate() {
        openKeeperIfEphemeral();
        try (Connection connection = openConnection();
             Statement statement = connection.createStatement()) {

            statement.execute("PRAGMA journal_mode = WAL");

            statement.execute("""
                    CREATE TABLE IF NOT EXISTS schema_migrations (
                        version    INTEGER PRIMARY KEY,
                        applied_at TEXT NOT NULL
                    )""");

            statement.execute("""
                    CREATE TABLE IF NOT EXISTS incidents (
                        capsule_id           TEXT PRIMARY KEY,
                        device_id            TEXT NOT NULL,
                        fsm_state            TEXT NOT NULL,
                        trigger_type         TEXT NOT NULL,
                        battery_level        INTEGER NOT NULL,
                        network_quality      TEXT NOT NULL,
                        cannot_speak         INTEGER NOT NULL,
                        threat_nearby        INTEGER NOT NULL,
                        latitude             REAL NOT NULL,
                        longitude            REAL NOT NULL,
                        medical_summary      TEXT,
                        encrypted_evidence   TEXT,
                        matched_responder_id TEXT,
                        created_at           TEXT NOT NULL,
                        updated_at           TEXT NOT NULL
                    )""");

            statement.execute("""
                    CREATE TABLE IF NOT EXISTS audit_events (
                        id         INTEGER PRIMARY KEY AUTOINCREMENT,
                        capsule_id TEXT NOT NULL,
                        event_type TEXT NOT NULL,
                        actor_id   TEXT,
                        detail     TEXT,
                        created_at TEXT NOT NULL,
                        FOREIGN KEY (capsule_id) REFERENCES incidents(capsule_id)
                    )""");

            // Column names follow the weighted-match SQL in SafeSphere.md section 10.
            statement.execute("""
                    CREATE TABLE IF NOT EXISTS verified_volunteers (
                        responder_id   TEXT PRIMARY KEY,
                        display_name   TEXT NOT NULL,
                        latitude       REAL NOT NULL,
                        longitude      REAL NOT NULL,
                        first_aid_cert INTEGER NOT NULL,
                        vehicle_access INTEGER NOT NULL,
                        status         TEXT NOT NULL
                    )""");

            statement.execute("""
                    CREATE TABLE IF NOT EXISTS responder_declines (
                        capsule_id   TEXT NOT NULL,
                        responder_id TEXT NOT NULL,
                        created_at   TEXT NOT NULL,
                        PRIMARY KEY (capsule_id, responder_id),
                        FOREIGN KEY (capsule_id) REFERENCES incidents(capsule_id)
                    )""");

            statement.execute("""
                    CREATE TABLE IF NOT EXISTS dev_profiles (
                        device_id     TEXT PRIMARY KEY,
                        victim_name   TEXT NOT NULL,
                        victim_age    INTEGER NOT NULL,
                        victim_gender TEXT NOT NULL
                    )""");

            statement.execute("""
                    CREATE TABLE IF NOT EXISTS telemetry_fixtures (
                        device_id TEXT PRIMARY KEY,
                        latitude  REAL NOT NULL,
                        longitude REAL NOT NULL
                    )""");

            statement.execute(
                    "CREATE INDEX IF NOT EXISTS idx_incidents_device ON incidents (device_id)");
            statement.execute(
                    "CREATE INDEX IF NOT EXISTS idx_audit_capsule ON audit_events (capsule_id)");

            try (var ps = connection.prepareStatement(
                    "INSERT OR IGNORE INTO schema_migrations (version, applied_at) VALUES (1, ?)")) {
                ps.setString(1, Instant.now().toString());
                ps.executeUpdate();
            }

        } catch (SQLException e) {
            throw new IllegalStateException("schema migration failed", e);
        }
        log.info("SQLite schema ready at {}", jdbcUrl);
    }

    @Override
    public void close() {
        if (keeper != null) {
            try {
                keeper.close();
            } catch (SQLException e) {
                // Nothing useful to do while shutting down.
            } finally {
                keeper = null;
            }
        }
    }

    /** Resolves {@link #DEFAULT_PATH} to an absolute path, creating the parent directory. */
    public static String prepareDefaultFile() {
        Path path = Path.of(DEFAULT_PATH).toAbsolutePath();
        try {
            Path parent = path.getParent();
            if (parent != null) {
                Files.createDirectories(parent);
            }
        } catch (java.io.IOException e) {
            throw new IllegalStateException("cannot create database directory " + path.getParent(), e);
        }
        return path.toString();
    }
}
