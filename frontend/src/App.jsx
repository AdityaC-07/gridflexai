import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { BuildingProvider } from './context/BuildingContext';
import { AppLayout } from './components/layout/AppLayout';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { BuildingDetailsPage } from './pages/BuildingDetailsPage';
import { GridOpsPage } from './pages/GridOpsPage';
import { RetrofitsPage } from './pages/RetrofitsPage';
import { EquipmentPage } from './pages/EquipmentPage';

export function App() {
  return (
    <BuildingProvider>
      <Router>
        <Routes>
          {/* Landing Page (Full width, no app topbar/sidebar) */}
          <Route
            path="/"
            element={
              <AppLayout showHeader={false}>
                <LandingPage />
              </AppLayout>
            }
          />

          {/* App Dashboard */}
          <Route
            path="/dashboard"
            element={
              <AppLayout>
                <DashboardPage />
              </AppLayout>
            }
          />

          {/* Building Details */}
          <Route
            path="/buildings/:id"
            element={
              <AppLayout>
                <BuildingDetailsPage />
              </AppLayout>
            }
          />
          <Route
            path="/buildings"
            element={
              <AppLayout>
                <BuildingDetailsPage />
              </AppLayout>
            }
          />

          {/* Grid Operations & Demand Response Analytics */}
          <Route
            path="/analytics"
            element={
              <AppLayout>
                <GridOpsPage />
              </AppLayout>
            }
          />

          {/* Retrofit Roadmap */}
          <Route
            path="/retrofits"
            element={
              <AppLayout>
                <RetrofitsPage />
              </AppLayout>
            }
          />

          {/* Equipment Diagnostics Catalog */}
          <Route
            path="/equipment"
            element={
              <AppLayout>
                <EquipmentPage />
              </AppLayout>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </BuildingProvider>
  );
}

export default App;
