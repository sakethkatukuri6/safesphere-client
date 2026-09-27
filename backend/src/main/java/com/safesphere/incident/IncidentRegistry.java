package com.safesphere.incident;

import com.safesphere.fsm.EmergencyStateEngine;
import com.safesphere.fsm.FsmState;
import com.safesphere.persistence.IncidentRepository;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Keeps one {@link EmergencyStateEngine} per in-flight incident.
 *
 * <p>The engine is stateful, so it cannot be reconstructed from the table alone: which hops have been
 * taken is part of the state. This registry holds the live engines, and rehydrates one seeded at the
 * persisted state when a capsule is not in memory — which is what happens after a process restart.
 * Rehydrating never bypasses a rule, because only the engine may advance the machine.
 */
public final class IncidentRegistry {

    private final Map<String, EmergencyStateEngine> engines = new ConcurrentHashMap<>();
    private final IncidentRepository incidents;

    public IncidentRegistry(IncidentRepository incidents) {
        this.incidents = Objects.requireNonNull(incidents, "incidents is required");
    }

    /** Registers a brand-new incident, which by definition starts in {@link FsmState#SAFE}. */
    public void register(String capsuleId) {
        engines.put(capsuleId, new EmergencyStateEngine());
    }

    /**
     * The engine for an incident, rehydrating from the persisted state if the process restarted.
     *
     * @return the engine, or {@code null} when the incident is neither live nor persisted
     */
    public EmergencyStateEngine engineFor(String capsuleId) {
        EmergencyStateEngine existing = engines.get(capsuleId);
        if (existing != null) {
            return existing;
        }
        return incidents.findByCapsuleId(capsuleId)
                .map(record -> {
                    EmergencyStateEngine rehydrated = new EmergencyStateEngine(record.fsmState());
                    engines.put(capsuleId, rehydrated);
                    return rehydrated;
                })
                .orElse(null);
    }

    /** The state of an incident, or {@code null} if unknown. */
    public FsmState stateOf(String capsuleId) {
        EmergencyStateEngine engine = engineFor(capsuleId);
        return engine == null ? null : engine.state();
    }

    /** Forgets an incident, e.g. once it is resolved and reset. */
    public void forget(String capsuleId) {
        engines.remove(capsuleId);
    }

    /** Number of live engines, for diagnostics and tests. */
    public int size() {
        return engines.size();
    }
}
