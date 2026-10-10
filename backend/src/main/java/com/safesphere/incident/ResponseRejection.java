package com.safesphere.incident;

/**
 * Why a volunteer response could not be applied. The HTTP layer maps these to status codes; none of
 * them are wire message types, and none adds a field to the Citizen contract.
 */
public enum ResponseRejection {

    /** No incident exists with the supplied {@code capsule_id}. */
    UNKNOWN_INCIDENT,

    /** The {@code volunteer_id} is not one the backend knows. */
    UNKNOWN_VOLUNTEER,

    /**
     * The volunteer is not the one currently assigned to this incident. The contract is silent on
     * this, so the backend refuses rather than letting a stranger accept or mark arrival.
     */
    NOT_ASSIGNED,

    /** The incident's FSM refused the transition, for example an accept after it was resolved. */
    INVALID_STATE
}
