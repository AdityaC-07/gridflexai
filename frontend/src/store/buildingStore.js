import { create } from 'zustand';

export const useBuildingStore = create((set, get) => ({
  selectedBuildingId: null,
  buildings: [],
  currentBuilding: null,
  consumption: [],
  loading: false,
  error: null,
  setSelectedBuilding: (id) => {
    set({ selectedBuildingId: id });
  },
  setBuildings: (buildings) => {
    set({ buildings });
  },
  setCurrentBuilding: (building) => {
    set({ currentBuilding: building });
  },
  setConsumption: (consumption) => {
    set({ consumption });
  },
  setLoading: (loading) => {
    set({ loading });
  },
  setError: (error) => {
    set({ error });
  },
  getSelectedBuilding: () => {
    const { buildings, selectedBuildingId } = get();
    return buildings.find((b) => b.id === selectedBuildingId) || null;
  },
  getEfficiencyBadge: () => {
    const eff = get().getEfficiencyVsBaseline?.() || { efficiency_badge: 'NEUTRAL' };
    return eff.efficiency_badge;
  },
  getConsumptionChartData: () => {
    const { consumption } = get();
    return consumption.map((c) => ({
      timestamp: c.timestamp,
      total: c.kwh_total,
      hvac: c.kwh_hvac || 0,
      lighting: c.kwh_lighting || 0,
      plug: c.kwh_plug || 0,
      baseline: c.baseline_kwh || 0,
    }));
  },
}));
