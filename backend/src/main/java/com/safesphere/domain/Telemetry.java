package com.safesphere.domain;

/**
 * The device-reported state captured with an incident, matching the {@code telemetry} block of the
 * internal capsule in {@code SafeSphere.md} section 6.1.
 *
 * <p>Internal only. The Citizen Help Nearby view exposes just {@code latitude} and {@code longitude}
 * from this record, and even then only via a separately built payload; see
 * {@code VolunteerIncidentView}.
 *
 * @param latitude       device latitude in decimal degrees, -90..90
 * @param longitude      device longitude in decimal degrees, -180..180
 * @param batteryLevel   real device battery percentage, 0..100, as read by the on-device engine
 * @param networkQuality connection quality at the moment the alert was raised
 */
public record Telemetry(
        double latitude,
        double longitude,
        int batteryLevel,
        NetworkQuality networkQuality) {

    public Telemetry {
        if (latitude < -90.0 || latitude > 90.0) {
            throw new IllegalArgumentException("latitude out of range: " + latitude);
        }
        if (longitude < -180.0 || longitude > 180.0) {
            throw new IllegalArgumentException("longitude out of range: " + longitude);
        }
        if (batteryLevel < 0 || batteryLevel > 100) {
            throw new IllegalArgumentException("battery_level out of range: " + batteryLevel);
        }
        if (networkQuality == null) {
            throw new IllegalArgumentException("network_quality is required");
        }
    }
}
