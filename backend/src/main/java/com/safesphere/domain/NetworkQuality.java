package com.safesphere.domain;

/**
 * How good the device's network connection was when the alert was raised.
 *
 * <p>Frozen by {@code CitizenAppContract.md} section 3. The device reports this from its real
 * connectivity manager; the backend only records it on the capsule. Deciding what to throttle is
 * an on-device concern ({@code SafeSphere.md} section 9), never a backend one.
 */
public enum NetworkQuality {

    STRONG,
    WEAK,

    /** The device believes it has no usable connection. The alert is still accepted and persisted. */
    OFFLINE
}
