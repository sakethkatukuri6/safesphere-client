package com.safesphere.ws;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

/**
 * Tests for server-side volunteer filtering.
 *
 * <p>The requirement from {@code CitizenAppContract.md} section 2 is that a volunteer never receives
 * an incident they were not matched to. That decision is made here, in the backend, so these tests
 * use a recording channel rather than a live socket; the socket transport itself is covered
 * end-to-end in {@code CitizenFlowEndToEndTest}.
 */
class VolunteerBroadcasterTest {

    /** A channel that records everything sent to it. */
    private static final class RecordingChannel implements OutboundChannel {
        private final String id;
        // Copy-on-write: pushes arrive from many threads at once, and a plain list would silently
        // lose entries, which would look like a broadcaster bug rather than a harness bug.
        private final List<String> received = new java.util.concurrent.CopyOnWriteArrayList<>();

        RecordingChannel(String id) {
            this.id = id;
        }

        @Override
        public void send(String payload) {
            received.add(payload);
        }

        @Override
        public String id() {
            return id;
        }
    }

    /** A channel that always fails, standing in for a socket that died mid-push. */
    private static final class BrokenChannel implements OutboundChannel {
        @Override
        public void send(String payload) {
            throw new IllegalStateException("socket closed");
        }

        @Override
        public String id() {
            return "broken";
        }
    }

    @Nested
    @DisplayName("filtering")
    class Filtering {

        @Test
        @DisplayName("a push reaches only the subscribed volunteer")
        void pushReachesOnlyTheSubscriber() {
            VolunteerBroadcaster broadcaster = new VolunteerBroadcaster();
            RecordingChannel alpha = new RecordingChannel("alpha");
            RecordingChannel bravo = new RecordingChannel("bravo");
            broadcaster.subscribe("VOL-142", alpha);
            broadcaster.subscribe("VOL-143", bravo);

            int delivered = broadcaster.publish("VOL-142", "{\"capsule_id\":\"CR-1\"}");

            assertEquals(1, delivered);
            assertEquals(1, alpha.received.size());
            assertEquals(0, bravo.received.size(),
                    "VOL-143 must never see an incident it was not matched to");
        }

        @Test
        @DisplayName("an unsubscribed volunteer receives nothing")
        void unsubscribedVolunteerReceivesNothing() {
            VolunteerBroadcaster broadcaster = new VolunteerBroadcaster();
            RecordingChannel alpha = new RecordingChannel("alpha");
            broadcaster.subscribe("VOL-142", alpha);

            assertEquals(0, broadcaster.publish("VOL-999", "payload"));
            assertEquals(0, alpha.received.size());
        }

        @Test
        @DisplayName("a push with no subscribers is a no-op, not a failure")
        void noSubscribersIsSafe() {
            VolunteerBroadcaster broadcaster = new VolunteerBroadcaster();

            assertEquals(0, broadcaster.publish("VOL-142", "payload"));
        }

        @Test
        @DisplayName("every connection of one volunteer receives the push")
        void multipleConnectionsAllReceive() {
            VolunteerBroadcaster broadcaster = new VolunteerBroadcaster();
            RecordingChannel phone = new RecordingChannel("phone");
            RecordingChannel tablet = new RecordingChannel("tablet");
            broadcaster.subscribe("VOL-142", phone);
            broadcaster.subscribe("VOL-142", tablet);

            assertEquals(2, broadcaster.publish("VOL-142", "payload"));

            assertEquals(1, phone.received.size());
            assertEquals(1, tablet.received.size());
        }

        @Test
        @DisplayName("a failed delivery does not stop the others")
        void brokenChannelDoesNotBlockOthers() {
            VolunteerBroadcaster broadcaster = new VolunteerBroadcaster();
            RecordingChannel healthy = new RecordingChannel("healthy");
            broadcaster.subscribe("VOL-142", new BrokenChannel());
            broadcaster.subscribe("VOL-142", healthy);

            int delivered = broadcaster.publish("VOL-142", "payload");

            assertEquals(1, delivered, "the healthy connection must still be served");
            assertEquals(1, healthy.received.size());
        }
    }

    @Nested
    @DisplayName("registration lifecycle")
    class Registration {

        @Test
        @DisplayName("unsubscribing stops delivery")
        void unsubscribeStopsDelivery() {
            VolunteerBroadcaster broadcaster = new VolunteerBroadcaster();
            RecordingChannel alpha = new RecordingChannel("alpha");
            broadcaster.subscribe("VOL-142", alpha);

            broadcaster.unsubscribe("VOL-142", alpha);
            broadcaster.publish("VOL-142", "payload");

            assertEquals(0, alpha.received.size());
        }

