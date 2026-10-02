import api from './api';

export class GridService {
  static async fetchGridState() {
    return api.get('/grid/state');
  }

  static async fetchGenerationMix() {
    return api.get('/grid/generation-mix');
  }

  static async checkPeakAlert() {
    return api.get('/grid/peak-alert');
  }

  static async fetchEnergyForecast(buildingId = null) {
    const url = buildingId ? `/grid/energy-forecast?building_id=${buildingId}` : '/grid/energy-forecast';
    return api.get(url);
  }

  static async getFlexibilityAssets(buildingId) {
    return api.get(`/buildings/${buildingId}/flexibility-assets`);
  }
}

export default GridService;
