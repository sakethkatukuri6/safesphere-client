package com.safesphere.incident;

import com.fasterxml.jackson.databind.node.ObjectNode;
import com.safesphere.api.CitizenPayloads;
import com.safesphere.api.SosTriggerEvent;
import com.safesphere.api.VolunteerAction;
import com.safesphere.api.VolunteerIncidentView;
import com.safesphere.api.VolunteerResponseEvent;
import com.safesphere.domain.EmergencyCapsule;
import com.safesphere.domain.Telemetry;
import com.safesphere.domain.TriggerType;
import com.safesphere.fixture.AuthProvider;
import com.safesphere.fixture.TelemetryProvider;
import com.safesphere.fsm.EmergencyStateEngine;
import com.safesphere.fsm.FsmState;
import com.safesphere.fsm.TransitionResult;
import com.safesphere.matching.CapabilityMatcher;
import com.safesphere.matching.MatchCandidate;
import com.safesphere.persistence.AuditEventRepository;
import com.safesphere.persistence.IncidentRecord;
import com.safesphere.persistence.IncidentRepository;
import com.safesphere.persistence.ResponderRepository;
import com.safesphere.persistence.VictimProfileRepository;
import com.safesphere.security.EvidenceVault;
import com.safesphere.ws.VolunteerBroadcaster;
import java.time.Clock;
import java.time.Instant;
import java.util.Optional;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * The Citizen-facing incident pipeline: the single place where an SOS becomes a persisted, matched,
 * audited, and pushed incident.
 *
 * <p>Responsibilities, in the order they happen for a trigger:
 * <ol>
 *   <li>drive the FSM from {@code SAFE} to {@code EMERGENCY}, taking the {@code CRASH_DETECTED}
 *       bypass when the device reports it and otherwise walking the confirmation path;</li>
 *   <li>assemble the internal {@link EmergencyCapsule} and seal its evidence in the Evidence Vault;</li>
 *   <li>persist the incident and write the audit row;</li>
 *   <li>match a volunteer with the weighted matcher from {@code SafeSphere.md} section 10;</li>
 *   <li>push a role-scoped {@link VolunteerIncidentView} to that volunteer only.</li>
 * </ol>
 *
 * <p>The victim's coordinates and identity come from development fixtures, because the frozen
 * {@code SosTriggerEvent} carries neither. The FSM is never advanced by a client: every state change
 * here is a decision the backend made.
 *
 * <p>This class is stateless apart from its collaborators, so it is safe to call from the request
 * threads and the WebSocket callbacks concurrently.
 */
public final class IncidentService {

    private static final Logger log = LoggerFactory.getLogger(IncidentService.class);

    /** Stand-in identity used only when a device has no development profile seeded. */
    private static final String UNKNOWN_NAME = "Unknown";
    private static final String UNKNOWN_GENDER = "Unknown";
    private static final int UNKNOWN_AGE = 0;

    private final IncidentRepository incidents;
    private final AuditEventRepository audit;
    private final ResponderRepository responders;
    private final VictimProfileRepository profiles;
    private final TelemetryProvider telemetryProvider;
    private final AuthProvider auth;
    private final CapabilityMatcher matcher;
    private final EvidenceVault vault;
    private final VolunteerBroadcaster broadcaster;
    private final IncidentRegistry registry;
    private final CapsuleIdGenerator idGenerator;
    private final Clock clock;

    public IncidentService(IncidentRepository incidents,
                           AuditEventRepository audit,
                           ResponderRepository responders,
                           VictimProfileRepository profiles,
                           TelemetryProvider telemetryProvider,
                           AuthProvider auth,
                           CapabilityMatcher matcher,
                           EvidenceVault vault,
                           VolunteerBroadcaster broadcaster,
                           IncidentRegistry registry,
                           CapsuleIdGenerator idGenerator,
                           Clock clock) {
        this.incidents = incidents;
        this.audit = audit;
        this.responders = responders;
        this.profiles = profiles;
        this.telemetryProvider = telemetryProvider;
        this.auth = auth;
        this.matcher = matcher;
        this.vault = vault;
        this.broadcaster = broadcaster;
        this.registry = registry;
        this.idGenerator = idGenerator;
        this.clock = clock;
    }

