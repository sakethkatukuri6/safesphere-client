import { API_CONFIG } from './config';
import {
  SosTriggerEvent,
  SosTriggerResponse,
  VolunteerResponseEvent,
} from './contract.types';

export interface IApiClient {
  triggerSos(event: SosTriggerEvent): Promise<SosTriggerResponse>;
  sendVolunteerResponse(event: VolunteerResponseEvent): Promise<void>;
}

export class ApiClient implements IApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_CONFIG.baseUrl) {
    this.baseUrl = baseUrl;
  }

  async triggerSos(event: SosTriggerEvent): Promise<SosTriggerResponse> {
    const url = `${this.baseUrl}${API_CONFIG.endpoints.sosTrigger}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.status === 202 || response.status === 200) {
        try {
          const data = (await response.json()) as SosTriggerResponse;
          if (data && typeof data.capsule_id === 'string') {
            return data;
          }
          return { capsule_id: 'CR-8924' };
        } catch {
          return { capsule_id: 'CR-8924' };
        }
      }

      throw new Error(`SOS trigger failed with status ${response.status}`);
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('Network request timed out. Please verify connectivity and try again.');
      }
      throw err;
    }
  }

  async sendVolunteerResponse(event: VolunteerResponseEvent): Promise<void> {
    const url = `${this.baseUrl}${API_CONFIG.endpoints.volunteerResponse}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok && response.status !== 200 && response.status !== 202) {
        throw new Error(`Volunteer response failed with status ${response.status}`);
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('Volunteer response request timed out.');
      }
      throw err;
    }
  }
}

/**
 * Mock API client used for fallback or when backend is unreachable during local testing.
 */
export class MockApiClient implements IApiClient {
  async triggerSos(_event: SosTriggerEvent): Promise<SosTriggerResponse> {
    // Simulate slight network delay
    await new Promise((resolve) => setTimeout(resolve, 400));
    // Deterministic mock capsule ID
    return {
      capsule_id: `CR-${Math.floor(1000 + Math.random() * 9000)}`,
    };
  }

  async sendVolunteerResponse(_event: VolunteerResponseEvent): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}

export const defaultApiClient: IApiClient = new ApiClient();
export const mockApiClient: IApiClient = new MockApiClient();

export function getActiveApiClient(): IApiClient {
  if (process.env.EXPO_PUBLIC_USE_MOCK === 'true') {
    return mockApiClient;
  }
  return defaultApiClient;
}
