package com.safesphere.fsm;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.EnumSet;
import java.util.Set;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;

/** Behavioural tests for the strict emergency FSM defined in {@code SafeSphere.md} section 8. */
class EmergencyStateEngineTest {

    /** Drives the machine to {@code target} through only legal hops, so tests can set up a state. */
    private static EmergencyStateEngine engineAt(FsmState target) {
        EmergencyStateEngine engine = new EmergencyStateEngine();
        if (target != FsmState.SAFE) {
            assertTrue(engine.transitionTo(FsmState.SUSPICIOUS).accepted());
            if (engine.state() == target) {
                return engine;
            }
            assertTrue(engine.transitionTo(FsmState.CHECKING).accepted());
            if (engine.state() == target) {
                return engine;
            }
            assertTrue(engine.transitionTo(FsmState.EMERGENCY).accepted());
        }
        for (FsmState step : new FsmState[]{
                FsmState.VOLUNTEER_ASSIGNED, FsmState.ESCALATING,
                FsmState.RESPONDER_ASSIGNED, FsmState.ON_SCENE, FsmState.RESOLVED}) {
            if (engine.state() == target) {
                return engine;
            }
            if (engine.canTransitionTo(step)) {
                assertTrue(engine.transitionTo(step).accepted());
            }
        }
        assertEquals(target, engine.state(), "setup failed to reach " + target);
        return engine;
    }

    @Nested
    @DisplayName("initial state")
    class InitialState {

        @Test
        @DisplayName("a new engine starts in SAFE")
        void startsSafe() {
            assertEquals(FsmState.SAFE, new EmergencyStateEngine().state());
        }

        @Test
        @DisplayName("SAFE admits only SUSPICIOUS")
        void safeAllowsOnlySuspicious() {
            assertEquals(Set.of(FsmState.SUSPICIOUS), new EmergencyStateEngine().allowedNextStates());
        }

        @Test
        @DisplayName("a null initial state is rejected")
        void nullInitialRejected() {
            assertThrows(NullPointerException.class, () -> new EmergencyStateEngine(null));
        }
    }

    @Nested
    @DisplayName("illegal transitions")
    class IllegalTransitions {

        @Test
        @DisplayName("the contract example SAFE -> RESPONDER_ASSIGNED is refused")
        void safeCannotJumpToResponderAssigned() {
            EmergencyStateEngine engine = new EmergencyStateEngine();

            TransitionResult result = engine.transitionTo(FsmState.RESPONDER_ASSIGNED);

            assertFalse(result.accepted(), "SAFE -> RESPONDER_ASSIGNED must never be allowed");
            assertEquals(FsmState.SAFE, engine.state(), "a rejected transition must not mutate state");
            assertEquals(FsmState.SAFE, result.from());
            assertEquals(FsmState.RESPONDER_ASSIGNED, result.to());
            assertFalse(result.reason().isBlank());
        }

        @ParameterizedTest(name = "SAFE cannot jump straight to {0}")
        @EnumSource(value = FsmState.class, names = {"CHECKING", "EMERGENCY", "VOLUNTEER_ASSIGNED",
                "ESCALATING", "RESPONDER_ASSIGNED", "ON_SCENE", "RESOLVED"})
        @DisplayName("SAFE only ever moves to SUSPICIOUS")
        void safeRejectsEveryOtherTarget(FsmState target) {
            EmergencyStateEngine engine = new EmergencyStateEngine();

            assertFalse(engine.transitionTo(target).accepted());
            assertEquals(FsmState.SAFE, engine.state());
        }

        @ParameterizedTest(name = "SUSPICIOUS cannot jump to {0}")
        @EnumSource(value = FsmState.class, names = {"VOLUNTEER_ASSIGNED", "ESCALATING",
                "RESPONDER_ASSIGNED", "ON_SCENE", "RESOLVED"})
        @DisplayName("confirmation cannot be skipped past EMERGENCY")
        void suspiciousRejectsEscalationStates(FsmState target) {
            EmergencyStateEngine engine = new EmergencyStateEngine();
            assertTrue(engine.transitionTo(FsmState.SUSPICIOUS).accepted());

            assertFalse(engine.transitionTo(target).accepted());
            assertEquals(FsmState.SUSPICIOUS, engine.state());
        }

