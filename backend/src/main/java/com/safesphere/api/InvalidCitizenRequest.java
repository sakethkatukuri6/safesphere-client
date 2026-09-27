package com.safesphere.api;

/**
 * Raised when a request body does not match the frozen Citizen contract: an unknown field, a missing
 * field, a bad enum, an out-of-range value, or an unparseable timestamp.
 *
 * <p>Carries a short, non-sensitive reason suitable for returning to the caller. It deliberately does
 * not echo the offending value for secret-bearing fields, of which the Citizen contract has none.
 */
public class InvalidCitizenRequest extends IllegalArgumentException {

    private static final long serialVersionUID = 1L;

    public InvalidCitizenRequest(String message) {
        super(message);
    }
}
