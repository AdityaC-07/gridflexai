import { useState } from 'react';
import SimulationService from '../services/simulationService';

export const useSimulation = () => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runSimulation = async (feederId, scenarioType, severity, duration) => {
    setLoading(true);
    setError(null);
    try {
      const response = await SimulationService.injectScenario(feederId, scenarioType, severity, duration);
      const simId = response.simulation_id;
      const simResults = await SimulationService.getSimulationResults(simId);
      setResults(simResults);
      return simResults;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reset = async () => {
    try {
      await SimulationService.resetSimulation();
      setResults(null);
    } catch (err) {
      console.error('Failed to reset:', err);
    }
  };

  return { results, loading, error, runSimulation, reset };
};