        @Test
        @DisplayName("unsubscribing everywhere clears a disconnecting channel")
        void unsubscribeEverywhereClears() {
            VolunteerBroadcaster broadcaster = new VolunteerBroadcaster();
            RecordingChannel alpha = new RecordingChannel("alpha");
            broadcaster.subscribe("VOL-142", alpha);
            broadcaster.subscribe("VOL-143", alpha);

            broadcaster.unsubscribeEverywhere(alpha);
            broadcaster.publish("VOL-142", "payload");
            broadcaster.publish("VOL-143", "payload");

            assertEquals(0, alpha.received.size());
            assertTrue(broadcaster.subscribedVolunteerIds().isEmpty());
        }

        @Test
        @DisplayName("subscribing the same channel twice does not duplicate delivery")
        void duplicateSubscribeIsIdempotent() {
            VolunteerBroadcaster broadcaster = new VolunteerBroadcaster();
            RecordingChannel alpha = new RecordingChannel("alpha");

            broadcaster.subscribe("VOL-142", alpha);
            broadcaster.subscribe("VOL-142", alpha);
            broadcaster.publish("VOL-142", "payload");

            assertEquals(1, alpha.received.size());
            assertEquals(1, broadcaster.countFor("VOL-142"));
        }

        @Test
        @DisplayName("null and blank subscriptions are ignored")
        void invalidSubscriptionsIgnored() {
            VolunteerBroadcaster broadcaster = new VolunteerBroadcaster();
            RecordingChannel alpha = new RecordingChannel("alpha");

            broadcaster.subscribe(null, alpha);
            broadcaster.subscribe("  ", alpha);
            broadcaster.subscribe("VOL-142", null);
            broadcaster.publish("VOL-142", "payload");

            assertEquals(0, alpha.received.size());
            assertTrue(broadcaster.subscribedVolunteerIds().isEmpty());
        }

        @Test
        @DisplayName("a null or blank volunteer id receives no push")
        void invalidPublishIsIgnored() {
            VolunteerBroadcaster broadcaster = new VolunteerBroadcaster();

            assertEquals(0, broadcaster.publish(null, "payload"));
            assertEquals(0, broadcaster.publish("", "payload"));
            assertEquals(0, broadcaster.publish("VOL-142", null));
        }

        @Test
        @DisplayName("membership is reported accurately")
        void membershipReported() {
            VolunteerBroadcaster broadcaster = new VolunteerBroadcaster();
            RecordingChannel alpha = new RecordingChannel("alpha");

            assertFalse(broadcaster.isSubscribed("VOL-142"));
            broadcaster.subscribe("VOL-142", alpha);
            assertTrue(broadcaster.isSubscribed("VOL-142"));
            assertEquals(Set.of("VOL-142"), broadcaster.subscribedVolunteerIds());
        }
    }

    @Nested
    @DisplayName("concurrent use")
    class Concurrency {

        @Test
        @DisplayName("concurrent pushes deliver exactly once per subscriber")
        void concurrentPushesAreNotLost() throws Exception {
            VolunteerBroadcaster broadcaster = new VolunteerBroadcaster();
            RecordingChannel alpha = new RecordingChannel("alpha");
            RecordingChannel bravo = new RecordingChannel("bravo");
            broadcaster.subscribe("VOL-142", alpha);
            broadcaster.subscribe("VOL-143", bravo);

            int threads = 8;
            int perThread = 50;
            ExecutorService pool = Executors.newFixedThreadPool(threads);
            CountDownLatch start = new CountDownLatch(1);
            try {
                for (int t = 0; t < threads; t++) {
                    pool.submit(() -> {
                        start.await();
                        for (int i = 0; i < perThread; i++) {
                            broadcaster.publish("VOL-142", "payload");
                        }
                        return null;
                    });
                }
                start.countDown();
                pool.shutdown();
                assertTrue(pool.awaitTermination(60, TimeUnit.SECONDS));
            } finally {
                pool.shutdownNow();
            }

            assertEquals(threads * perThread, alpha.received.size());
            assertEquals(0, bravo.received.size(), "filtering must hold under concurrency");
        }

        @Test
        @DisplayName("subscribing while pushing does not corrupt the registry")
        void concurrentSubscribeAndPublish() throws Exception {
            VolunteerBroadcaster broadcaster = new VolunteerBroadcaster();
            ExecutorService pool = Executors.newFixedThreadPool(6);
            CountDownLatch start = new CountDownLatch(1);
            try {
                for (int t = 0; t < 4; t++) {
                    final int id = t;
                    pool.submit(() -> {
                        start.await();
                        for (int i = 0; i < 100; i++) {
                            RecordingChannel channel = new RecordingChannel("c" + id + "-" + i);
                            broadcaster.subscribe("VOL-" + id, channel);
                            broadcaster.publish("VOL-" + id, "payload");
                            broadcaster.unsubscribe("VOL-" + id, channel);
                        }
                        return null;
                    });
                }
                start.countDown();
                pool.shutdown();
                assertTrue(pool.awaitTermination(60, TimeUnit.SECONDS));
            } finally {
                pool.shutdownNow();
            }

            assertTrue(broadcaster.subscribedVolunteerIds().isEmpty(),
                    "every channel unsubscribed, so no id should remain registered");
        }
    }
}
