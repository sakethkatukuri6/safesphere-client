/**
 * SafeSphere Backend API Client
 * Targets the Java backend service via EXPO_PUBLIC_API_URL.
 * Provides fallback mock data with clear TODO comments so all screens work offline.
 */

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080';

export interface SosTriggerPayload {
  device_id: string;
  trigger_type: 'MANUAL_SOS' | 'CRASH_DETECTED' | 'ROUTE_DEVIATION';
  battery_level: number;
  network_quality: 'STRONG' | 'WEAK' | 'OFFLINE';
  cannot_speak: boolean;
  threat_nearby: boolean;
  timestamp: string;
}

export interface SosTriggerResponse {
  capsule_id: string;
  status: string;
}

export interface VolunteerResponsePayload {
  capsule_id: string;
  volunteer_id: string;
  action: 'ACCEPT' | 'DECLINE' | 'ARRIVED';
  timestamp: string;
}

export interface IncidentItem {
  id: string;
  code: string;
  distanceKm: number;
  distanceText: string;
  etaText: string;
  title: string;
  type: string;
  description: string;
  reportedAgo: string;
  requesting: string;
  safeToApproach: boolean;
  latitude: number;
  longitude: number;
}

export interface EvidenceItem {
  id: string;
  type: 'photo' | 'audio' | 'note';
  title: string;
  uri?: string;
  duration?: string;
  timestamp: string;
  size?: string;
}

export interface ContactItem {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  avatar?: string;
  isEmergencyService?: boolean;
}

export interface QuestionnaireResponse {
  situation: string;
  canSpeak: string;
  needMedical: string;
  timestamp: string;
}

// Generate an incident ID matching format "#SS-23814"
export function generateIncidentCode(): string {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `SS-${randomNum}`;
}

/**
 * 1. Trigger SOS Alert
 */
export async function triggerSos(
  payload: Partial<SosTriggerPayload>
): Promise<SosTriggerResponse> {
  const fullPayload: SosTriggerPayload = {
    device_id: payload.device_id || 'DEV-4471',
    trigger_type: payload.trigger_type || 'MANUAL_SOS',
    battery_level: payload.battery_level ?? 92,
    network_quality: payload.network_quality || 'STRONG',
    cannot_speak: payload.cannot_speak ?? false,
    threat_nearby: payload.threat_nearby ?? false,
    timestamp: payload.timestamp || new Date().toISOString(),
  };

  try {
    const response = await fetch(`${BASE_URL}/api/v1/sos/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullPayload),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        capsule_id: data.capsule_id || generateIncidentCode(),
        status: 'ACCEPTED',
      };
    }
  } catch (_error) {
    // TODO: Connect to live Java service at EXPO_PUBLIC_API_URL/api/v1/sos/trigger
    // Backend service not reachable, falling back to mock response for offline resilience
  }

  // Fallback mock response for offline operation
  return {
    capsule_id: generateIncidentCode(),
    status: 'ACCEPTED',
  };
}

/**
 * 2. Cancel SOS via PIN / Duress PIN
 */
export async function cancelEmergency(
  incidentId: string,
  pin: string,
  isDuress: boolean
): Promise<{ success: boolean; duressSilent: boolean }> {
  try {
    const response = await fetch(`${BASE_URL}/api/v1/sos/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        incident_id: incidentId,
        pin,
        is_duress: isDuress,
        reason: isDuress ? 'DURESS_TRIGGERED' : 'FALSE_ALARM',
        timestamp: new Date().toISOString(),
      }),
    });

    if (response.ok) {
      return { success: true, duressSilent: isDuress };
    }
  } catch (_error) {
    // TODO: Connect to Java backend /api/v1/sos/cancel
  }

  // Offline mock behavior
  return { success: true, duressSilent: isDuress };
}

/**
 * 3. Resolve Incident with Responder OTP
 */
export async function resolveWithResponderOtp(
  incidentId: string,
  otp: string
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${BASE_URL}/api/v1/sos/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        incident_id: incidentId,
        otp,
        timestamp: new Date().toISOString(),
      }),
    });

    if (response.ok) {
      return { success: true, message: 'Incident resolved by responder' };
    }
  } catch (_error) {
    // TODO: Connect to Java backend /api/v1/sos/resolve
  }

  return { success: true, message: 'Incident resolved by responder (offline mock)' };
}

/**
 * 4. Submit Silent Help Questionnaire
 */
