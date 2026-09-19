import { apiClient, fetchWithMockFallback } from './client';
import decisionMock from '../mock/decision.json';

export async function getLatestOptimization(feederId = 'F01', isCloudEvent = false) {
  return fetchWithMockFallback(
    () => apiClient.get(`/api/v1/optimization/${feederId}/latest`),
    () => isCloudEvent ? decisionMock.cloud_event : decisionMock.normal
  );
}

export async function runOptimization(feederId = 'F01') {
  return fetchWithMockFallback(
    () => apiClient.post(`/api/v1/optimization/${feederId}/run`),
    () => ({ ...decisionMock.cloud_event, created_at: new Date().toISOString() })
  );
}

export async function approveDecision(decisionId) {
  return fetchWithMockFallback(
    () => apiClient.post(`/api/v1/optimization/${decisionId}/approve`),
    () => ({
      status: 'APPROVED',
      decision_id: decisionId,
      message: 'Decision approved and dispatch signals queued for execution.',
      timestamp: new Date().toISOString()
    })
  );
}
