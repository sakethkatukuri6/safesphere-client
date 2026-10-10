package com.safesphere.persistence;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

/**
 * Storage for matchable volunteers and the per-incident decline list.
 *
 * <p>All statements are parameterized. The dynamic {@code NOT IN} clause builds only a fixed number
 * of {@code ?} placeholders from the size of the exclusion set; no caller-supplied text ever reaches
 * the SQL text.
 */
public final class ResponderRepository {

    private static final String COLUMNS = """
            responder_id, display_name, latitude, longitude, first_aid_cert, vehicle_access, status""";

    private final Database database;

    public ResponderRepository(Database database) {
        this.database = Objects.requireNonNull(database, "database is required");
    }

    /** Inserts or replaces a volunteer. Used to load the local development fixtures. */
    public void upsert(ResponderRecord record) {
        String sql = """
                INSERT INTO verified_volunteers
                    (responder_id, display_name, latitude, longitude, first_aid_cert, vehicle_access, status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(responder_id) DO UPDATE SET
                    display_name = excluded.display_name,
                    latitude = excluded.latitude,
                    longitude = excluded.longitude,
                    first_aid_cert = excluded.first_aid_cert,
                    vehicle_access = excluded.vehicle_access,
                    status = excluded.status""";
        try (Connection connection = database.openConnection();
             PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, record.responderId());
            ps.setString(2, record.displayName());
            ps.setDouble(3, record.latitude());
            ps.setDouble(4, record.longitude());
            ps.setInt(5, record.firstAidCert());
            ps.setInt(6, record.vehicleAccess());
            ps.setString(7, record.status());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new IllegalStateException("cannot upsert volunteer " + record.responderId(), e);
        }
    }

    /** Every online volunteer, excluding the given responder ids. */
    public List<ResponderRecord> findOnlineExcluding(Collection<String> excludedResponderIds) {
        Set<String> excluded = excludedResponderIds == null
                ? Set.of()
                : new HashSet<>(excludedResponderIds);

        StringBuilder sql = new StringBuilder("SELECT ").append(COLUMNS)
                .append(" FROM verified_volunteers WHERE status = ?");
        if (!excluded.isEmpty()) {
            sql.append(" AND responder_id NOT IN (");
            sql.append("?, ".repeat(excluded.size()));
            sql.setLength(sql.length() - 2);
            sql.append(')');
        }

        List<ResponderRecord> results = new ArrayList<>();
        try (Connection connection = database.openConnection();
             PreparedStatement ps = connection.prepareStatement(sql.toString())) {
            int index = 1;
            ps.setString(index++, ResponderRecord.ONLINE);
            for (String id : excluded) {
                ps.setString(index++, id);
            }
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    results.add(map(rs));
                }
            }
            return results;
        } catch (SQLException e) {
            throw new IllegalStateException("cannot read online volunteers", e);
        }
    }

    /** Looks a volunteer up by id, regardless of status. */
    public Optional<ResponderRecord> findById(String responderId) {
        String sql = "SELECT %s FROM verified_volunteers WHERE responder_id = ?".formatted(COLUMNS);
        try (Connection connection = database.openConnection();
             PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, responderId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? Optional.of(map(rs)) : Optional.empty();
            }
        } catch (SQLException e) {
            throw new IllegalStateException("cannot read volunteer " + responderId, e);
        }
    }

    /** Records that a volunteer declined an incident, so a re-match skips them. */
    public void recordDecline(String capsuleId, String responderId, Instant now) {
        String sql = """
                INSERT OR IGNORE INTO responder_declines (capsule_id, responder_id, created_at)
                VALUES (?, ?, ?)""";
        try (Connection connection = database.openConnection();
             PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, capsuleId);
            ps.setString(2, responderId);
            ps.setString(3, now.toString());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new IllegalStateException("cannot record decline for " + capsuleId, e);
        }
    }

    /** The set of volunteers who have already declined this incident. */
    public Set<String> findDeclined(String capsuleId) {
        String sql = "SELECT responder_id FROM responder_declines WHERE capsule_id = ?";
        Set<String> declined = new HashSet<>();
        try (Connection connection = database.openConnection();
             PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, capsuleId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    declined.add(rs.getString("responder_id"));
                }
            }
            return declined;
        } catch (SQLException e) {
            throw new IllegalStateException("cannot read declines for " + capsuleId, e);
        }
    }

    private static ResponderRecord map(ResultSet rs) throws SQLException {
        return new ResponderRecord(
                rs.getString("responder_id"),
                rs.getString("display_name"),
                rs.getDouble("latitude"),
                rs.getDouble("longitude"),
                rs.getInt("first_aid_cert"),
                rs.getInt("vehicle_access"),
                rs.getString("status"));
    }
}