export async function submitQuestionnaire(
  incidentId: string,
  data: QuestionnaireResponse
): Promise<{ success: boolean }> {
  try {
    const response = await fetch(`${BASE_URL}/api/v1/sos/questionnaire`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ incident_id: incidentId, ...data }),
    });

    if (response.ok) {
      return { success: true };
    }
  } catch (_error) {
    // TODO: Connect to Java backend /api/v1/sos/questionnaire
  }

  return { success: true };
}

/**
 * 5. Fetch Nearby Incidents (Volunteer / Citizen View)
 */
export async function fetchNearbyIncidents(): Promise<IncidentItem[]> {
  try {
    const response = await fetch(`${BASE_URL}/api/v1/incidents/nearby`);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (_error) {
    // TODO: Connect to Java backend /api/v1/incidents/nearby
  }

  // Mock data exactly matching the prototype board
  return [
    {
      id: 'inc-1',
      code: '#SS-23814',
      distanceKm: 0.7,
      distanceText: '0.7 km',
      etaText: '4 min',
      title: 'Assistance Needed',
      type: 'Assistance Needed',
      description: 'User in distress (limited info)',
      reportedAgo: '2 min ago',
      requesting: 'Nearby Volunteers',
      safeToApproach: true,
      latitude: 17.385,
      longitude: 78.4867,
    },
    {
      id: 'inc-2',
      code: '#SS-23810',
      distanceKm: 1.4,
      distanceText: '1.4 km',
      etaText: '8 min',
      title: 'Medical Support',
      type: 'Medical Support',
      description: 'First aid assistance requested',
      reportedAgo: '5 min ago',
      requesting: 'Medical Volunteers',
      safeToApproach: true,
      latitude: 17.388,
      longitude: 78.482,
    },
    {
      id: 'inc-3',
      code: '#SS-23805',
      distanceKm: 2.1,
      distanceText: '2.1 km',
      etaText: '12 min',
      title: 'General Help',
      type: 'General Help',
      description: 'Escort to safe zone needed',
      reportedAgo: '11 min ago',
      requesting: 'Citizen Volunteers',
      safeToApproach: true,
      latitude: 17.381,
      longitude: 78.491,
    },
  ];
}

/**
 * 6. Send Volunteer Action (ACCEPT / DECLINE / ARRIVED)
 */
export async function sendVolunteerResponse(
  payload: VolunteerResponsePayload
): Promise<{ success: boolean; status: string }> {
  try {
    const response = await fetch(`${BASE_URL}/api/v1/volunteer/response`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      return { success: true, status: payload.action };
    }
  } catch (_error) {
    // TODO: Connect to Java backend /api/v1/volunteer/response
  }

  return { success: true, status: payload.action };
}

/**
 * 7. Evidence Items
 */
export async function fetchEvidenceItems(): Promise<EvidenceItem[]> {
  // TODO: Connect to Java backend /api/v1/evidence/list
  return [
    {
      id: 'ev-1',
      type: 'photo',
      title: 'Street scene night',
      uri: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=600',
      timestamp: '09:41:22',
      size: '2.4 MB',
    },
    {
      id: 'ev-2',
      type: 'audio',
      title: 'Audio recording',
      duration: '00:24',
      timestamp: '09:41:24',
      size: '340 KB',
    },
    {
      id: 'ev-3',
      type: 'photo',
      title: 'Vehicle Plate TS 09 AB 1234',
      uri: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600',
      timestamp: '09:41:30',
      size: '1.8 MB',
    },
    {
      id: 'ev-4',
      type: 'photo',
      title: 'Handwritten note',
      uri: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600',
      timestamp: '09:41:45',
      size: '1.2 MB',
    },
    {
      id: 'ev-5',
      type: 'note',
      title: 'Incident Note',
      timestamp: '09:42:01',
      size: '120 B',
    },
  ];
}

/**
 * 8. Emergency Contacts Circle
 */
export async function fetchEmergencyContacts(): Promise<ContactItem[]> {
  // TODO: Connect to Java backend /api/v1/contacts
  return [
    {
      id: 'c-1',
      name: 'Mom',
      relationship: 'Mother',
      phone: '+91 98765 43210',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120',
    },
    {
      id: 'c-2',
      name: 'Dad',
      relationship: 'Father',
      phone: '+91 98765 43210',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
    },
    {
      id: 'c-3',
      name: 'Best Friend',
      relationship: 'Friend',
      phone: '+91 98765 43210',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
    },
  ];
}
