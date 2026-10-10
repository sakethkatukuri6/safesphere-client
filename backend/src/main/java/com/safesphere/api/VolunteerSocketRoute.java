package com.safesphere.api;

import com.safesphere.ws.JavalinOutboundChannel;
import com.safesphere.ws.OutboundChannel;
import com.safesphere.ws.VolunteerBroadcaster;
import io.javalin.Javalin;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * The Help Nearby WebSocket: {@code WSS /ws/v1/incidents/volunteer?volunteer_id={id}}.
 *
 * <p>The {@code volunteer_id} query parameter is the subscription key, and the backend routes by it
 * ({@code CitizenAppContract.md} section 2): a push reaches only the connections registered under
 * that id, so a volunteer is never sent an incident they were not matched to.
 *
 * <p>On connect the subscriber is recorded; on close the same channel instance is unregistered, so a
 * dropped connection leaves no phantom subscriber behind. This is the one and only WebSocket channel
 * in this backend — there is no official, queue, or dispatcher channel, because those belong to the
 * Professional App's own contract.
 */
public final class VolunteerSocketRoute {

    private static final Logger log = LoggerFactory.getLogger(VolunteerSocketRoute.class);

    private final VolunteerBroadcaster broadcaster;

    /**
     * Live channels by WebSocket session id. Holding the instance (rather than rebuilding one on
     * close) is what lets disconnect remove the exact subscription that was registered.
     */
    private final Map<String, Registration> registrations = new ConcurrentHashMap<>();

    public VolunteerSocketRoute(VolunteerBroadcaster broadcaster) {
        this.broadcaster = broadcaster;
    }

    /** A channel together with the volunteer id it subscribed under. */
    private record Registration(String volunteerId, OutboundChannel channel) {
    }

    /** Registers the route on the Javalin instance. */
    public void register(Javalin app) {
        app.ws("/ws/v1/incidents/volunteer", ws -> {
            ws.onConnect(ctx -> {
                String volunteerId = ctx.queryParam("volunteer_id");
                if (volunteerId == null || volunteerId.isBlank()) {
                    // Without an id there is no way to filter correctly, so refuse rather than
                    // register a subscriber that could receive another volunteer's incident.
                    log.warn("rejecting volunteer socket with no volunteer_id");
                    ctx.closeSession(1008, "volunteer_id is required");
                    return;
                }
                OutboundChannel channel = new JavalinOutboundChannel(ctx);
                registrations.put(ctx.sessionId(), new Registration(volunteerId, channel));
                broadcaster.subscribe(volunteerId, channel);
            });

            ws.onClose(ctx -> {
                Registration registration = registrations.remove(ctx.sessionId());
                if (registration != null) {
                    broadcaster.unsubscribe(registration.volunteerId(), registration.channel());
                } else {
                    broadcaster.unsubscribeEverywhere(new JavalinOutboundChannel(ctx));
                }
            });
        });
    }

    /** Number of live socket registrations. Diagnostics and tests. */
    public int registrationCount() {
        return registrations.size();
    }
}
