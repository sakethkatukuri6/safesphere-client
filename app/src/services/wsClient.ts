import { API_CONFIG } from './config';
import { VolunteerIncidentView } from './contract.types';

export type WsConnectionState = 'Connecting' | 'Connected' | 'Reconnecting' | 'Disconnected';

export interface IWebSocketClient {
  connect(volunteerId: string): void;
  disconnect(): void;
  subscribe(callback: (incident: VolunteerIncidentView) => void): () => void;
  onStatusChange(callback: (status: WsConnectionState) => void): () => void;
  getState(): WsConnectionState;
}

export class WebSocketClient implements IWebSocketClient {
  private socket: WebSocket | null = null;
  private volunteerId: string | null = null;
  private state: WsConnectionState = 'Disconnected';
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isIntentionallyClosed = false;

  private messageListeners = new Set<(incident: VolunteerIncidentView) => void>();
  private statusListeners = new Set<(status: WsConnectionState) => void>();

  connect(volunteerId: string): void {
    this.volunteerId = volunteerId;
    this.isIntentionallyClosed = false;
    this.reconnectAttempt = 0;
    this.establishConnection();
  }

  private establishConnection(): void {
    if (this.socket) {
      try {
        this.socket.close();
      } catch {
        // ignore close error
      }
      this.socket = null;
    }

    if (!this.volunteerId) return;

    this.updateState(this.reconnectAttempt === 0 ? 'Connecting' : 'Reconnecting');

    const wsUrl = `${API_CONFIG.wsBaseUrl}${API_CONFIG.endpoints.volunteerWs}?volunteer_id=${encodeURIComponent(
      this.volunteerId
    )}`;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.reconnectAttempt = 0;
        this.updateState('Connected');
      };

      this.socket.onmessage = (event) => {
        try {
          if (typeof event.data !== 'string') return;
          const parsed = JSON.parse(event.data);
          // Verify required fields per contract
          if (
            parsed &&
            typeof parsed.capsule_id === 'string' &&
            typeof parsed.fsm_state === 'string' &&
            typeof parsed.victim_name === 'string' &&
            typeof parsed.victim_age === 'number' &&
            typeof parsed.victim_gender === 'string' &&
            parsed.location &&
            typeof parsed.location.latitude === 'number' &&
            typeof parsed.location.longitude === 'number'
          ) {
            const incident: VolunteerIncidentView = {
              capsule_id: parsed.capsule_id,
              fsm_state: parsed.fsm_state,
              victim_name: parsed.victim_name,
              victim_age: parsed.victim_age,
              victim_gender: parsed.victim_gender,
              location: {
                latitude: parsed.location.latitude,
                longitude: parsed.location.longitude,
                updated_at:
                  typeof parsed.location.updated_at === 'string'
                    ? parsed.location.updated_at
                    : new Date().toISOString(),
              },
            };
            this.messageListeners.forEach((listener) => {
              try {
                listener(incident);
              } catch {
                // Prevent listener error from breaking socket loop
              }
            });
          }
          // CONTRACT-GAP: G3 - No payload defined for clearing other volunteers' queues (clear queue message)
        } catch {
          // ignore unparsable payload
        }
      };

      this.socket.onerror = () => {
        // socket will trigger onclose next
      };

      this.socket.onclose = () => {
        this.socket = null;
        if (!this.isIntentionallyClosed) {
          this.scheduleReconnect();
        } else {
          this.updateState('Disconnected');
        }
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.isIntentionallyClosed) return;
    this.updateState('Reconnecting');
    this.reconnectAttempt++;
    // Exponential backoff: min 1s, max 16s with 2^attempt
    const delayMs = Math.min(1000 * Math.pow(2, this.reconnectAttempt - 1), 16000);

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      if (!this.isIntentionallyClosed) {
        this.establishConnection();
      }
    }, delayMs);
  }

  disconnect(): void {
    this.isIntentionallyClosed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      try {
        this.socket.close();
      } catch {}
      this.socket = null;
    }
    this.updateState('Disconnected');
  }

  subscribe(callback: (incident: VolunteerIncidentView) => void): () => void {
    this.messageListeners.add(callback);
    return () => {
      this.messageListeners.delete(callback);
    };
  }

  onStatusChange(callback: (status: WsConnectionState) => void): () => void {
    this.statusListeners.add(callback);
    try {
      callback(this.state);
    } catch {}
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  getState(): WsConnectionState {
    return this.state;
  }

  private updateState(newState: WsConnectionState): void {
    this.state = newState;
    this.statusListeners.forEach((listener) => {
      try {
        listener(newState);
      } catch {}
    });
  }
}

/**
 * Mock WebSocket Client for offline testing or manual demonstration
 */
export class MockWebSocketClient implements IWebSocketClient {
  private state: WsConnectionState = 'Disconnected';
  private messageListeners = new Set<(incident: VolunteerIncidentView) => void>();
  private statusListeners = new Set<(status: WsConnectionState) => void>();
  private mockTimer: ReturnType<typeof setTimeout> | null = null;

  connect(_volunteerId: string): void {
    this.updateState('Connecting');
    setTimeout(() => {
      this.updateState('Connected');
    }, 400);
  }

  disconnect(): void {
    if (this.mockTimer) {
      clearTimeout(this.mockTimer);
      this.mockTimer = null;
    }
    this.updateState('Disconnected');
  }

  subscribe(callback: (incident: VolunteerIncidentView) => void): () => void {
    this.messageListeners.add(callback);
    return () => {
      this.messageListeners.delete(callback);
    };
  }

  onStatusChange(callback: (status: WsConnectionState) => void): () => void {
    this.statusListeners.add(callback);
    callback(this.state);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  getState(): WsConnectionState {
    return this.state;
  }

  private updateState(newState: WsConnectionState): void {
    this.state = newState;
    this.statusListeners.forEach((listener) => listener(newState));
  }

  emitMockIncident(incident: VolunteerIncidentView): void {
    this.messageListeners.forEach((listener) => listener(incident));
  }
}

export const defaultWsClient = new WebSocketClient();
export const mockWsClient = new MockWebSocketClient();
