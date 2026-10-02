import api from './api';

export class EquipmentService {
  static async fetchAnomalies(buildingId) {
    return api.get(`/buildings/${buildingId}/equipment/anomalies`);
  }

  static async getSeverityMatrix(buildingId) {
    return api.get(`/buildings/${buildingId}/equipment/severity-matrix`);
  }

  static async getEquipmentHealth(buildingId) {
    return api.get(`/buildings/${buildingId}/equipment/health`);
  }

  static async getAnomalyDiagnosis(buildingId, anomalyId) {
    return api.get(`/buildings/${buildingId}/equipment/anomalies/${anomalyId}`);
  }
}

export default EquipmentService;
