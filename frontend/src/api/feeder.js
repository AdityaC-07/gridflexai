import { apiClient, fetchWithMockFallback } from './client';
import feederMock from '../mock/feederState.json';
import telemetryHistoryMock from '../mock/telemetryHistory.json';
import reliabilityMock from '../mock/reliability.json';

export async function getFeederState(feederId = 'F01', isCloudEvent = false) {
  return fetchWithMockFallback(
    () => apiClient.get(`/api/v1/feeder/${feederId}/state`),
    () => isCloudEvent ? feederMock.cloud_event : feederMock.normal
  );
}

export async function getFeederTelemetryCurrent(feederId = 'F01') {
  return fetchWithMockFallback(
    () => apiClient.get(`/api/v1/feeder/${feederId}/telemetry/current`),
    () => ({
      feeder_id: feederId,
      solar_kw: 118.0,
      demand_kw: 162.0,
      battery_soc_pct: 76.0,
      grid_import_kw: 44.0,
      timestamp: new Date().toISOString()
    })
  );
}

export async function getFeederTelemetryHistory(feederId = 'F01', hours = 6) {
  return fetchWithMockFallback(
    () => apiClient.get(`/api/v1/feeder/${feederId}/telemetry/history`, { params: { hours } }),
    () => telemetryHistoryMock
  );
}

export async function getFeeders() {
  return fetchWithMockFallback(
    () => apiClient.get('/api/v1/feeders'),
    () => reliabilityMock.feeders_summary
  );
}
