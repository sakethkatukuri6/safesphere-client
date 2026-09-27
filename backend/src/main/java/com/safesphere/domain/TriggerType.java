package com.safesphere.domain;

/**
 * Why the Citizen App raised an alert, as reported honestly by the device.
 *
 * <p>Frozen by {@code CitizenAppContract.md} section 3. The app never decides what these mean
 * beyond reporting them; the backend FSM owns every consequence, in particular the
 * {@code CRASH_DETECTED} confirmation bypass.
 */
public enum TriggerType {

    /** The user pressed SOS. */
    MANUAL_SOS,

    /**
     * The device's own motion sensors (accelerometer/gyroscope) detected a likely crash. Per
     * {@code SafeSphere.md} section 11 this is a native sensor read, and it is the only path that
     * bypasses the silent confirmation window. There is no computer-vision dependency in the MVP.
     */
    CRASH_DETECTED,

    /** The device noticed a route deviation. */
    ROUTE_DEVIATION
}
