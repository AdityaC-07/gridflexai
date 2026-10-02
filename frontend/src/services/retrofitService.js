import api from './api';

export class RetrofitService {
  static async fetchRetrofits(buildingId) {
    return api.get(`/buildings/${buildingId}/retrofits`);
  }

  static async generateRecommendations(buildingId) {
    return api.post(`/buildings/${buildingId}/retrofit-recommendations`);
  }

  static async selectRetrofits(buildingId, selectedIds) {
    return api.post(`/buildings/${buildingId}/retrofits/select`, {
      selected_ids: selectedIds,
    });
  }

  static async createImplementationPlan(buildingId, selectedIds) {
    return api.post(`/buildings/${buildingId}/retrofits/implementation-plan`, {
      selected_ids: selectedIds,
    });
  }
}

export default RetrofitService;
