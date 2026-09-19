import { apiClient, fetchWithMockFallback } from './client';
import reliabilityMock from '../mock/reliability.json';

export async function getReliabilityMetrics(feederId = 'F01') {
  return fetchWithMockFallback(
    () => apiClient.get(`/api/v1/reliability/${feederId}/metrics`),
    () => reliabilityMock
  );
}
