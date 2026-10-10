package com.safesphere.incident;

/** What the backend did with a {@code POST /api/v1/volunteer/response}. Internal, never serialized. */
public enum VolunteerOutcome {

    /** The volunteer took the incident; the FSM is now {@code VOLUNTEER_ASSIGNED}. */
    ACCEPTED,

    /** A decline forced a re-match and a different volunteer was notified. */
    DECLINED_REMATCHED,

    /** A decline was recorded but nobody else was available; the incident stays open. */
    DECLINED_NO_CANDIDATE,

    /**
     * Arrival was written to the audit trail only. The victim's alert is untouched, because silencing
     * it is a Professional App Field mode action this backend has no citizen-facing route for.
     */
    ARRIVED_LOGGED
}
