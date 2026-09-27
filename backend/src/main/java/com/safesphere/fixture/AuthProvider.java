package com.safesphere.fixture;

import java.util.Optional;

/**
 * Decides whether a volunteer id is allowed to act on an incident.
 *
 * <p>An interface so the identity decision has one home. The only implementation in this build is a
 * local development fixture that checks a table row; there is no login, no token, no credential
 * verification, and no real authentication of any kind. Production identity is explicitly out of
 * scope.
 */
public interface AuthProvider {

    /**
     * Whether this id belongs to a known verified volunteer.
     *
     * <p>Note what this is not: it is not proof of identity. The Citizen contract sends a bare
     * {@code volunteer_id} with no credential, so this check can only confirm the id is one the
     * backend knows, nothing more.
     */
    boolean isKnownVolunteer(String volunteerId);

    /**
     * Resolves a volunteer id to its display label.
     *
     * @return the label, or empty when the id is unknown
     */
    Optional<String> displayNameOf(String volunteerId);
}
