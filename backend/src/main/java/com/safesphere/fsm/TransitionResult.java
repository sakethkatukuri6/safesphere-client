package com.safesphere.fsm;

import java.util.Objects;

/**
 * The outcome of one FSM transition attempt. Returned rather than thrown so that a rejected
 * transition is an ordinary, inspectable value: every safety decision in this module is made from
 * typed inputs and recorded, never inferred.
 *
 * <p>On a rejection {@link #to()} is the state that was <em>not</em> entered, which may equal
 * {@link #from()} when the attempt itself was meaningless, such as a self-transition or a reset
 * from {@code SAFE}. That is exactly what makes the refusal auditable, so
 * {@code from == to} is permitted there but never on an accepted result.
 *
 * @param from     the state the machine held when the attempt was made
 * @param to       the state that was entered, or would have been entered if rejected
 * @param accepted whether the transition was legal and was applied
 * @param reason   a short, human-auditable explanation; always populated for a rejection
 */
public record TransitionResult(FsmState from, FsmState to, boolean accepted, String reason) {

    public TransitionResult {
        Objects.requireNonNull(from, "from must not be null");
        Objects.requireNonNull(to, "to must not be null");
        Objects.requireNonNull(reason, "reason must not be null");
        if (accepted && from == to) {
            throw new IllegalArgumentException("an accepted transition must change state: " + from);
        }
        if (!accepted && reason.isBlank()) {
            throw new IllegalArgumentException("a rejected transition must carry a reason");
        }
    }

    /** A legal transition that was applied. */
    public static TransitionResult accepted(FsmState from, FsmState to) {
        return new TransitionResult(from, to, true, "legal transition");
    }

    /** An illegal transition; the machine is unchanged. */
    public static TransitionResult rejected(FsmState from, FsmState to, String reason) {
        return new TransitionResult(from, to, false, reason);
    }

    /** Whether the machine actually moved. */
    public boolean isMoved() {
        return accepted;
    }
}
