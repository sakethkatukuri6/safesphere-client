package com.safesphere.persistence;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * Append-only audit trail.
 *
 * <p>Audit rows are the record of who did what to an incident, including volunteer actions such as
 * {@code ARRIVED}. They are never mutated or deleted, and they are internal: no audit field is
 * exposed on any Citizen payload.
 */
public final class AuditEventRepository {

    /** Event type recorded when an incident is opened by an SOS trigger. */
    public static final String SOS_TRIGGERED = "SOS_TRIGGERED";
    /** Event type recorded when a volunteer accepts. */
    public static final String VOLUNTEER_ACCEPTED = "VOLUNTEER_ACCEPTED";
    /** Event type recorded when a volunteer declines and a re-match happens. */
    public static final String VOLUNTEER_DECLINED = "VOLUNTEER_DECLINED";
    /** Event type recorded when a volunteer reports arrival. Audit only; silences nothing. */
    public static final String VOLUNTEER_ARRIVED = "VOLUNTEER_ARRIVED";

    private final Database database;

    public AuditEventRepository(Database database) {
        this.database = Objects.requireNonNull(database, "database is required");
    }

    /** Appends one audit event. {@code actorId} is null for system-originated events. */
    public void append(String capsuleId, String eventType, String actorId, String detail, Instant now) {
        String sql = """
                INSERT INTO audit_events (capsule_id, event_type, actor_id, detail, created_at)
                VALUES (?, ?, ?, ?, ?)""";
        try (Connection connection = database.openConnection();
             PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, capsuleId);
            ps.setString(2, eventType);
            SqlSupport.setNullableString(ps, 3, actorId);
            SqlSupport.setNullableString(ps, 4, detail);
            ps.setString(5, now.toString());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new IllegalStateException("cannot append audit event for " + capsuleId, e);
        }
    }

    /** All audit events for an incident, oldest first. */
    public List<AuditEvent> findByCapsuleId(String capsuleId) {
        String sql = """
                SELECT id, capsule_id, event_type, actor_id, detail, created_at
                  FROM audit_events
                 WHERE capsule_id = ?
                 ORDER BY id ASC""";
        List<AuditEvent> results = new ArrayList<>();
        try (Connection connection = database.openConnection();
             PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, capsuleId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    results.add(new AuditEvent(
                            rs.getLong("id"),
                            rs.getString("capsule_id"),
                            rs.getString("event_type"),
                            SqlSupport.nullableString(rs, "actor_id"),
                            SqlSupport.nullableString(rs, "detail"),
                            Instant.parse(rs.getString("created_at"))));
                }
            }
            return results;
        } catch (SQLException e) {
            throw new IllegalStateException("cannot read audit events for " + capsuleId, e);
        }
    }

    /**
     * One immutable audit row.
     *
     * @param id        monotonic row id
     * @param capsuleId incident this belongs to
     * @param eventType one of the {@code *_TRIGGERED}/{@code VOLUNTEER_*} constants
     * @param actorId   the volunteer, or null when the backend acted on its own
     * @param detail    short non-sensitive description
     * @param createdAt when the event was recorded
     */
    public record AuditEvent(
            long id,
            String capsuleId,
            String eventType,
            String actorId,
            String detail,
            Instant createdAt) {
    }
}