    /**
     * Handles {@code POST /api/v1/sos/trigger}.
     *
     * <p>Always persists and always returns a capsule id: the user pressed the button, and the
     * backend's job is to own what happens next. A missing volunteer is not an error.
     *
     * @return the new capsule id, e.g. {@code CR-8924}
     */
    public String handleSos(SosTriggerEvent event) {
        Instant now = clock.instant();
        String capsuleId = idGenerator.next();
        EmergencyStateEngine engine = new EmergencyStateEngine();
        registry.register(capsuleId);

        requireAccepted(engine.transitionTo(FsmState.SUSPICIOUS), capsuleId, "SAFE -> SUSPICIOUS");
        if (event.trigger_type() == TriggerType.CRASH_DETECTED) {
            // The device's own motion sensors detected the crash, so the 10s window is skipped.
            requireAccepted(engine.applyCrashBypass(), capsuleId, "CRASH_DETECTED bypass");
        } else {
            // The app ran its own silent confirmation before sending; the backend records the
            // confirmed press rather than re-waiting.
            requireAccepted(engine.transitionTo(FsmState.CHECKING), capsuleId, "SUSPICIOUS -> CHECKING");
            requireAccepted(engine.transitionTo(FsmState.EMERGENCY), capsuleId, "CHECKING -> EMERGENCY");
        }

        TelemetryProvider.Coordinates coordinates = telemetryProvider
                .coordinatesFor(event.device_id())
                .orElseThrow(() -> new IllegalStateException(
                        "no coordinates for device " + event.device_id()));

        Telemetry telemetry = new Telemetry(
                coordinates.latitude(),
                coordinates.longitude(),
                event.battery_level(),
                event.network_quality());

        // Internal only. medicalSummary stays null: no citizen-facing surface supplies one, and the
        // field exists for the Professional App's full-access view, which is not built here.
        EmergencyCapsule capsule = new EmergencyCapsule(
                capsuleId, now, engine.state(), telemetry, null, null);

        incidents.insert(new IncidentRecord(
                capsuleId,
                event.device_id(),
                engine.state(),
                event.trigger_type(),
                event.battery_level(),
                event.network_quality(),
                event.cannot_speak(),
                event.threat_nearby(),
                coordinates.latitude(),
                coordinates.longitude(),
                null,
                null,
                null,
                now,
                now));

        audit.append(capsuleId, AuditEventRepository.SOS_TRIGGERED, null,
                "trigger_type=" + event.trigger_type(), now);

        // Seal the trigger-time evidence bundle. Whatever the vault returns is already ciphertext.
        incidents.update(incidents.findByCapsuleId(capsuleId).orElseThrow()
                .withEvidence(vault.seal(sealableEvidence(event, capsule, telemetry)), now));

        log.info("incident {} opened for device {} in state {}",
                capsuleId, event.device_id(), engine.state());

        matchAndPush(capsuleId, Set.of(), now);
        return capsuleId;
    }

    /**
     * Handles {@code POST /api/v1/volunteer/response}.
     *
     * @throws VolunteerResponseRejected if the incident, volunteer, assignment, or FSM state makes
     *         the action impossible
     */
    public VolunteerOutcome handleVolunteerResponse(VolunteerResponseEvent event) {
        Instant now = clock.instant();

        IncidentRecord incident = incidents.findByCapsuleId(event.capsule_id())
                .orElseThrow(() -> new VolunteerResponseRejected(
                        ResponseRejection.UNKNOWN_INCIDENT,
                        "no incident " + event.capsule_id()));

        if (!auth.isKnownVolunteer(event.volunteer_id())) {
            throw new VolunteerResponseRejected(ResponseRejection.UNKNOWN_VOLUNTEER,
                    "unknown volunteer " + event.volunteer_id());
        }

        EmergencyStateEngine engine = registry.engineFor(event.capsule_id());
        if (engine == null) {
            throw new VolunteerResponseRejected(ResponseRejection.UNKNOWN_INCIDENT,
                    "no engine for incident " + event.capsule_id());
        }
        FsmState state = engine.state();

        return switch (event.action()) {
            case ACCEPT -> accept(event, incident, engine, state, now);
            case DECLINE -> decline(event, incident, engine, state, now);
            case ARRIVED -> arrived(event, incident, state, now);
        };
    }

