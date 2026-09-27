package com.safesphere.fixture;

import com.safesphere.persistence.ResponderRecord;
import com.safesphere.persistence.ResponderRepository;
import com.safesphere.persistence.TelemetryFixtureRepository;
import com.safesphere.persistence.VictimProfileRepository;
import java.util.List;
import java.util.Objects;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * <strong>LOCAL DEVELOPMENT FIXTURE DATA.</strong> Seeds the SQLite tables with obviously fake
 * volunteers, victim profiles, and coordinates so the Citizen-only demo runs end to end with no
 * external service and no real personal data.
 *
 * <p>Every person here is invented. The victim profiles exist only because the frozen
 * {@code VolunteerIncidentView} requires a name, age, and gender while the frozen
 * {@code SosTriggerEvent} supplies none; they are keyed by {@code device_id} and never derived from a
 * real person. Nothing in this class is provisioned, verified, or moderated in any way.
 */
public final class DevelopmentFixtures {

    private static final Logger log = LoggerFactory.getLogger(DevelopmentFixtures.class);

    /** Volunteers are spread around the contract's example coordinate so ranking is observable. */
    private static final List<ResponderRecord> VOLUNTEERS = List.of(
            new ResponderRecord("VOL-142", "Fixture Volunteer Alpha",
                    17.3900, 78.4900, 1, 1, ResponderRecord.ONLINE),
            new ResponderRecord("VOL-143", "Fixture Volunteer Bravo",
                    17.4500, 78.5500, 1, 0, ResponderRecord.ONLINE),
            new ResponderRecord("VOL-144", "Fixture Volunteer Charlie",
                    17.6000, 78.7000, 0, 1, ResponderRecord.ONLINE),
            // Same point as the incident, which exercises the zero-distance guard in the matcher.
            new ResponderRecord("VOL-145", "Fixture Volunteer Delta",
                    17.3850, 78.4867, 0, 0, ResponderRecord.ONLINE),
            // Present but not matchable, to prove the ONLINE filter is applied.
            new ResponderRecord("VOL-146", "Fixture Volunteer Echo (offline)",
                    17.3851, 78.4868, 1, 1, ResponderRecord.OFFLINE));

    private static final List<VictimProfileRepository.DevVictimProfile> PROFILES = List.of(
            new VictimProfileRepository.DevVictimProfile("DEV-4471", "Jane Doe", 24, "Female"),
            new VictimProfileRepository.DevVictimProfile("DEV-4472", "Fixture Person Two", 41, "Male"),
            new VictimProfileRepository.DevVictimProfile("DEV-4473", "Fixture Person Three", 67, "Female"));

    private static final List<TelemetryFixtureEntry> COORDINATES = List.of(
            new TelemetryFixtureEntry("DEV-4471", 17.3850, 78.4867),
            new TelemetryFixtureEntry("DEV-4472", 17.3920, 78.5010),
            new TelemetryFixtureEntry("DEV-4473", 17.4100, 78.5200));

    /**
     * A fixture coordinate seed entry.
     *
     * @param deviceId  the install it belongs to
     * @param latitude  decimal degrees
     * @param longitude decimal degrees
     */
    public record TelemetryFixtureEntry(String deviceId, double latitude, double longitude) {
    }

    private DevelopmentFixtures() {
    }

    /**
     * Writes the fixture rows. Idempotent: every insert is an upsert, so running twice is harmless.
     */
    public static void seed(ResponderRepository responders,
                            VictimProfileRepository profiles,
                            TelemetryFixtureRepository telemetry) {
        Objects.requireNonNull(responders, "responders is required");
        Objects.requireNonNull(profiles, "profiles is required");
        Objects.requireNonNull(telemetry, "telemetry is required");

        for (ResponderRecord volunteer : VOLUNTEERS) {
            responders.upsert(volunteer);
        }
        for (VictimProfileRepository.DevVictimProfile profile : PROFILES) {
            profiles.upsert(profile);
        }
        for (TelemetryFixtureEntry entry : COORDINATES) {
            telemetry.upsert(entry.deviceId(),
                    new TelemetryFixtureRepository.TelemetryFixture(entry.latitude(), entry.longitude()));
        }
        log.info("seeded {} fixture volunteers, {} dev profiles, {} coordinate fixtures",
                VOLUNTEERS.size(), PROFILES.size(), COORDINATES.size());
    }

    /** The fixture volunteer ids, for the backend README demo commands. */
    public static List<String> volunteerIds() {
        return VOLUNTEERS.stream().map(ResponderRecord::responderId).toList();
    }

    /** The fixture device ids, for the backend README demo commands. */
    public static List<String> deviceIds() {
        return PROFILES.stream().map(VictimProfileRepository.DevVictimProfile::deviceId).toList();
    }
}
