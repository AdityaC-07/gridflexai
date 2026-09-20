import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { BuildingProvider } from './context/BuildingContext';
import { GridStateProvider } from './context/GridStateContext';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { BuildingDetailsPage } from './pages/BuildingDetailsPage';
import { GridOpsPage } from './pages/GridOpsPage';
import { RetrofitsPage } from './pages/RetrofitsPage';
import { EquipmentPage } from './pages/EquipmentPage';
import { OperatorDashboard } from './pages/OperatorDashboard';
import { SimulationPage } from './pages/SimulationPage';
import { ReliabilityPage } from './pages/ReliabilityPage';
import { DiscomDashboard } from './pages/DiscomDashboard';
import { ResidentView } from './pages/ResidentView';

export function App() {
  return (
    <BuildingProvider>
      {/* GridStateProvider wraps the whole app so any page can access live grid state */}
      <GridStateProvider>
        <Router>
          <Routes>
            {/* ── Landing (no sidebar/topbar) ──────────────────────────── */}
            <Route
              path="/"
              element={
                <AppLayout showHeader={false}>
                  <LandingPage />
                </AppLayout>
              }
            />

            {/* ── Building Portfolio Dashboard ─────────────────────────── */}
            <Route
              path="/dashboard"
              element={
                <AppLayout>
                  <DashboardPage />
                </AppLayout>
              }
            />

            {/* ── Building Detail ──────────────────────────────────────── */}
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

            {/* ── Grid Operations & Demand Response Analytics ──────────── */}
            <Route
              path="/analytics"
              element={
                <AppLayout>
                  <GridOpsPage />
                </AppLayout>
              }
            />

            {/* ── Retrofit Roadmap ─────────────────────────────────────── */}
            <Route
              path="/retrofits"
              element={
                <AppLayout>
                  <RetrofitsPage />
                </AppLayout>
              }
            />

            {/* ── Equipment Diagnostics ────────────────────────────────── */}
            <Route
              path="/equipment"
              element={
                <AppLayout>
                  <EquipmentPage />
                </AppLayout>
              }
            />

            {/* ── Grid / Reliability Operator Console ─────────────────── */}
            <Route
              path="/operator"
              element={
                <AppLayout>
                  <OperatorDashboard />
                </AppLayout>
              }
            />

            {/* ── Cloud Event Simulation ───────────────────────────────── */}
            <Route
              path="/simulation"
              element={
                <AppLayout>
                  <SimulationPage />
                </AppLayout>
              }
            />

            {/* ── Reliability Deep-Dive ────────────────────────────────── */}
            <Route
              path="/reliability"
              element={
                <AppLayout>
                  <ReliabilityPage />
                </AppLayout>
              }
            />

            {/* ── DISCOM Executive Dashboard ───────────────────────────── */}
            <Route
              path="/discom"
              element={
                <AppLayout>
                  <DiscomDashboard />
                </AppLayout>
              }
            />

            {/* ── Resident / Consumer View ─────────────────────────────── */}
            <Route
              path="/resident"
              element={
                <AppLayout showHeader={false}>
                  <ResidentView />
                </AppLayout>
              }
            />

            {/* ── Fallback ─────────────────────────────────────────────── */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </GridStateProvider>
    </BuildingProvider>
  );
}

export default App;
