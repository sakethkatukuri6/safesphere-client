package com.safesphere.fixture;

import com.safesphere.persistence.TelemetryFixtureRepository;
import java.util.Objects;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * <strong>LOCAL DEVELOPMENT FIXTURE.</strong> Serves incident coordinates from the
 * {@code telemetry_fixtures} table instead of from a real device feed.
 *
 * <p>This exists because the frozen {@code SosTriggerEvent} carries no coordinates, and the frozen
 * {@code VolunteerIncidentView} requires a {@code location}. Rather than add an undocumented field to
 * either contract, the demo resolves a coordinate from the device id. That is a stand-in, not a
 * feature: production location must arrive through a separately contracted telemetry call, which is
 * explicitly out of scope here.
 *
 * <p>Every value served is fake demo data. This class must not be wired to anything real.
 */
public final class FixtureTelemetryProvider implements TelemetryProvider {

    private static final Logger log = LoggerFactory.getLogger(FixtureTelemetryProvider.class);

    /**
     * Hyderabad, matching the coordinates in the contract examples. Used only when a device has no
     * seeded fixture, so a demo pressing an unknown device id still produces a coherent incident
     * instead of failing.
     */
    private static final Coordinates FALLBACK = new Coordinates(17.3850, 78.4867);

    private final TelemetryFixtureRepository repository;

    public FixtureTelemetryProvider(TelemetryFixtureRepository repository) {
        this.repository = Objects.requireNonNull(repository, "repository is required");
    }

    @Override
    public Optional<Coordinates> coordinatesFor(String deviceId) {
        if (deviceId == null || deviceId.isBlank()) {
            return Optional.empty();
        }
        Optional<TelemetryFixtureRepository.TelemetryFixture> fixture =
                repository.findByDeviceId(deviceId);
        if (fixture.isEmpty()) {
            log.warn("no telemetry fixture for device {}; using the documented example coordinate",
                    deviceId);
            return Optional.of(FALLBACK);
        }
        return Optional.of(new Coordinates(
                fixture.get().latitude(),
                fixture.get().longitude()));
    }
}
