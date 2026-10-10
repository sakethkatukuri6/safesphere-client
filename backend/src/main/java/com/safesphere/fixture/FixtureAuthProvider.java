package com.safesphere.fixture;

import com.safesphere.persistence.ResponderRepository;
import java.util.Objects;
import java.util.Optional;

/**
 * <strong>LOCAL DEVELOPMENT FIXTURE.</strong> Treats any id present in {@code verified_volunteers} as
 * a known volunteer.
 *
 * <p>This is deliberately not authentication. The Citizen contract
 * ({@code CitizenAppContract.md} section 5) sends a bare {@code volunteer_id} and defines no
 * credential, so all this can do is confirm the id exists in the fixture table. Real authentication,
 * tokens, and session handling are out of scope for this build and are called out in
 * {@code backend/README.md} as deferred.
 */
public final class FixtureAuthProvider implements AuthProvider {

    private final ResponderRepository responders;

    public FixtureAuthProvider(ResponderRepository responders) {
        this.responders = Objects.requireNonNull(responders, "responders is required");
    }

    @Override
    public boolean isKnownVolunteer(String volunteerId) {
        return volunteerId != null
                && !volunteerId.isBlank()
                && responders.findById(volunteerId).isPresent();
    }

    @Override
    public Optional<String> displayNameOf(String volunteerId) {
        return responders.findById(volunteerId).map(r -> r.displayName());
    }
}
