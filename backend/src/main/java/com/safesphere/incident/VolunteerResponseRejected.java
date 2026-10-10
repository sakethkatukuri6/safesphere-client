package com.safesphere.incident;

/** Thrown when a volunteer response cannot be applied. Carries a machine-mappable reason. */
public class VolunteerResponseRejected extends RuntimeException {

    private static final long serialVersionUID = 1L;

    private final ResponseRejection rejection;

    public VolunteerResponseRejected(ResponseRejection rejection, String message) {
        super(message);
        this.rejection = rejection;
    }

    public ResponseRejection rejection() {
        return rejection;
    }
}
