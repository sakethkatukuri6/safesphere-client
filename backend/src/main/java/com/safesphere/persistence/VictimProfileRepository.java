package com.safesphere.persistence;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Objects;
import java.util.Optional;

/**
 * Development-only victim identity, keyed by {@code device_id}.
 *
 * <p><strong>Fixture data.</strong> The SOS event in the frozen contract carries no coordinates and
 * no victim identity, yet the Help Nearby view needs both. Rather than widen the contract with
 * fields the Citizen App is not documented to send, the local demo resolves them from this table,
 * which is seeded with obviously fake people. There is no real identity provider, no real
 * personal data, and no production path to this class.
 */
public final class VictimProfileRepository {

    /**
     * A fixture victim identity.
     *
     * @param deviceId    the install the profile belongs to
     * @param victimName  display name, surfaced to matched volunteers only
     * @param victimAge  age in years
     * @param victimGender gender as recorded in the fixture
     */
    public record DevVictimProfile(
            String deviceId,
            String victimName,
            int victimAge,
            String victimGender) {

        public DevVictimProfile {
            Objects.requireNonNull(deviceId, "deviceId is required");
            Objects.requireNonNull(victimName, "victimName is required");
            Objects.requireNonNull(victimGender, "victimGender is required");
            if (victimAge < 0 || victimAge > 130) {
                throw new IllegalArgumentException("victim_age out of range: " + victimAge);
            }
        }
    }

    private final Database database;

    public VictimProfileRepository(Database database) {
        this.database = Objects.requireNonNull(database, "database is required");
    }

    /** Inserts or replaces a fixture profile. */
    public void upsert(DevVictimProfile profile) {
        String sql = """
                INSERT INTO dev_profiles (device_id, victim_name, victim_age, victim_gender)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(device_id) DO UPDATE SET
                    victim_name = excluded.victim_name,
                    victim_age = excluded.victim_age,
                    victim_gender = excluded.victim_gender""";
        try (Connection connection = database.openConnection();
             PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, profile.deviceId());
            ps.setString(2, profile.victimName());
            ps.setInt(3, profile.victimAge());
            ps.setString(4, profile.victimGender());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new IllegalStateException("cannot upsert dev profile " + profile.deviceId(), e);
        }
    }

    /** Looks up a fixture profile by device id. */
    public Optional<DevVictimProfile> findByDeviceId(String deviceId) {
        String sql = """
                SELECT device_id, victim_name, victim_age, victim_gender
                  FROM dev_profiles
                 WHERE device_id = ?""";
        try (Connection connection = database.openConnection();
             PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, deviceId);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) {
                    return Optional.empty();
                }
                return Optional.of(new DevVictimProfile(
                        rs.getString("device_id"),
                        rs.getString("victim_name"),
                        rs.getInt("victim_age"),
                        rs.getString("victim_gender")));
            }
        } catch (SQLException e) {
            throw new IllegalStateException("cannot read dev profile " + deviceId, e);
        }
    }
}
