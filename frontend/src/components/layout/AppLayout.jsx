import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { AnalysisLoadingModal } from '../modals/AnalysisLoadingModal';
import { AnalysisCompleteModal } from '../modals/AnalysisCompleteModal';
import { AnomalyDetailModal } from '../modals/AnomalyDetailModal';
import { useBuildingContext } from '../../context/BuildingContext';

export function AppLayout({ children, showHeader = true }) {
  const { theme } = useBuildingContext();

  if (!showHeader) {
    // Full width layout for Landing Page
    return (
      <div data-theme={theme} style={{ width: '100%', minHeight: '100vh', backgroundColor: theme === 'light' ? '#F4F7EF' : '#0F0F0F' }}>
        {children}
        <AnalysisLoadingModal />
        <AnalysisCompleteModal />
        <AnomalyDetailModal />
      </div>
    );
  }

  return (
    <div data-theme={theme} style={{ display: 'flex', minHeight: '100vh', backgroundColor: theme === 'light' ? '#F4F7EF' : '#0F0F0F' }}>
      <Sidebar />
      <Topbar />
      <main
        style={{
          marginLeft: '240px',
          marginTop: '60px',
          flex: 1,
          minHeight: 'calc(100vh - 60px)',
          backgroundColor: theme === 'light' ? '#F4F7EF' : '#0F0F0F',
          padding: '28px 32px 60px 32px',
        }}
      >
        {children}
      </main>

      {/* Global Application Modals */}
      <AnalysisLoadingModal />
      <AnalysisCompleteModal />
      <AnomalyDetailModal />
    </div>
  );
}
