package com.safesphere.fixture;

import java.util.Optional;

/**
 * Resolves the coordinates associated with a device.
 *
 * <p>Exists as an interface so the source of location can change without touching the incident
 * pipeline. The only implementation shipped in this build is a local development fixture; there is
 * no GPS, maps, or telemetry ingestion service behind it, and none is contracted yet.
 */
public interface TelemetryProvider {

    /**
     * A coordinate pair.
     *
     * @param latitude  decimal degrees
     * @param longitude decimal degrees
     */
    record Coordinates(double latitude, double longitude) {
    }

    /**
     * Looks up coordinates for a device.
     *
     * @return the coordinates, or {@link Optional#empty()} when the device is unknown
     */
    Optional<Coordinates> coordinatesFor(String deviceId);
}
