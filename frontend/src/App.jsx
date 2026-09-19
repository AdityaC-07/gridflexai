import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GridStateProvider } from './context/GridStateContext';
import { Layout } from './components/layout/Layout';
import { OperatorDashboard } from './pages/OperatorDashboard';
import { ResidentView } from './pages/ResidentView';
import { DiscomDashboard } from './pages/DiscomDashboard';
import { SimulationPage } from './pages/SimulationPage';
import { ReliabilityPage } from './pages/ReliabilityPage';

export function App() {
  return (
    <GridStateProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/operator" replace />} />
            <Route path="/operator" element={<OperatorDashboard />} />
            <Route path="/simulation" element={<SimulationPage />} />
            <Route path="/reliability" element={<ReliabilityPage />} />
            <Route path="/discom" element={<DiscomDashboard />} />
            <Route path="/resident" element={<ResidentView />} />
            <Route path="*" element={<Navigate to="/operator" replace />} />
          </Routes>
        </Layout>
      </Router>
    </GridStateProvider>
  );
}

export default App;
