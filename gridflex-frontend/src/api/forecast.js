import { apiClient, fetchWithMockFallback } from './client';
import forecastMock from '../mock/forecast.json';

// Live Data/API returns ridge-model series:
// { feeder_id, model, confidence (0-1 fraction), timestamp/created_at,
//   demand: [{ offset_minutes, forecast_kw, ... }],
//   solar:  [{ offset_minutes, forecast_kw, ... }] }
// The chart consumes:
// { feeder_id, forecast_confidence_pct, points: [{ time, demand_kw, solar_kw, gap_kw }] }
// Normalize live payloads to that shape; mock-shaped payloads (with `points`)
// pass through untouched. No values are invented: gap info is absent from the
// live response, so gap_kw is 0 (nothing drawn).
function toChartPoints(live) {
  const demand = Array.isArray(live?.demand) ? live.demand : [];
  const solar = Array.isArray(live?.solar) ? live.solar : [];
  if (demand.length === 0 && solar.length === 0) return [];
  const solarByOffset = new Map(solar.map((s) => [s?.offset_minutes, s]));
  const anchorMs = Date.parse(live?.timestamp || live?.created_at);
  const hasAnchor = Number.isFinite(anchorMs);
  const round1 = (v) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v * 10) / 10 : 0);
  return demand.map((d) => {
    const offset = d?.offset_minutes ?? 0;
    let time = `${offset}m`;
    if (hasAnchor) {
      // Anchor (UTC) + offset, displayed as IST wall-clock HH:MM like the mock labels.
      const ist = new Date(anchorMs + offset * 60000 + 5.5 * 3600000);
      time = `${String(ist.getUTCHours()).padStart(2, '0')}:${String(ist.getUTCMinutes()).padStart(2, '0')}`;
    }
    const s = solarByOffset.get(offset);
    return {
      time,
      demand_kw: round1(d?.forecast_kw),
      solar_kw: round1(s?.forecast_kw),
      gap_kw: 0,
    };
  });
}

function toConfidencePct(raw) {
  const c = raw?.confidence ?? raw?.forecast_confidence_pct;
  if (typeof c !== 'number' || !Number.isFinite(c)) return undefined;
  return Math.round(c <= 1 ? c * 100 : c);
}

function normalizeForecast(raw) {
  if (Array.isArray(raw?.points)) return raw;
  return {
    feeder_id: raw?.feeder_id,
    model: raw?.model,
    forecast_confidence_pct: toConfidencePct(raw),
    points: toChartPoints(raw),
  };
}

export async function getForecast(feederId = 'F01', isCloudEvent = false) {
  const res = await fetchWithMockFallback(
    () => apiClient.get(`/api/v1/forecast/${feederId}`),
    () => isCloudEvent ? forecastMock.cloud_event : forecastMock.normal
  );
  if (res.isMock) return res;
  return { ...res, data: normalizeForecast(res.data) };
}