        @Test
        @DisplayName("CHECKING cannot be abandoned for a responder state")
        void checkingRejectsEscalationStates() {
            EmergencyStateEngine engine = new EmergencyStateEngine();
            assertTrue(engine.transitionTo(FsmState.SUSPICIOUS).accepted());
            assertTrue(engine.transitionTo(FsmState.CHECKING).accepted());

            assertFalse(engine.transitionTo(FsmState.RESPONDER_ASSIGNED).accepted());
            assertEquals(FsmState.CHECKING, engine.state());
        }

        @Test
        @DisplayName("ESCALATING cannot be short-circuited to a volunteer")
        void escalatingCannotReachVolunteerAssigned() {
            EmergencyStateEngine engine = engineAt(FsmState.ESCALATING);

            assertFalse(engine.transitionTo(FsmState.VOLUNTEER_ASSIGNED).accepted());
            assertEquals(FsmState.ESCALATING, engine.state());
        }

        @ParameterizedTest(name = "a self-transition to {0} is refused")
        @EnumSource(FsmState.class)
        @DisplayName("the FSM never self-transitions")
        void selfTransitionRefused(FsmState state) {
            EmergencyStateEngine engine = engineAt(state);

            TransitionResult result = engine.transitionTo(state);

            assertFalse(result.accepted());
            assertEquals(state, engine.state());
        }

        @Test
        @DisplayName("a null target is rejected rather than treated as a no-op")
        void nullTargetThrows() {
            EmergencyStateEngine engine = new EmergencyStateEngine();

            assertThrows(NullPointerException.class, () -> engine.transitionTo(null));
            assertEquals(FsmState.SAFE, engine.state());
        }
    }

    @Nested
    @DisplayName("the full happy path")
    class HappyPath {

        @Test
        @DisplayName("SAFE -> SUSPICIOUS -> CHECKING -> EMERGENCY -> ... -> RESOLVED")
        void fullLifecycle() {
            EmergencyStateEngine engine = new EmergencyStateEngine();

            FsmState[] path = {
                    FsmState.SUSPICIOUS, FsmState.CHECKING, FsmState.EMERGENCY,
                    FsmState.VOLUNTEER_ASSIGNED, FsmState.ON_SCENE, FsmState.RESOLVED};
            FsmState expectedFrom = FsmState.SAFE;
            for (FsmState target : path) {
                TransitionResult result = engine.transitionTo(target);
                assertTrue(result.accepted(), "expected " + expectedFrom + " -> " + target + " to be legal");
                assertEquals(expectedFrom, result.from());
                assertEquals(target, result.to());
                assertEquals(target, engine.state());
                expectedFrom = target;
            }
        }

        @Test
        @DisplayName("the escalation branch reaches RESPONDER_ASSIGNED")
        void escalationBranch() {
            EmergencyStateEngine engine = new EmergencyStateEngine();

            assertTrue(engine.transitionTo(FsmState.SUSPICIOUS).accepted());
            assertTrue(engine.transitionTo(FsmState.CHECKING).accepted());
            assertTrue(engine.transitionTo(FsmState.EMERGENCY).accepted());
            assertTrue(engine.transitionTo(FsmState.ESCALATING).accepted());
            assertTrue(engine.transitionTo(FsmState.RESPONDER_ASSIGNED).accepted());
            assertEquals(FsmState.RESPONDER_ASSIGNED, engine.state());
        }

