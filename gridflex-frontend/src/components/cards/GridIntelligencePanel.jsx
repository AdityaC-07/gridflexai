import React from 'react';
import { Cpu, AlertTriangle, ShieldCheck, Zap, Layers } from 'lucide-react';
import { useGridState } from '../../context/GridStateContext';

export function GridIntelligencePanel() {
  const { feederState, isCloudEvent, scenarioFeeder } = useGridState();

  // Scenario overlay (labeled in the panel header): gap/stress/risk/strategy
  // come from the shared scenario definition while active; flexibility pool
  // stays live (the API reports the same enrolled assets).
  const S = scenarioFeeder || null;
  const stressIndex = S?.stress_index ?? feederState?.stress_index ?? 12.4;
  const riskLevel = S?.risk_level ?? feederState?.risk_level ?? 'LOW';
  const netGapKw = S?.net_gap_kw ?? feederState?.net_gap_kw ?? 0.0;
  const peakGapKw = S?.peak_gap_next_4h_kw ?? feederState?.peak_gap_next_4h_kw ?? 0.0;
  const flexAvailableKw = feederState?.total_flexible_kw ?? 127.5;
  const recommendedAction = S?.recommended_action ?? feederState?.recommended_action ?? 'MONITOR';

  const getRiskColor = (level) => {
    switch (level) {
      case 'LOW': return { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' };
      case 'MEDIUM': return { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' };
      case 'HIGH': return { bg: '#FEF2F2', text: '#DC2626', border: '#FCA5A5' };
      case 'CRITICAL': return { bg: '#7F1D1D', text: '#FFFFFF', border: '#991B1B' };
      default: return { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' };
    }
  };

  const riskStyle = getRiskColor(riskLevel);

  return (
    <div className="ops-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="ops-panel-header">
        <div className="ops-panel-title">
          <Cpu size={16} color="#0284C7" />
          <span>Grid Intelligence</span>
        </div>
        <span className="tech-tag">{S ? 'SCENARIO VALUES' : 'REALTIME EVALUATION'}</span>
      </div>

      <div className="ops-panel-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Risk Level Badge */}
        <div style={{
          backgroundColor: riskStyle.bg,
          border: `1px solid ${riskStyle.border}`,
          borderRadius: '6px',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: riskStyle.text, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              RELIABILITY RISK STATE
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: riskStyle.text, marginTop: '2px' }}>
              {riskLevel} RISK
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.65rem', color: '#64748B' }}>STRESS INDEX</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'monospace', color: '#0F172A' }}>
              {stressIndex} <span style={{ fontSize: '0.7rem', color: '#64748B' }}>/ 100</span>
            </div>
          </div>
        </div>

        {/* Telemetry Interpretation Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ backgroundColor: '#F8FAFC', padding: '10px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.675rem', color: '#64748B', fontWeight: 600 }}>CURRENT ENERGY GAP</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'monospace', color: netGapKw > 0 ? '#DC2626' : '#059669' }}>
              {netGapKw} kW
            </div>
          </div>

          <div style={{ backgroundColor: '#F8FAFC', padding: '10px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.675rem', color: '#64748B', fontWeight: 600 }}>PEAK 4H PROJECTED GAP</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'monospace', color: peakGapKw > 0 ? '#D97706' : '#0F172A' }}>
              {peakGapKw} kW
            </div>
          </div>
        </div>

        {/* Resource Capacity */}
        <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.04em', marginBottom: '8px' }}>
            FLEXIBILITY RESOURCES AVAILABLE
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.775rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
              <span>Total Flexible Demand Pool:</span>
              <strong style={{ fontFamily: 'monospace', color: '#0F172A' }}>{flexAvailableKw} kW</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
              <span>Water Heaters (Shiftable 3h):</span>
              <span style={{ fontFamily: 'monospace' }}>60.0 kW (30 hh)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
              <span>Non-Essential AC (Shiftable 2h):</span>
              <span style={{ fontFamily: 'monospace' }}>37.5 kW (25 hh)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
              <span>EV Charging (Shiftable 4h):</span>
              <span style={{ fontFamily: 'monospace' }}>30.0 kW (10 hh)</span>
            </div>
          </div>
        </div>

        {/* Recommended Action Pill */}
        <div style={{ marginTop: 'auto', borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
          <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 600, marginBottom: '4px' }}>
            RECOMMENDED STRATEGY
          </div>
          <div style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            fontFamily: 'monospace',
            padding: '6px 10px',
            borderRadius: '4px',
            backgroundColor: isCloudEvent ? '#FEF3C7' : '#F1F5F9',
            color: isCloudEvent ? '#B45309' : '#334155',
            border: isCloudEvent ? '1px solid #FDE68A' : '1px solid #CBD5E1'
          }}>
            {recommendedAction.replace(/_/g, ' ')}
          </div>
        </div>
      </div>
    </div>
  );
}