    private VolunteerOutcome accept(VolunteerResponseEvent event, IncidentRecord incident,
                                    EmergencyStateEngine engine, FsmState state, Instant now) {
        requireAssignment(incident, event.volunteer_id());

        if (state == FsmState.VOLUNTEER_ASSIGNED && event.volunteer_id().equals(incident.matchedResponderId())) {
            // Idempotent re-accept by the same volunteer: nothing to change.
            return VolunteerOutcome.ACCEPTED;
        }

        TransitionResult result = engine.transitionTo(FsmState.VOLUNTEER_ASSIGNED);
        if (!result.accepted()) {
            throw new VolunteerResponseRejected(ResponseRejection.INVALID_STATE, result.reason());
        }

        incidents.assign(event.capsule_id(), event.volunteer_id(), FsmState.VOLUNTEER_ASSIGNED, now);
        audit.append(event.capsule_id(), AuditEventRepository.VOLUNTEER_ACCEPTED,
                event.volunteer_id(), "state=" + FsmState.VOLUNTEER_ASSIGNED, now);

        // The same volunteer sees the state change, so its Accept/Decline buttons become "Mark Arrived".
        pushTo(event.volunteer_id(), incident, FsmState.VOLUNTEER_ASSIGNED, now);
        return VolunteerOutcome.ACCEPTED;
    }

    private VolunteerOutcome decline(VolunteerResponseEvent event, IncidentRecord incident,
                                     EmergencyStateEngine engine, FsmState state, Instant now) {
        requireAssignment(incident, event.volunteer_id());

        if (state != FsmState.EMERGENCY) {
            // A decline is only meaningful before an accept. Reverting VOLUNTEER_ASSIGNED back to
            // EMERGENCY is not a legal hop in the strict FSM, so this is refused rather than faked.
            throw new VolunteerResponseRejected(ResponseRejection.INVALID_STATE,
                    "decline requires EMERGENCY, incident is " + state);
        }

        responders.recordDecline(event.capsule_id(), event.volunteer_id(), now);
        audit.append(event.capsule_id(), AuditEventRepository.VOLUNTEER_DECLINED,
                event.volunteer_id(), "re-matching", now);
        log.info("volunteer {} declined {}; re-matching", event.volunteer_id(), event.capsule_id());

        boolean rematched = matchAndPush(event.capsule_id(), responders.findDeclined(event.capsule_id()), now);
        return rematched ? VolunteerOutcome.DECLINED_REMATCHED : VolunteerOutcome.DECLINED_NO_CANDIDATE;
    }

    private VolunteerOutcome arrived(VolunteerResponseEvent event, IncidentRecord incident,
                                     FsmState state, Instant now) {
        requireAssignment(incident, event.volunteer_id());

        if (state != FsmState.VOLUNTEER_ASSIGNED) {
            throw new VolunteerResponseRejected(ResponseRejection.INVALID_STATE,
                    "arrival requires VOLUNTEER_ASSIGNED, incident is " + state);
        }

        // Audit only. This does not advance the FSM, does not publish a silence acknowledgement, and
        // leaves the victim's alert running: silencing is the Professional App's Field mode action.
        audit.append(event.capsule_id(), AuditEventRepository.VOLUNTEER_ARRIVED,
                event.volunteer_id(), "on scene; alert not silenced", now);
        log.info("volunteer {} reported arrival at {} (audit only, alert still active)",
                event.volunteer_id(), event.capsule_id());
        return VolunteerOutcome.ARRIVED_LOGGED;
    }

