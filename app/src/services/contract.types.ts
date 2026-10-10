/**
 * SafeSphere Citizen App Contract (M1) - Frozen Interface Specification v4.0
 * Wire contract types against safesphere-client/backend
 * Exact matching to CitizenAppContract.md. No additional fields, no omissions.
 */

export type FsmState =
  | 'SAFE'
  | 'SUSPICIOUS'
  | 'CHECKING'
  | 'EMERGENCY'
  | 'VOLUNTEER_ASSIGNED'
  | 'ESCALATING'
  | 'RESPONDER_ASSIGNED'
  | 'ON_SCENE'
  | 'RESOLVED';

export type TriggerType =
  | 'MANUAL_SOS'
  | 'CRASH_DETECTED'
  | 'ROUTE_DEVIATION';

export type NetworkQuality =
  | 'STRONG'
  | 'WEAK'
  | 'OFFLINE';

export interface SosTriggerEvent {
  device_id: string;
  trigger_type: TriggerType;
  battery_level: number;
  network_quality: NetworkQuality;
  cannot_speak: boolean;
  threat_nearby: boolean;
  timestamp: string; // ISO-8601 string
}

export interface SosTriggerResponse {
  capsule_id: string;
}

export interface VolunteerIncidentLocation {
  latitude: number;
  longitude: number;
  updated_at: string; // ISO-8601 string
}

/**
 * EXACTLY six fields. No medical data, no hazard notes, no contacts, no OTP.
 */
export interface VolunteerIncidentView {
  capsule_id: string;
  fsm_state: FsmState;
  victim_name: string;
  victim_age: number;
  victim_gender: string;
  location: VolunteerIncidentLocation;
}

export type VolunteerAction =
  | 'ACCEPT'
  | 'DECLINE'
  | 'ARRIVED';

export interface VolunteerResponseEvent {
  capsule_id: string;
  volunteer_id: string;
  action: VolunteerAction;
  timestamp: string; // ISO-8601 string
}
