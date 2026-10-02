import { create } from 'zustand';

export const useGridStore = create((set, get) => ({
  gridState: {
    frequency_hz: 50.02,
    load_percent: 92,
    tariff_rupees_per_kwh: 15.5,
    peak_active: true,
  },
  generationMix: {
    solar: { mw: 8500, percent: 35, trend: 'down', next_event: 'sunset at 18:15 IST' },
    wind: { mw: 3200, percent: 13, trend: 'up' },
    conventional: { mw: 15600, percent: 52, trend: 'stable' },
  },
  peakWindowActive: true,
  remainingPeakMinutes: 102,
  currentTariff: 15.5,
  loading: false,
  setGridState: (state) => {
    set({ gridState: state });
  },
  setGenerationMix: (mix) => {
    set({ generationMix: mix });
  },
  setLoading: (loading) => {
    set({ loading });
  },
  getPeakAlertColor: () => {
    const peak = get().peakWindowActive;
    return peak ? 'red' : 'green';
  },
  getFrequencyStatus: () => {
    const freq = get().gridState.frequency_hz;
    if (freq < 49.9) return 'CRITICAL';
    if (freq < 49.95) return 'WARNING';
    return 'NORMAL';
  },
}));
