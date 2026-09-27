package com.safesphere.fsm;

import java.util.Collections;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

/**
 * The strict, deterministic emergency state machine from {@code SafeSphere.md} section 8.
 *
 * <p>This class is the single authority for the escalation lifecycle. Illegal transitions are
 * rejected and leave the machine untouched rather than throwing, so a caller can log the refusal
 * and keep serving; the contract requirement is that a jump such as {@code SAFE -> RESPONDER_ASSIGNED}
 * is never silently allowed.
 *
 * <p>The confirmation-bypass path is decided purely by {@link FsmState} plus the device-reported
 * trigger, with no computer-vision dependency anywhere in the MVP.
 *
 * <p>Instances are safe for concurrent use: every state change is atomic and the transition table
 * is immutable. One engine tracks one incident.
 */
public final class EmergencyStateEngine {

    /** How long the silent confirmation window runs, per section 8. */
    public static final int CONFIRMATION_WINDOW_SECONDS = 10;

    private static final Map<FsmState, Set<FsmState>> LEGAL_TRANSITIONS = buildTable();

    private FsmState state;

    /** Creates an engine in the baseline {@link FsmState#SAFE} state. */
    public EmergencyStateEngine() {
        this(FsmState.SAFE);
    }

    /**
     * Creates an engine seeded at {@code initial}. Used to rehydrate a state persisted by an
     * earlier process; seeding into a mid-incident state bypasses no rule, because only
     * {@link #transitionTo(FsmState)} may advance the machine.
     */
    public EmergencyStateEngine(FsmState initial) {
        this.state = Objects.requireNonNull(initial, "initial must not be null");
    }

    private static Map<FsmState, Set<FsmState>> buildTable() {
        Map<FsmState, Set<FsmState>> table = new EnumMap<>(FsmState.class);

        // A sensor anomaly or manual SOS press arms the silent confirmation window.
        table.put(FsmState.SAFE, EnumSet.of(FsmState.SUSPICIOUS));

        // SUSPICIOUS -> CHECKING waits out the window. The direct hop to EMERGENCY is the
        // CRASH_DETECTED bypass: native hardware crash detection skips confirmation entirely.
        table.put(FsmState.SUSPICIOUS, EnumSet.of(FsmState.CHECKING, FsmState.EMERGENCY));

        // Confirmation expired, or a second manual press during CHECKING ("I need help now").
        table.put(FsmState.CHECKING, EnumSet.of(FsmState.EMERGENCY));

        // Level 1 ping on entry; a volunteer accept or a missed window both branch from here.
        table.put(FsmState.EMERGENCY,
                EnumSet.of(FsmState.VOLUNTEER_ASSIGNED, FsmState.ESCALATING, FsmState.RESOLVED));

        table.put(FsmState.VOLUNTEER_ASSIGNED,
                EnumSet.of(FsmState.ESCALATING, FsmState.ON_SCENE, FsmState.RESOLVED));

        // Level 3 ping; M6 matches an official responder.
        table.put(FsmState.ESCALATING,
                EnumSet.of(FsmState.RESPONDER_ASSIGNED, FsmState.RESOLVED));

        table.put(FsmState.RESPONDER_ASSIGNED,
                EnumSet.of(FsmState.ON_SCENE, FsmState.RESOLVED));

        // The correct silence_otp was entered before expiry.
        table.put(FsmState.ON_SCENE, EnumSet.of(FsmState.RESOLVED));

        // Terminal: the incident is closed and the machine admits nothing further.
        table.put(FsmState.RESOLVED, EnumSet.noneOf(FsmState.class));

        Map<FsmState, Set<FsmState>> immutable = new EnumMap<>(FsmState.class);
        table.forEach((from, to) -> immutable.put(from, Collections.unmodifiableSet(to)));
        return Collections.unmodifiableMap(immutable);
    }

    /** The state the machine currently holds. */
    public synchronized FsmState state() {
        return state;
    }

    /** The states reachable in one legal step from the current state, possibly empty. */
    public synchronized Set<FsmState> allowedNextStates() {
        return LEGAL_TRANSITIONS.get(state);
    }

    /**
     * Whether {@code target} is one legal step from the current state. Purely a query: it never
     * mutates the machine and is safe to call on a hot path.
     */
    public synchronized boolean canTransitionTo(FsmState target) {
        return target != null
                && target != state
                && LEGAL_TRANSITIONS.get(state).contains(target);
    }

    /**
     * Attempts to move the machine to {@code target}.
     *
     * <p>On success the state is updated and the returned result reports {@code accepted}. On a
     * legal-but-unexpected request, a terminal state, or a self-transition, the machine is left
     * exactly as it was and the result carries the refusal reason.
     *
     * @return the recorded outcome; never {@code null}
     */
    public synchronized TransitionResult transitionTo(FsmState target) {
        Objects.requireNonNull(target, "target must not be null");

        FsmState from = state;
        if (target == from) {
            return TransitionResult.rejected(from, target,
                    "already in " + from + "; the FSM never self-transitions");
        }
        if (from.isTerminal()) {
            return TransitionResult.rejected(from, target,
                    "RESOLVED is terminal; the incident is closed and cannot be reopened");
        }
        if (!LEGAL_TRANSITIONS.get(from).contains(target)) {
            return TransitionResult.rejected(from, target,
                    "illegal transition " + from + " -> " + target
                            + "; allowed from " + from + ": " + LEGAL_TRANSITIONS.get(from));
        }

        state = target;
        return TransitionResult.accepted(from, target);
    }

    /**
     * Applies the {@code CRASH_DETECTED} confirmation bypass, which is the only path that may skip
     * the 10-second window. Legal from {@link FsmState#SUSPICIOUS} (the device reported the crash
     * alongside the anomaly that raised suspicion) and from {@link FsmState#CHECKING} (the crash
     * landed while the window was still running).
     *
     * <p>From any other state the bypass is refused: crash detection must not be able to reopen a
     * closed incident or re-alert a responder who is already on scene.
     */
    public synchronized TransitionResult applyCrashBypass() {
        FsmState from = state;
        if (from == FsmState.SUSPICIOUS || from == FsmState.CHECKING) {
            state = FsmState.EMERGENCY;
            return TransitionResult.accepted(from, FsmState.EMERGENCY);
        }
        return TransitionResult.rejected(from, FsmState.EMERGENCY,
                "crash bypass is only valid from SUSPICIOUS or CHECKING, not " + from);
    }

    /**
     * Closes the incident and returns the engine to {@link FsmState#SAFE} for the next one. Only a
     * terminal machine can be reset, which keeps a half-finished incident from being discarded by
     * accident.
     */
    public synchronized TransitionResult reset() {
        FsmState from = state;
        if (!from.isTerminal()) {
            return TransitionResult.rejected(from, FsmState.SAFE,
                    "cannot reset from " + from + "; resolve the incident first");
        }
        state = FsmState.SAFE;
        return TransitionResult.accepted(from, FsmState.SAFE);
    }

    @Override
    public synchronized String toString() {
        return "EmergencyStateEngine[state=" + state + ", allowedNext=" + allowedNextStates() + "]";
    }
}