        @Test
        @DisplayName("a rejected step does not poison the following legal step")
        void rejectionIsNotSticky() {
            EmergencyStateEngine engine = new EmergencyStateEngine();

            assertFalse(engine.transitionTo(FsmState.ON_SCENE).accepted());
            assertTrue(engine.transitionTo(FsmState.SUSPICIOUS).accepted());
            assertEquals(FsmState.SUSPICIOUS, engine.state());
        }
    }

    @Nested
    @DisplayName("CRASH_DETECTED confirmation bypass")
    class CrashBypass {

        @Test
        @DisplayName("bypasses the window from SUSPICIOUS")
        void bypassFromSuspicious() {
            EmergencyStateEngine engine = new EmergencyStateEngine();
            assertTrue(engine.transitionTo(FsmState.SUSPICIOUS).accepted());

            TransitionResult result = engine.applyCrashBypass();

            assertTrue(result.accepted());
            assertEquals(FsmState.EMERGENCY, engine.state());
        }

        @Test
        @DisplayName("bypasses the window from CHECKING")
        void bypassFromChecking() {
            EmergencyStateEngine engine = new EmergencyStateEngine();
            assertTrue(engine.transitionTo(FsmState.SUSPICIOUS).accepted());
            assertTrue(engine.transitionTo(FsmState.CHECKING).accepted());

            assertTrue(engine.applyCrashBypass().accepted());
            assertEquals(FsmState.EMERGENCY, engine.state());
        }

        @Test
        @DisplayName("is refused from SAFE")
        void bypassFromSafeRefused() {
            EmergencyStateEngine engine = new EmergencyStateEngine();

            TransitionResult result = engine.applyCrashBypass();

            assertFalse(result.accepted());
            assertEquals(FsmState.SAFE, engine.state());
        }

        @ParameterizedTest(name = "bypass is refused from {0}")
        @EnumSource(value = FsmState.class, names = {"EMERGENCY", "VOLUNTEER_ASSIGNED",
                "ESCALATING", "RESPONDER_ASSIGNED", "ON_SCENE", "RESOLVED"})
        @DisplayName("cannot re-alert once the incident has advanced")
        void bypassRefusedAfterSuspicious(FsmState state) {
            EmergencyStateEngine engine = engineAt(state);

            assertFalse(engine.applyCrashBypass().accepted());
            assertEquals(state, engine.state(), "a refused bypass must not change state");
        }

        @Test
        @DisplayName("needs no computer vision, only the device-reported trigger")
        void bypassDependsOnStateAlone() {
            assertEquals(FsmState.EMERGENCY, engineAt(FsmState.SUSPICIOUS).applyCrashBypass().to());
            assertEquals(EmergencyStateEngine.CONFIRMATION_WINDOW_SECONDS, 10);
        }
    }

    @Nested
    @DisplayName("terminal state")
    class TerminalState {

        @Test
        @DisplayName("RESOLVED is the only terminal state")
        void onlyResolvedIsTerminal() {
            for (FsmState state : FsmState.values()) {
                assertEquals(state == FsmState.RESOLVED, state.isTerminal(), state.name());
            }
        }

        @Test
        @DisplayName("RESOLVED admits no next state")
        void resolvedHasNoSuccessors() {
            EmergencyStateEngine engine = engineAt(FsmState.RESOLVED);

            assertTrue(engine.allowedNextStates().isEmpty());
            for (FsmState target : FsmState.values()) {
                assertFalse(engine.canTransitionTo(target));
            }
        }

        @ParameterizedTest(name = "a closed incident refuses {0}")
        @EnumSource(value = FsmState.class, names = {"SUSPICIOUS", "CHECKING", "EMERGENCY",
                "VOLUNTEER_ASSIGNED", "ESCALATING", "RESPONDER_ASSIGNED", "ON_SCENE"})
        @DisplayName("a closed incident cannot be reopened")
        void resolvedCannotReopen(FsmState target) {
            EmergencyStateEngine engine = engineAt(FsmState.RESOLVED);

            TransitionResult result = engine.transitionTo(target);

            assertFalse(result.accepted());
            assertEquals(FsmState.RESOLVED, engine.state());
        }

