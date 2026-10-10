package com.safesphere.ws;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Server-side fan-out for the Help Nearby channel
 * ({@code WSS /ws/v1/incidents/volunteer?volunteer_id={id}}).
 *
 * <p><strong>Filtering happens here, in the backend, before serialization.</strong> A payload is
 * delivered only to connections registered under the same {@code volunteer_id}, so a volunteer never
 * receives an incident they were not matched to — the requirement in
 * {@code CitizenAppContract.md} section 2. This is not a client-side filter the app is trusted to
 * apply; the routing decision is made here.
 *
 * <p>A volunteer may have several live connections (a reconnect race, or a second device), so each
 * id maps to a set. Registration is concurrent: the WebSocket callbacks and the HTTP request threads
 * that trigger pushes run on different threads, so the backing collections are concurrent and a
 * disconnect removes the channel from every id it was registered under.
 */
public final class VolunteerBroadcaster {

    private static final Logger log = LoggerFactory.getLogger(VolunteerBroadcaster.class);

    private final Map<String, Set<OutboundChannel>> byVolunteer = new ConcurrentHashMap<>();

    /** Registers a live connection under a volunteer id. Re-registering the same channel is a no-op. */
    public void subscribe(String volunteerId, OutboundChannel channel) {
        if (volunteerId == null || volunteerId.isBlank() || channel == null) {
            return;
        }
        byVolunteer.computeIfAbsent(volunteerId, key -> new CopyOnWriteArraySet<>()).add(channel);
        log.info("volunteer {} subscribed ({} live connection(s))", volunteerId, countFor(volunteerId));
    }

    /** Removes one connection from one volunteer id. */
    public void unsubscribe(String volunteerId, OutboundChannel channel) {
        if (volunteerId == null || channel == null) {
            return;
        }
        Set<OutboundChannel> channels = byVolunteer.get(volunteerId);
        if (channels == null) {
            return;
        }
        channels.remove(channel);
        if (channels.isEmpty()) {
            byVolunteer.remove(volunteerId, channels);
        }
    }

    /**
     * Removes a channel from every id it was registered under. Called on disconnect, where the
     * volunteer id is not necessarily to hand.
     */
    public void unsubscribeEverywhere(OutboundChannel channel) {
        if (channel == null) {
            return;
        }
        byVolunteer.forEach((volunteerId, channels) -> {
            if (channels.remove(channel) && channels.isEmpty()) {
                byVolunteer.remove(volunteerId, channels);
            }
        });
    }

    /**
     * Delivers a payload to one volunteer only.
     *
     * @return the number of connections the payload reached, which is 0 when nobody is subscribed
     */
    public int publish(String volunteerId, String payload) {
        if (volunteerId == null || volunteerId.isBlank() || payload == null) {
            return 0;
        }
        Set<OutboundChannel> channels = byVolunteer.get(volunteerId);
        if (channels == null || channels.isEmpty()) {
            log.info("no live connection for volunteer {}; incident push skipped", volunteerId);
            return 0;
        }
        int delivered = 0;
        for (OutboundChannel channel : channels) {
            try {
                channel.send(payload);
                delivered++;
            } catch (RuntimeException e) {
                // One broken socket must not stop delivery to the rest.
                log.warn("push to volunteer {} failed on connection {}: {}",
                        volunteerId, channel.id(), e.toString());
            }
        }
        log.info("pushed incident to volunteer {} on {} connection(s)", volunteerId, delivered);
        return delivered;
    }

    /** Live connections for a volunteer id. */
    public int countFor(String volunteerId) {
        Set<OutboundChannel> channels = byVolunteer.get(volunteerId);
        return channels == null ? 0 : channels.size();
    }

    /** Whether a volunteer has at least one live connection. */
    public boolean isSubscribed(String volunteerId) {
        return countFor(volunteerId) > 0;
    }

    /** Every currently subscribed volunteer id. */
    public Set<String> subscribedVolunteerIds() {
        return Set.copyOf(byVolunteer.keySet());
    }
}
