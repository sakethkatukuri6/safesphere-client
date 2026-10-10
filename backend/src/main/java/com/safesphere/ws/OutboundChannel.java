package com.safesphere.ws;

/**
 * A single outbound WebSocket connection.
 *
 * <p>An interface so the broadcaster can be tested without a live socket, and so the Javalin
 * {@code WsContext} stays confined to one small adapter class.
 */
public interface OutboundChannel {

    /**
     * Sends one already-serialized payload.
     *
     * <p>Implementations must not throw: a dead connection is a normal event, and one broken
     * subscriber must never prevent delivery to the others or fail the request that triggered the
     * push.
     */
    void send(String payload);

    /** A short identifier for logs. */
    String id();
}
