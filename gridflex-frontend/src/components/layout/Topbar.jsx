import React from 'react';
import { RefreshCw, Database, Radio } from 'lucide-react';
import { useGridState } from '../../context/GridStateContext';

export function Topbar() {
  const { lastUpdated, isUsingMock, isCloudEvent, refreshAll, isLoading } = useGridState();

  const formattedTime = lastUpdated.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <header style={{
      height: '56px',
      backgroundColor: '#FFFFFF',
      borderBottom: '1px solid #E2E8F0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 90
    }}>
      {/* Location & Context */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#0F172A' }}>
          Dharavi North
        </h2>
        <span className="tech-tag tech-tag-blue">
          FEEDER F01
        </span>
        <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
          · Urban Electricity Distribution Network
        </span>
      </div>

      {/* Live Operational Metadata & Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Mock Indicator */}
        {isUsingMock ? (
          <span className="tech-tag tech-tag-amber" style={{ gap: '4px' }}>
            <Database size={12} />
            DEMO / MOCK DATA · Demo Snapshot
          </span>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#475569' }}>
            <span className={isCloudEvent ? "pulse-indicator pulse-indicator-warning" : "pulse-indicator pulse-indicator-ok"} />
            <span style={{ fontWeight: 600, color: isCloudEvent ? '#D97706' : '#059669' }}>
              {isCloudEvent ? 'STRESS EVENT' : 'LIVE API'}
            </span>
            <span style={{ color: '#94A3B8' }}>• 30s refresh</span>
          </div>
        )}

        {/* Timestamp */}
        <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#64748B' }}>
          {isUsingMock ? 'Snapshot: Active Demo' : `Updated: ${formattedTime}`}
        </div>

        {/* Refresh Button */}
        <button
          onClick={() => refreshAll()}
          disabled={isLoading}
          style={{
            background: 'none',
            border: '1px solid #CBD5E1',
            borderRadius: '4px',
            padding: '6px 10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.75rem',
            color: '#475569'
          }}
          title="Force telemetry refresh"
        >
          <RefreshCw size={12} className={isLoading ? 'spin-anim' : ''} />
          <span>Sync</span>
        </button>
      </div>
    </header>
  );
}