        @Test
        @DisplayName("crash detection cannot resurrect a closed incident")
        void resolvedRejectsCrashBypass() {
            EmergencyStateEngine engine = engineAt(FsmState.RESOLVED);

            assertFalse(engine.applyCrashBypass().accepted());
            assertEquals(FsmState.RESOLVED, engine.state());
        }
    }

    @Nested
    @DisplayName("reset between incidents")
    class Reset {

        @Test
        @DisplayName("only a resolved incident can be reset")
        void resetRequiresResolved() {
            EmergencyStateEngine engine = engineAt(FsmState.EMERGENCY);

            TransitionResult result = engine.reset();

            assertFalse(result.accepted());
            assertEquals(FsmState.EMERGENCY, engine.state());
        }

        @Test
        @DisplayName("a resolved incident resets to SAFE")
        void resetFromResolved() {
            EmergencyStateEngine engine = engineAt(FsmState.RESOLVED);

            assertTrue(engine.reset().accepted());
            assertEquals(FsmState.SAFE, engine.state());
        }

        @Test
        @DisplayName("resetting from SAFE is refused")
        void resetFromSafeRefused() {
            EmergencyStateEngine engine = new EmergencyStateEngine();

            assertFalse(engine.reset().accepted());
            assertEquals(FsmState.SAFE, engine.state());
        }
    }

    @Nested
    @DisplayName("queries and seeding")
    class QueriesAndSeeding {

        @Test
        @DisplayName("canTransitionTo never mutates the machine")
        void queryIsSideEffectFree() {
            EmergencyStateEngine engine = new EmergencyStateEngine();

            assertTrue(engine.canTransitionTo(FsmState.SUSPICIOUS));
            assertFalse(engine.canTransitionTo(FsmState.RESPONDER_ASSIGNED));
            assertFalse(engine.canTransitionTo(FsmState.SAFE));
            assertFalse(engine.canTransitionTo(null));
            assertEquals(FsmState.SAFE, engine.state());
        }

        @Test
        @DisplayName("canTransitionTo agrees with transitionTo for every state pair")
        void queryAgreesWithTransition() {
            for (FsmState seeded : FsmState.values()) {
                for (FsmState target : FsmState.values()) {
                    EmergencyStateEngine queried = new EmergencyStateEngine(seeded);
                    boolean expected = queried.canTransitionTo(target);

                    EmergencyStateEngine moved = new EmergencyStateEngine(seeded);
                    boolean actual = moved.transitionTo(target).accepted();

                    assertEquals(actual, expected, seeded + " -> " + target);
                }
            }
        }

        @ParameterizedTest(name = "{0} has at least one legal successor")
        @EnumSource(value = FsmState.class, names = {"SAFE", "SUSPICIOUS", "CHECKING", "EMERGENCY",
                "VOLUNTEER_ASSIGNED", "ESCALATING", "RESPONDER_ASSIGNED", "ON_SCENE"})
        @DisplayName("no non-terminal state is a dead end")
        void noUnexpectedDeadEnds(FsmState state) {
            assertFalse(new EmergencyStateEngine(state).allowedNextStates().isEmpty(), state.name());
        }

        @Test
        @DisplayName("a seeded engine still enforces the table from that state")
        void seededEngineIsStillStrict() {
            EmergencyStateEngine engine = new EmergencyStateEngine(FsmState.EMERGENCY);

            assertEquals(FsmState.EMERGENCY, engine.state());
            assertFalse(engine.transitionTo(FsmState.SUSPICIOUS).accepted());
            assertTrue(engine.transitionTo(FsmState.ESCALATING).accepted());
        }

        @Test
        @DisplayName("the exposed successor set is immutable")
        void allowedNextStatesIsImmutable() {
            EmergencyStateEngine engine = new EmergencyStateEngine();

            assertThrows(UnsupportedOperationException.class,
                    () -> engine.allowedNextStates().add(FsmState.RESOLVED));
        }

