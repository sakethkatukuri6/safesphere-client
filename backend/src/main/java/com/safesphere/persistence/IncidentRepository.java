package com.safesphere.persistence;

import com.safesphere.domain.NetworkQuality;
import com.safesphere.domain.TriggerType;
import com.safesphere.fsm.FsmState;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

/**
 * Durable storage for incidents.
 *
 * <p>Every statement is parameterized; no value is ever concatenated into SQL. Reads and writes each
 * open their own connection, so the repository is safe to use from the request threads and the
 * WebSocket push path concurrently.
 */
public final class IncidentRepository {

    private static final String COLUMNS = """
            capsule_id, device_id, fsm_state, trigger_type, battery_level, network_quality,
            cannot_speak, threat_nearby, latitude, longitude, medical_summary, encrypted_evidence,
            matched_responder_id, created_at, updated_at""";

    private final Database database;

    public IncidentRepository(Database database) {
        this.database = Objects.requireNonNull(database, "database is required");
    }

    /** Inserts a new incident. Fails if the capsule id already exists. */
    public void insert(IncidentRecord record) {
        String sql = """
                INSERT INTO incidents (%s)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""".formatted(COLUMNS);
        try (Connection connection = database.openConnection();
             PreparedStatement ps = connection.prepareStatement(sql)) {
            bind(ps, record);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new IllegalStateException("cannot insert incident " + record.capsuleId(), e);
        }
    }

    /** Reads one incident by capsule id. */
    public Optional<IncidentRecord> findByCapsuleId(String capsuleId) {
        String sql = "SELECT %s FROM incidents WHERE capsule_id = ?".formatted(COLUMNS);
        try (Connection connection = database.openConnection();
             PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, capsuleId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? Optional.of(map(rs)) : Optional.empty();
            }
        } catch (SQLException e) {
            throw new IllegalStateException("cannot read incident " + capsuleId, e);
        }
    }

    /** Reads every incident for a device, newest first. Used by the local demo helpers. */
    public List<IncidentRecord> findByDeviceId(String deviceId) {
        String sql = "SELECT %s FROM incidents WHERE device_id = ? ORDER BY created_at DESC"
                .formatted(COLUMNS);
        List<IncidentRecord> results = new ArrayList<>();
        try (Connection connection = database.openConnection();
             PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, deviceId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    results.add(map(rs));
                }
            }
            return results;
        } catch (SQLException e) {
            throw new IllegalStateException("cannot read incidents for " + deviceId, e);
        }
    }

    /** Overwrites the mutable columns of an existing incident. */
    public void update(IncidentRecord record) {
        String sql = """
                UPDATE incidents
                   SET fsm_state = ?, medical_summary = ?, encrypted_evidence = ?,
                       matched_responder_id = ?, updated_at = ?
                 WHERE capsule_id = ?""";
        try (Connection connection = database.openConnection();
             PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, record.fsmState().name());
            SqlSupport.setNullableString(ps, 2, record.medicalSummary());
            SqlSupport.setNullableString(ps, 3, record.encryptedEvidence());
            SqlSupport.setNullableString(ps, 4, record.matchedResponderId());
            ps.setString(5, record.updatedAt().toString());
            ps.setString(6, record.capsuleId());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new IllegalStateException("cannot update incident " + record.capsuleId(), e);
        }
    }

    /** Assigns a responder and state in one statement, so the pair can never be written apart. */
    public void assign(String capsuleId, String responderId, FsmState state, Instant now) {
        String sql = """
                UPDATE incidents
                   SET matched_responder_id = ?, fsm_state = ?, updated_at = ?
                 WHERE capsule_id = ?""";
        try (Connection connection = database.openConnection();
             PreparedStatement ps = connection.prepareStatement(sql)) {
            SqlSupport.setNullableString(ps, 1, responderId);
            ps.setString(2, state.name());
            ps.setString(3, now.toString());
            ps.setString(4, capsuleId);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new IllegalStateException("cannot assign incident " + capsuleId, e);
        }
    }

    /** Clears the assigned responder, used when a decline forces a re-match. */
    public void clearAssignment(String capsuleId, Instant now) {
        assign(capsuleId, null, FsmState.EMERGENCY, now);
    }

    private static void bind(PreparedStatement ps, IncidentRecord record) throws SQLException {
        ps.setString(1, record.capsuleId());
        ps.setString(2, record.deviceId());
        ps.setString(3, record.fsmState().name());
        ps.setString(4, record.triggerType().name());
        ps.setInt(5, record.batteryLevel());
        ps.setString(6, record.networkQuality().name());
        ps.setInt(7, record.cannotSpeak() ? 1 : 0);
        ps.setInt(8, record.threatNearby() ? 1 : 0);
        ps.setDouble(9, record.latitude());
        ps.setDouble(10, record.longitude());
        SqlSupport.setNullableString(ps, 11, record.medicalSummary());
        SqlSupport.setNullableString(ps, 12, record.encryptedEvidence());
        SqlSupport.setNullableString(ps, 13, record.matchedResponderId());
        ps.setString(14, record.createdAt().toString());
        ps.setString(15, record.updatedAt().toString());
    }

    private static IncidentRecord map(ResultSet rs) throws SQLException {
        return new IncidentRecord(
                rs.getString("capsule_id"),
                rs.getString("device_id"),
                FsmState.valueOf(rs.getString("fsm_state")),
                TriggerType.valueOf(rs.getString("trigger_type")),
                rs.getInt("battery_level"),
                NetworkQuality.valueOf(rs.getString("network_quality")),
                rs.getInt("cannot_speak") != 0,
                rs.getInt("threat_nearby") != 0,
                rs.getDouble("latitude"),
                rs.getDouble("longitude"),
                SqlSupport.nullableString(rs, "medical_summary"),
                SqlSupport.nullableString(rs, "encrypted_evidence"),
                SqlSupport.nullableString(rs, "matched_responder_id"),
                Instant.parse(rs.getString("created_at")),
                Instant.parse(rs.getString("updated_at")));
    }
}
