import api from './api';

export class BuildingService {
  static async fetchBuildings() {
    return api.get('/buildings');
  }

  static async fetchBuilding(id) {
    return api.get(`/buildings/${id}`);
  }

  static async fetchConsumption(id, days = 7) {
    return api.get(`/buildings/${id}/consumption/timeseries?days=${days}`);
  }

  static async getEfficiencyVsBaseline(id) {
    return api.get(`/buildings/${id}/consumption/vs-baseline`);
  }

  static async createBuilding(data) {
    return api.post('/buildings', data);
  }
}

export default BuildingService;
