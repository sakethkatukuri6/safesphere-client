package com.safesphere.persistence;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Objects;
import java.util.Optional;

/**
 * Development-only coordinates, keyed by {@code device_id}.
 *
 * <p><strong>Fixture data.</strong> {@code SosTriggerEvent} in the frozen contract carries no
 * latitude or longitude, so the local demo resolves the incident location from this table instead
 * of adding an undocumented field to the wire contract. Production location arrives from the
 * device's own GPS through a future, separately contracted telemetry call; this class is not that
 * mechanism and must not be mistaken for it.
 */
public final class TelemetryFixtureRepository {

    /**
     * A fixture coordinate pair.
     *
     * @param deviceId  the install this coordinate belongs to
     * @param latitude  decimal degrees, -90..90
     * @param longitude decimal degrees, -180..180
     */
    public record TelemetryFixture(double latitude, double longitude) {

        public TelemetryFixture {
            if (latitude < -90.0 || latitude > 90.0) {
                throw new IllegalArgumentException("latitude out of range: " + latitude);
            }
            if (longitude < -180.0 || longitude > 180.0) {
                throw new IllegalArgumentException("longitude out of range: " + longitude);
            }
        }
    }

    private final Database database;

    public TelemetryFixtureRepository(Database database) {
        this.database = Objects.requireNonNull(database, "database is required");
    }

    /** Inserts or replaces a fixture coordinate. */
    public void upsert(String deviceId, TelemetryFixture fixture) {
        String sql = """
                INSERT INTO telemetry_fixtures (device_id, latitude, longitude)
                VALUES (?, ?, ?)
                ON CONFLICT(device_id) DO UPDATE SET
                    latitude = excluded.latitude,
                    longitude = excluded.longitude""";
        try (Connection connection = database.openConnection();
             PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, deviceId);
            ps.setDouble(2, fixture.latitude());
            ps.setDouble(3, fixture.longitude());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new IllegalStateException("cannot upsert telemetry fixture " + deviceId, e);
        }
    }

    /** Looks up a fixture coordinate by device id. */
    public Optional<TelemetryFixture> findByDeviceId(String deviceId) {
        String sql = "SELECT latitude, longitude FROM telemetry_fixtures WHERE device_id = ?";
        try (Connection connection = database.openConnection();
             PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, deviceId);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) {
                    return Optional.empty();
                }
                return Optional.of(new TelemetryFixture(
                        rs.getDouble("latitude"),
                        rs.getDouble("longitude")));
            }
        } catch (SQLException e) {
            throw new IllegalStateException("cannot read telemetry fixture " + deviceId, e);
        }
    }
}
