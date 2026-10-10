package com.safesphere.ws;

import io.javalin.websocket.WsContext;

/**
 * Adapts a Javalin {@link WsContext} to {@link OutboundChannel}, keeping framework types out of the
 * broadcaster.
 *
 * <p>Every WebSocket in this backend belongs to the Citizen Help Nearby channel. There is no official,
 * queue, or dispatcher channel: those belong to the Professional App, which is a separate repository
 * with its own contract.
 */
public final class JavalinOutboundChannel implements OutboundChannel {

    private final WsContext context;

    public JavalinOutboundChannel(WsContext context) {
        this.context = context;
    }

    @Override
    public void send(String payload) {
        context.send(payload);
    }

    @Override
    public String id() {
        return context.sessionId();
    }

    @Override
    public String toString() {
        return "JavalinOutboundChannel[" + context.sessionId() + "]";
    }
}
