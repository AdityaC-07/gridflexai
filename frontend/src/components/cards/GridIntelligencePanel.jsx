import React from 'react';
import { Cpu, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useGridState } from '../../context/GridStateContext';
import { useBuildingContext } from '../../context/BuildingContext';

export function GridIntelligencePanel() {
  const { feederState, isCloudEvent, scenarioFeeder } = useGridState();
  const { theme } = useBuildingContext();
  const isLight = theme === 'light';

  const S = scenarioFeeder || null;
  const stressIndex       = S?.stress_index          ?? feederState?.stress_index          ?? 12.4;
  const riskLevel         = S?.risk_level            ?? feederState?.risk_level            ?? 'LOW';
  const netGapKw          = S?.net_gap_kw            ?? feederState?.net_gap_kw            ?? 0.0;
  const peakGapKw         = S?.peak_gap_next_4h_kw  ?? feederState?.peak_gap_next_4h_kw  ?? 0.0;
  const flexAvailableKw   = feederState?.total_flexible_kw ?? 127.5;
  const recommendedAction = S?.recommended_action    ?? feederState?.recommended_action    ?? 'MONITOR';

  // Theme tokens
  const bg     = isLight ? '#FFFFFF' : '#161616';
  const bgDeep = isLight ? '#F8FAFC' : '#111111';
  const bgMid  = isLight ? '#F8FAFC' : '#1A1A1A';
  const border = isLight ? '#E2E8F0' : '#242424';
  const valCol = isLight ? '#0F172A' : '#F5F1E8';
  const dimCol = isLight ? '#64748B' : '#64748B';
  const rowCol = isLight ? '#475569' : '#94A3B8';
  const divCol = isLight ? '#E2E8F0' : '#242424';

  const getRiskStyle = (level) => {
    const map = {
      LOW:      { bg: isLight ? '#ECFDF5'  : 'rgba(5,150,105,0.12)',   text: '#059669', border: isLight ? '#A7F3D0' : 'rgba(5,150,105,0.3)' },
      MEDIUM:   { bg: isLight ? '#FEF3C7'  : 'rgba(217,119,6,0.12)',   text: '#D97706', border: isLight ? '#FDE68A' : 'rgba(217,119,6,0.3)' },
      HIGH:     { bg: isLight ? '#FEF2F2'  : 'rgba(220,38,38,0.12)',   text: '#DC2626', border: isLight ? '#FCA5A5' : 'rgba(220,38,38,0.3)' },
      CRITICAL: { bg: isLight ? '#7F1D1D'  : 'rgba(220,38,38,0.2)',    text: isLight ? '#FFFFFF' : '#FCA5A5', border: '#991B1B' },
    };
    return map[level] || { bg: isLight ? '#F1F5F9' : '#1A1A1A', text: isLight ? '#475569' : '#94A3B8', border: isLight ? '#CBD5E1' : '#2A2A2A' };
  };

  const riskStyle = getRiskStyle(riskLevel);

  const actionBg     = isCloudEvent ? (isLight ? '#FEF3C7' : 'rgba(217,119,6,0.12)') : (isLight ? '#F1F5F9' : '#1A1A1A');
  const actionColor  = isCloudEvent ? '#B45309' : (isLight ? '#334155' : '#94A3B8');
  const actionBorder = isCloudEvent ? (isLight ? '#FDE68A' : 'rgba(217,119,6,0.3)') : (isLight ? '#CBD5E1' : '#2A2A2A');

  return (
    <div className="ops-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="ops-panel-header">
        <div className="ops-panel-title">
          <Cpu size={16} color={isLight ? '#0284C7' : '#E89B3C'} />
          <span>Grid Intelligence</span>
        </div>
        <span className="tech-tag">{S ? 'SCENARIO VALUES' : 'REALTIME EVALUATION'}</span>
      </div>

      <div className="ops-panel-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Risk Level */}
        <div style={{ backgroundColor: riskStyle.bg, border: `1px solid ${riskStyle.border}`, borderRadius: '6px', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: riskStyle.text, letterSpacing: '0.05em', textTransform: 'uppercase' }}>RELIABILITY RISK STATE</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: riskStyle.text, marginTop: '2px' }}>{riskLevel} RISK</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.65rem', color: dimCol }}>STRESS INDEX</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'monospace', color: valCol }}>
              {stressIndex} <span style={{ fontSize: '0.7rem', color: dimCol }}>/ 100</span>
            </div>
          </div>
        </div>

        {/* Gap metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ backgroundColor: bgMid, padding: '10px', borderRadius: '4px', border: `1px solid ${border}` }}>
            <div style={{ fontSize: '0.675rem', color: dimCol, fontWeight: 600 }}>CURRENT ENERGY GAP</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'monospace', color: netGapKw > 0 ? '#DC2626' : '#059669' }}>{netGapKw} kW</div>
          </div>
          <div style={{ backgroundColor: bgMid, padding: '10px', borderRadius: '4px', border: `1px solid ${border}` }}>
            <div style={{ fontSize: '0.675rem', color: dimCol, fontWeight: 600 }}>PEAK 4H PROJECTED GAP</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'monospace', color: peakGapKw > 0 ? '#D97706' : valCol }}>{peakGapKw} kW</div>
          </div>
        </div>

        {/* Flexibility Resources */}
        <div style={{ borderTop: `1px solid ${divCol}`, paddingTop: '12px' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: dimCol, letterSpacing: '0.04em', marginBottom: '8px' }}>FLEXIBILITY RESOURCES AVAILABLE</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.775rem' }}>
            {[
              ['Total Flexible Demand Pool:', `${flexAvailableKw} kW`, valCol],
              ['Water Heaters (Shiftable 3h):', '60.0 kW (30 hh)', null],
              ['Non-Essential AC (Shiftable 2h):', '37.5 kW (25 hh)', null],
              ['EV Charging (Shiftable 4h):', '30.0 kW (10 hh)', null],
            ].map(([label, val, color]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', color: rowCol }}>
                <span>{label}</span>
                <strong style={{ fontFamily: 'monospace', color: color || undefined }}>{val}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Action */}
        <div style={{ marginTop: 'auto', borderTop: `1px solid ${divCol}`, paddingTop: '12px' }}>
          <div style={{ fontSize: '0.65rem', color: dimCol, fontWeight: 600, marginBottom: '4px' }}>RECOMMENDED STRATEGY</div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, fontFamily: 'monospace', padding: '6px 10px', borderRadius: '4px', backgroundColor: actionBg, color: actionColor, border: `1px solid ${actionBorder}` }}>
            {recommendedAction.replace(/_/g, ' ')}
          </div>
        </div>
      </div>
    </div>
  );
}
