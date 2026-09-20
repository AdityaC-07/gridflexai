// Configuration for GridFlex AI Frontend

export const CONFIG = {
  // VITE_API_URL="" (empty) → use Vite proxy (same-origin, no CORS).
  // VITE_API_URL="http://localhost:8000" → direct to local backend.
  // VITE_API_URL="https://api.gridflex.ai" → production backend.
  API_BASE_URL: import.meta.env.VITE_API_URL ?? '',
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
