import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getFeederState } from '../api/feeder';
import { getForecast } from '../api/forecast';
import { getLatestOptimization, approveDecision, runOptimization } from '../api/optimization';
import { getAlerts } from '../api/alerts';
import { getReliabilityMetrics } from '../api/reliability';
import { triggerSimulationEvent, resetSimulation } from '../api/simulation';
import { CONFIG } from '../config';
// Existing shared scenario definition (frontend-local demo contract). Reused
// as a PRESENTATION-ONLY overlay while a scenario is active; never written to
// any backend and never presented as live telemetry.
import feederScenarioMock from '../mock/feederState.json';

const GridStateContext = createContext();

export function GridStateProvider({ children }) {
  const [isCloudEvent, setIsCloudEvent] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState('PENDING'); // PENDING | EXECUTING | APPROVED
  const [feederState, setFeederState] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [optimizationData, setOptimizationData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [reliabilityData, setReliabilityData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isUsingMock, setIsUsingMock] = useState(CONFIG.USE_MOCK);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Refresh all system data
  const refreshAll = useCallback(async (cloudEventActive = isCloudEvent) => {
    try {
      setError(null);
      const [feederRes, forecastRes, optRes, alertRes, relRes] = await Promise.all([
        getFeederState(CONFIG.DEFAULT_FEEDER_ID, cloudEventActive),
        getForecast(CONFIG.DEFAULT_FEEDER_ID, cloudEventActive),
        getLatestOptimization(CONFIG.DEFAULT_FEEDER_ID, cloudEventActive),
        getAlerts(CONFIG.DEFAULT_FEEDER_ID, cloudEventActive),
        getReliabilityMetrics(CONFIG.DEFAULT_FEEDER_ID)
      ]);

      setFeederState(feederRes.data);
      setForecastData(forecastRes.data);
      setOptimizationData(optRes.data);
      setAlerts(alertRes.data);
      setReliabilityData(relRes.data);

      if (feederRes.isMock || forecastRes.isMock) {
        setIsUsingMock(true);
      } else {
        setIsUsingMock(false);
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch grid state:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [isCloudEvent]);

  // Initial load and periodic polling
  useEffect(() => {
    refreshAll(isCloudEvent);

    const interval = setInterval(() => {
      refreshAll(isCloudEvent);
    }, CONFIG.POLLING.FEEDER_STATE);

    return () => clearInterval(interval);
  }, [isCloudEvent, refreshAll]);

  // Trigger cloud event simulation
  const handleTriggerCloudEvent = async (severityPct = 79) => {
    setIsLoading(true);
    await triggerSimulationEvent({ feeder_id: CONFIG.DEFAULT_FEEDER_ID, event_type: 'CLOUD_EVENT', severity_pct: severityPct });
    setIsCloudEvent(true);
    setApprovalStatus('PENDING');
    await refreshAll(true);
  };

  // Reset simulation back to normal
  const handleResetSimulation = async () => {
    setIsLoading(true);
    await resetSimulation(CONFIG.DEFAULT_FEEDER_ID);
    setIsCloudEvent(false);
    setApprovalStatus('PENDING');
    await refreshAll(false);
  };

  // Run optimization on demand
  const handleRunOptimization = async () => {
    setIsLoading(true);
    const optRes = await runOptimization(CONFIG.DEFAULT_FEEDER_ID);
    setOptimizationData(optRes.data);
    setApprovalStatus('PENDING');
    setLastUpdated(new Date());
    setIsLoading(false);
  };

  // Approve decision
  const handleApproveDecision = async (decisionId) => {
    setApprovalStatus('EXECUTING');
    const decisionToApprove = decisionId || optimizationData?.decision_id || 'D-F01-CLOUD-7902';
    const res = await approveDecision(decisionToApprove);
    
    setTimeout(() => {
      setApprovalStatus('APPROVED');
      setOptimizationData(prev => prev ? { ...prev, status: 'APPROVED' } : prev);
      setLastUpdated(new Date());
    }, 1200);
  };

  return (
    <GridStateContext.Provider value={{
      isCloudEvent,
      // scenarioFeeder is non-null only while the frontend-local scenario is
      // active. Operator components may display its demand/solar/gap/stress
      // values PROVIDED they label them as scenario values. All API payloads
      // (feederState, forecastData, optimizationData, alerts) stay live.
      scenarioFeeder: isCloudEvent ? (feederScenarioMock.cloud_event || null) : null,
      approvalStatus,
      feederState,
      forecastData,
      optimizationData,
      alerts,
      reliabilityData,
      lastUpdated,
      isUsingMock,
      isLoading,
      error,
      refreshAll,
      triggerCloudEvent: handleTriggerCloudEvent,
      resetSimulation: handleResetSimulation,
      runOptimization: handleRunOptimization,
      approveDecision: handleApproveDecision
    }}>
      {children}
    </GridStateContext.Provider>
  );
}

export function useGridState() {
  const context = useContext(GridStateContext);
  if (!context) {
    throw new Error('useGridState must be used within a GridStateProvider');
  }
  return context;
}
