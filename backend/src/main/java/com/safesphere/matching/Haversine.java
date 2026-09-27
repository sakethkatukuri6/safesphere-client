package com.safesphere.matching;

import java.util.Objects;

/**
 * Great-circle distance in kilometres.
 *
 * <p>Spherical approximation of the WGS-84 mean radius. Accurate to roughly 0.5% against a full
 * ellipsoidal solution, which is far finer than the local demo needs: the weighted match in
 * {@code SafeSphere.md} section 10 treats distance as a proximity score, not a survey measurement.
 */
public final class Haversine {

    /** Mean Earth radius in kilometres. */
    private static final double EARTH_RADIUS_KM = 6371.0088;

    private Haversine() {
    }

    /**
     * Distance between two coordinates in kilometres.
     *
     * @return the distance, never negative
     * @throws IllegalArgumentException if a coordinate is out of range
     */
    public static double distanceKm(double latitude1, double longitude1,
                                    double latitude2, double longitude2) {
        requireRange(latitude1, -90.0, 90.0, "latitude1");
        requireRange(latitude2, -90.0, 90.0, "latitude2");
        requireRange(longitude1, -180.0, 180.0, "longitude1");
        requireRange(longitude2, -180.0, 180.0, "longitude2");

        double phi1 = Math.toRadians(latitude1);
        double phi2 = Math.toRadians(latitude2);
        double deltaPhi = Math.toRadians(latitude2 - latitude1);
        double deltaLambda = Math.toRadians(longitude2 - longitude1);

        double a = Math.pow(Math.sin(deltaPhi / 2), 2)
                + Math.cos(phi1) * Math.cos(phi2) * Math.pow(Math.sin(deltaLambda / 2), 2);
        // asin form is numerically better behaved than the acos form for small distances.
        return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1.0, Math.sqrt(a)));
    }

    private static void requireRange(double value, double min, double max, String name) {
        Objects.requireNonNull(name, "name is required");
        if (Double.isNaN(value) || value < min || value > max) {
            throw new IllegalArgumentException(name + " out of range: " + value);
        }
    }
}
