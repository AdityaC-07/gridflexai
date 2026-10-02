import api from './api';

export class SimulationService {
  static async injectScenario(feederId, scenarioType, severity, duration) {
    return api.post('/simulation/inject-event', {
      feeder_id: feederId,
      scenario_type: scenarioType,
      severity_degradation_percent: severity,
      duration_minutes: duration,
    });
  }

  static async getSimulationResults(simulationId) {
    return api.get(`/simulation/${simulationId}/results`);
  }

  static async resetSimulation() {
    return api.post('/simulation/reset');
  }
}

export default SimulationService;
