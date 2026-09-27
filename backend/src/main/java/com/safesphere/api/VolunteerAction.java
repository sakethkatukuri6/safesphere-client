package com.safesphere.api;

/**
 * The three actions the Help Nearby mode may report, as frozen in {@code CitizenAppContract.md}
 * section 5.
 *
 * <p>{@link #ARRIVED} is an audit-only event. It does not silence anything: only the Professional
 * App's Field mode, in a separate repository and contract, can acknowledge a silence alert, and the
 * Citizen App has no visibility into that.
 */
public enum VolunteerAction {

    /** The volunteer takes the incident; the FSM moves to {@code VOLUNTEER_ASSIGNED}. */
    ACCEPT,

    /** The volunteer passes; the backend re-matches to the next-best candidate. */
    DECLINE,

    /** The volunteer reports arrival. Recorded in the audit trail; silences nothing. */
    ARRIVED
}
