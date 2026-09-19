import { apiClient, fetchWithMockFallback } from './client';

export async function triggerSimulationEvent(eventPayload = { feeder_id: 'F01', event_type: 'CLOUD_EVENT', severity_pct: 79 }) {
  return fetchWithMockFallback(
    () => apiClient.post('/simulation/event', eventPayload),
    () => ({
      status: 'ACTIVE',
      feeder_id: eventPayload.feeder_id || 'F01',
      event_type: 'CLOUD_EVENT',
      severity_pct: eventPayload.severity_pct || 79,
      duration_minutes: 150,
      started_at: new Date().toISOString()
    })
  );
}

export async function getSimulationStatus() {
  return fetchWithMockFallback(
    () => apiClient.get('/simulation/status'),
    () => ({
      active: true,
      event_type: 'CLOUD_EVENT',
      severity_pct: 79,
      duration_minutes: 150
    })
  );
}

export async function resetSimulation(feederId = 'F01') {
  return fetchWithMockFallback(
    () => apiClient.post('/simulation/reset', { feeder_id: feederId }),
    () => ({ status: 'RESET', feeder_id: feederId })
  );
}
