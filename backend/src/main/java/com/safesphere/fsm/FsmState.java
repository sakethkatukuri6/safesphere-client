package com.safesphere.fsm;

/**
 * The frozen emergency lifecycle enum. Names and ordering are wire-compatible with
 * {@code CitizenAppContract.md} section 1 and {@code SafeSphere.md} section 8, and are
 * serialized verbatim as {@code fsm_state} on every capsule payload.
 *
 * <p>No client on any platform is trusted to advance this machine; the backend owns it entirely.
 * Legal transitions live in {@link EmergencyStateEngine} so the rules are auditable in one place.
 */
public enum FsmState {

    /** Baseline. App idle. */
    SAFE,

    /** Sensor anomaly (route deviation) or manual SOS press. Starts the 10s silent confirmation. */
    SUSPICIOUS,

    /** Waiting out the silent confirmation window. */
    CHECKING,

    /**
     * Confirmation expired, {@code CRASH_DETECTED} bypassed, or the user pressed again during
     * {@link #CHECKING}. Pings Level 1 and pushes to the nearest verified volunteers.
     */
    EMERGENCY,

    /** A pushed volunteer accepted. Only the section 6.2 payload is shown. */
    VOLUNTEER_ASSIGNED,

    /** No volunteer or contact responded within the window. Pings Level 3. */
    ESCALATING,

    /** M6 matched an official responder. A {@code silence_otp} has been generated. */
    RESPONDER_ASSIGNED,

    /** The responder entered the correct {@code silence_otp} before expiry. */
    ON_SCENE,

    /** The dispatcher closed the incident. Terminal; only the final audit record is written. */
    RESOLVED;

    /**
     * Whether this state admits no further transitions. {@link #RESOLVED} is the only terminal
     * state, so the machine cannot be revived once an incident is closed.
     */
    public boolean isTerminal() {
        return this == RESOLVED;
    }
}
