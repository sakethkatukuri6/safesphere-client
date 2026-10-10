/**
 * API and WebSocket Service Configuration
 * Configurable via environment variables with default http://localhost:8080
 */

const DEFAULT_HTTP_BASE = 'http://localhost:8080';

export const API_CONFIG = {
  baseUrl: process.env.EXPO_PUBLIC_API_URL || DEFAULT_HTTP_BASE,
  get wsBaseUrl(): string {
    const httpUrl = this.baseUrl;
    if (httpUrl.startsWith('https://')) {
      return httpUrl.replace('https://', 'wss://');
    }
    return httpUrl.replace('http://', 'ws://');
  },
  endpoints: {
    sosTrigger: '/api/v1/sos/trigger',
    volunteerResponse: '/api/v1/volunteer/response',
    volunteerWs: '/ws/v1/incidents/volunteer',
  },
} as const;