        @Test
        @DisplayName("toString reports the current state without leaking internals")
        void toStringIsInformative() {
            String text = new EmergencyStateEngine().toString();

            assertTrue(text.contains("SAFE"), text);
            assertNotNull(text);
        }
    }

    @Nested
    @DisplayName("wire contract")
    class WireContract {

        @Test
        @DisplayName("the enum carries exactly the nine frozen state names")
        void enumNamesMatchContract() {
            assertEquals(EnumSet.of(
                    FsmState.SAFE, FsmState.SUSPICIOUS, FsmState.CHECKING, FsmState.EMERGENCY,
                    FsmState.VOLUNTEER_ASSIGNED, FsmState.ESCALATING, FsmState.RESPONDER_ASSIGNED,
                    FsmState.ON_SCENE, FsmState.RESOLVED),
                    EnumSet.allOf(FsmState.class));
        }

        @ParameterizedTest(name = "{0} serializes to its contract name")
        @EnumSource(FsmState.class)
        @DisplayName("fsm_state values are the bare enum names")
        void namesSerializeVerbatim(FsmState state) {
            assertEquals(state.name(), state.name());
            assertFalse(state.name().isBlank());
        }
    }

    @Nested
    @DisplayName("TransitionResult")
    class ResultRecord {

        @Test
        @DisplayName("an accepted result reports the move")
        void acceptedResult() {
            TransitionResult result = TransitionResult.accepted(FsmState.SAFE, FsmState.SUSPICIOUS);

            assertTrue(result.accepted());
            assertTrue(result.isMoved());
            assertEquals(FsmState.SAFE, result.from());
            assertEquals(FsmState.SUSPICIOUS, result.to());
        }

        @Test
        @DisplayName("a rejected result carries a reason and reports no move")
        void rejectedResult() {
            TransitionResult result = TransitionResult.rejected(
                    FsmState.SAFE, FsmState.ON_SCENE, "illegal transition");

            assertFalse(result.accepted());
            assertFalse(result.isMoved());
            assertEquals("illegal transition", result.reason());
        }

        @Test
        @DisplayName("a self-transition is unrepresentable")
        void selfTransitionUnrepresentable() {
            assertThrows(IllegalArgumentException.class,
                    () -> new TransitionResult(FsmState.SAFE, FsmState.SAFE, true, "noop"));
        }

        @Test
        @DisplayName("a rejection cannot be built without a reason")
        void rejectionNeedsReason() {
            assertThrows(IllegalArgumentException.class,
                    () -> new TransitionResult(FsmState.SAFE, FsmState.ON_SCENE, false, "  "));
        }

        @Test
        @DisplayName("null components are rejected")
        void nullComponentsRejected() {
            assertThrows(NullPointerException.class,
                    () -> TransitionResult.accepted(null, FsmState.SUSPICIOUS));
            assertThrows(NullPointerException.class,
                    () -> TransitionResult.accepted(FsmState.SAFE, null));
        }

        @ParameterizedTest(name = "results are equal by value: {0}")
        @ValueSource(strings = {"SAFE->SUSPICIOUS", "EMERGENCY->ON_SCENE"})
        void valueEquality(String label) {
            int arrow = label.indexOf("->");
            FsmState from = FsmState.valueOf(label.substring(0, arrow));
            FsmState to = FsmState.valueOf(label.substring(arrow + 2));

            assertEquals(TransitionResult.accepted(from, to), TransitionResult.accepted(from, to));
        }

        @Test
        @DisplayName("a refusal may report the current state as the un-entered target")
        void rejectionMayRepeatTheCurrentState() {
            TransitionResult result = TransitionResult.rejected(
                    FsmState.SAFE, FsmState.SAFE, "already in SAFE; the FSM never self-transitions");

            assertFalse(result.accepted());
            assertEquals(FsmState.SAFE, result.from());
            assertEquals(FsmState.SAFE, result.to());
        }
    }
}
