import { apiClient, fetchWithMockFallback } from './client';
import alertsMock from '../mock/alerts.json';

// Live Data/API returns { feeder_id, alerts: [{ severity, message, ... }] };
// mock fallback returns a bare array. Normalize both to an array so consumers
// can safely use .length / [i] / .map. No alerts are invented.
function normalizeAlerts(raw) {
  const list = Array.isArray(raw) ? raw : raw?.alerts;
  if (!Array.isArray(list)) return [];
  return list.map((a) => ({
    ...a,
    severity: a?.severity ?? 'INFO',
    message: a?.message ?? '',
    title: a?.title ?? (a?.severity && a.severity !== 'INFO' ? `Grid Alert · ${a.severity}` : 'Feeder Status · Normal'),
  }));
}

export async function getAlerts(feederId = 'F01', isCloudEvent = false) {
  const res = await fetchWithMockFallback(
    () => apiClient.get(`/api/v1/alerts/${feederId}`),
    () => isCloudEvent ? alertsMock.cloud_event : alertsMock.normal
  );
  if (res.isMock) return res;
  return { ...res, data: normalizeAlerts(res.data) };
}
