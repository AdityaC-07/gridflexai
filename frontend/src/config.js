// Configuration for GridFlex AI Frontend

export const CONFIG = {
  API_BASE_URL: import.meta.env.VITE_API_URL || 'http://13.127.165.59:8000',
  USE_MOCK: import.meta.env.VITE_USE_MOCK === 'true',
  DEFAULT_FEEDER_ID: 'F01',
  DEFAULT_FEEDER_NAME: 'Dharavi North',
  
  // Polling Intervals in milliseconds
  POLLING: {
    FEEDER_STATE: 30000,   // 30s
    FORECAST: 60000,       // 60s
    OPTIMIZATION: 30000,   // 30s
    ALERTS: 20000,         // 20s
    RELIABILITY: 60000,    // 60s
    SIMULATION: 10000      // 10s
  }
};
