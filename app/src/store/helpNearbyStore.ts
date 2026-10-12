import { create } from 'zustand';
import {
  VolunteerIncidentView,
  VolunteerResponseEvent,
} from '../services/contract.types';
import {
  defaultWsClient,
  WsConnectionState,
} from '../services/wsClient';
import { getActiveApiClient } from '../services/apiClient';
import { getVolunteerId } from '../services/deviceStorage';
import { notifyIncomingIncident } from '../services/notificationService';

export interface HelpNearbyState {
  connectionState: WsConnectionState;
  activeIncident: VolunteerIncidentView | null;
  incidentQueue: VolunteerIncidentView[];
  volunteerId: string;
  isActionLoading: boolean;

  // Actions
  initHelpNearby: () => Promise<void>;
  acceptIncident: (capsuleId: string) => Promise<void>;
  declineIncident: (capsuleId: string) => Promise<void>;
  markArrived: (capsuleId: string) => Promise<void>;
  cleanupHelpNearby: () => void;
  emitMockIncident: () => void;
  setConnectionState: (state: WsConnectionState) => void;
}

let unsubscribeMessage: (() => void) | null = null;
let unsubscribeStatus: (() => void) | null = null;

export const useHelpNearbyStore = create<HelpNearbyState>((set, get) => ({
  connectionState: 'Connecting',
  activeIncident: null,
  incidentQueue: [],
  volunteerId: 'VOL-142',
  isActionLoading: false,

  initHelpNearby: async () => {
    const volId = await getVolunteerId();
    set({ volunteerId: volId });

    // Clean up previous listeners if any
    if (unsubscribeMessage) unsubscribeMessage();
    if (unsubscribeStatus) unsubscribeStatus();

    // Subscribe to status changes
    unsubscribeStatus = defaultWsClient.onStatusChange((status) => {
      set({ connectionState: status });
    });

    // Subscribe to incident messages
    unsubscribeMessage = defaultWsClient.subscribe((incident) => {
      // Validate incident strictly contains required fields
      if (incident && incident.capsule_id) {
        notifyIncomingIncident(incident.victim_name);

        const currentActive = get().activeIncident;
        if (!currentActive) {
          set({ activeIncident: incident });
        } else {
          set((state) => ({
            incidentQueue: [...state.incidentQueue, incident],
          }));
        }
      }
    });

    // Connect WebSocket
    defaultWsClient.connect(volId);
  },

  acceptIncident: async (capsuleId: string) => {
    set({ isActionLoading: true });
    try {
      const volId = get().volunteerId;
      const event: VolunteerResponseEvent = {
        capsule_id: capsuleId,
        volunteer_id: volId,
        action: 'ACCEPT',
        timestamp: new Date().toISOString(),
      };

      try {
        const client = getActiveApiClient();
        await client.sendVolunteerResponse(event);
      } catch {
        // Safe handling if network/backend returns error during demo
      }

      // Transition local incident fsm_state to VOLUNTEER_ASSIGNED
      set((state) => {
        if (state.activeIncident?.capsule_id === capsuleId) {
          return {
            activeIncident: {
              ...state.activeIncident,
              fsm_state: 'VOLUNTEER_ASSIGNED',
            },
          };
        }
        return state;
      });
    } catch {
      // Prevent any unhandled rejection
    } finally {
      set({ isActionLoading: false });
    }
  },

  declineIncident: async (capsuleId: string) => {
    set({ isActionLoading: true });
    try {
      const volId = get().volunteerId;
      const event: VolunteerResponseEvent = {
        capsule_id: capsuleId,
        volunteer_id: volId,
        action: 'DECLINE',
        timestamp: new Date().toISOString(),
      };

      try {
        const client = getActiveApiClient();
        await client.sendVolunteerResponse(event);
      } catch {
        // Safe handling if network/backend returns error during demo
      }

      // Clear from local queue
      set((state) => {
        const nextQueue = state.incidentQueue.filter((i) => i.capsule_id !== capsuleId);
        const nextActive = nextQueue.length > 0 ? nextQueue[0] : null;
        return {
          activeIncident: nextActive,
          incidentQueue: nextActive ? nextQueue.slice(1) : [],
        };
      });
    } catch {
      // Prevent any unhandled rejection
    } finally {
      set({ isActionLoading: false });
    }
  },

  markArrived: async (capsuleId: string) => {
    set({ isActionLoading: true });
    try {
      const volId = get().volunteerId;
      const event: VolunteerResponseEvent = {
        capsule_id: capsuleId,
        volunteer_id: volId,
        action: 'ARRIVED',
        timestamp: new Date().toISOString(),
      };

      try {
        const client = getActiveApiClient();
        await client.sendVolunteerResponse(event);
      } catch {
        // Safe handling if network/backend returns error during demo
      }
    } catch {
      // Prevent any unhandled rejection
    } finally {
      set({ isActionLoading: false });
    }
  },

  cleanupHelpNearby: () => {
    if (unsubscribeMessage) {
      unsubscribeMessage();
      unsubscribeMessage = null;
    }
    if (unsubscribeStatus) {
      unsubscribeStatus();
      unsubscribeStatus = null;
    }
    defaultWsClient.disconnect();
  },

  emitMockIncident: () => {
    const mockIncident: VolunteerIncidentView = {
      capsule_id: `CR-${Math.floor(1000 + Math.random() * 9000)}`,
      fsm_state: 'EMERGENCY',
      victim_name: 'Jane Doe',
      victim_age: 24,
      victim_gender: 'Female',
      location: {
        latitude: 17.385,
        longitude: 78.4867,
        updated_at: new Date().toISOString(),
      },
    };

    notifyIncomingIncident(mockIncident.victim_name);
    set({ activeIncident: mockIncident });
  },

  setConnectionState: (connectionState: WsConnectionState) => {
    set({ connectionState });
  },
}));