    private void requireAssignment(IncidentRecord incident, String volunteerId) {
        if (!volunteerId.equals(incident.matchedResponderId())) {
            throw new VolunteerResponseRejected(ResponseRejection.NOT_ASSIGNED,
                    "volunteer " + volunteerId + " is not assigned to " + incident.capsuleId());
        }
    }

    /**
     * Finds the best un-declined volunteer, records the assignment, and pushes the stripped view.
     *
     * @return whether a volunteer was found and notified
     */
    private boolean matchAndPush(String capsuleId, Set<String> excluded, Instant now) {
        IncidentRecord incident = incidents.findByCapsuleId(capsuleId).orElseThrow();
        FsmState state = registry.stateOf(capsuleId);

        Optional<MatchCandidate> best = matcher.findBest(
                incident.latitude(), incident.longitude(), excluded);

        if (best.isEmpty()) {
            // Nobody available. The incident stays open and persisted; it is not an error.
            incidents.clearAssignment(capsuleId, now);
            log.info("incident {} has no matchable volunteer; it remains {}", capsuleId, state);
            return false;
        }

        String responderId = best.get().responderId();
        incidents.assign(capsuleId, responderId, state, now);
        audit.append(capsuleId, "VOLUNTEER_MATCHED", responderId,
                "score=" + String.format("%.3f", best.get().matchScore())
                        + " distance_km=" + String.format("%.3f", best.get().distanceKm()), now);
        pushTo(responderId, incident, state, now);
        return true;
    }

    private void pushTo(String volunteerId, IncidentRecord incident, FsmState state, Instant now) {
        VolunteerIncidentView view = buildView(incident, state, now);
        broadcaster.publish(volunteerId, CitizenPayloads.volunteerIncident(view));
    }

    /**
     * Builds the Help Nearby payload for an incident.
     *
     * <p>Exposed for tests that assert the stripping without going through a socket.
     */
    public VolunteerIncidentView buildView(IncidentRecord incident, FsmState state, Instant now) {
        VictimProfileRepository.DevVictimProfile profile = profiles
                .findByDeviceId(incident.deviceId())
                .orElseGet(() -> {
                    log.warn("no development profile for device {}; sending placeholder identity",
                            incident.deviceId());
                    return new VictimProfileRepository.DevVictimProfile(
                            incident.deviceId(), UNKNOWN_NAME, UNKNOWN_AGE, UNKNOWN_GENDER);
                });

        return new VolunteerIncidentView(
                incident.capsuleId(),
                state,
                profile.victimName(),
                profile.victimAge(),
                profile.victimGender(),
                new VolunteerIncidentView.IncidentLocation(
                        incident.latitude(), incident.longitude(), now));
    }

    /** The only evidence available from a citizen trigger, sealed as-is with no fabrication. */
    private String sealableEvidence(SosTriggerEvent event, EmergencyCapsule capsule, Telemetry telemetry) {
        ObjectNode node = CitizenPayloads.mapper().createObjectNode();
        node.put("capsule_id", capsule.capsuleId());
        node.put("device_id", event.device_id());
        node.put("trigger_type", event.trigger_type().name());
        node.put("battery_level", event.battery_level());
        node.put("network_quality", event.network_quality().name());
        node.put("cannot_speak", event.cannot_speak());
        node.put("threat_nearby", event.threat_nearby());
        node.put("latitude", telemetry.latitude());
        node.put("longitude", telemetry.longitude());
        node.put("triggered_at", event.timestamp().toString());
        try {
            return CitizenPayloads.mapper().writeValueAsString(node);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new IllegalStateException("cannot serialize evidence bundle", e);
        }
    }

    private static void requireAccepted(TransitionResult result, String capsuleId, String step) {
        if (!result.accepted()) {
            throw new IllegalStateException(
                    "FSM refused " + step + " for " + capsuleId + ": " + result.reason());
        }
    }
}
