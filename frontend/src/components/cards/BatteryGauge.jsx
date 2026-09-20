import React from 'react';
import { BatteryCharging, Shield } from 'lucide-react';
import { useGridState } from '../../context/GridStateContext';
import { useBuildingContext } from '../../context/BuildingContext';

export function BatteryGauge() {
  const { feederState, isCloudEvent } = useGridState();
  const { theme } = useBuildingContext();
  const isLight = theme === 'light';

  const soc             = feederState?.battery_soc_pct ?? 80.0;
  const totalCapacityKwh = 200.0;
  const currentKwh      = (soc / 100) * totalCapacityKwh;
  const reserveKwh      = 40.0;
  const usableKwh       = Math.max(0, currentKwh - reserveKwh);

  // Theme tokens
  const bg     = isLight ? '#FAFAFC' : '#1A1A1A';
  const bgMini = isLight ? '#F8FAFC' : '#111111';
  const border = isLight ? '#E2E8F0' : '#242424';
  const valCol = isLight ? '#0F172A' : '#F5F1E8';
  const dimCol = isLight ? '#64748B' : '#64748B';
  const svgShell = isLight ? '#FFFFFF' : '#1E1E1E';
  const svgStroke = isLight ? '#334155' : '#4A4A4A';
  const svgTerm  = isLight ? '#475569' : '#3A3A3A';
  const borderDash = isLight ? '#CBD5E1' : '#2A2A2A';

  return (
    <div className="ops-panel" style={{ padding: '0', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="ops-panel-header">
        <div className="ops-panel-title">
          <BatteryCharging size={16} color="#9333EA" />
          <span>Battery Storage Asset</span>
        </div>
        <span className="tech-tag tech-tag-blue">BESS-F01 · 200 kWh</span>
      </div>

      <div className="ops-panel-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* SVG + Metrics */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', backgroundColor: bg, padding: '16px', borderRadius: '6px', border: `1px solid ${border}` }}>
          {/* SVG Battery */}
          <div style={{ width: '90px', position: 'relative' }}>
            <svg viewBox="0 0 100 180" style={{ width: '100%', height: 'auto', display: 'block' }}>
              <rect x="35" y="0" width="30" height="8" rx="2" fill={svgTerm} />
              <rect x="5" y="8" width="90" height="168" rx="8" fill={svgShell} stroke={svgStroke} strokeWidth="3" />
              <line x1="5" y1="142" x2="95" y2="142" stroke="#DC2626" strokeWidth="2" strokeDasharray="3 3" />
              <rect x="9" y={172 - (soc / 100) * 160} width="82" height={(soc / 100) * 160} rx="4" fill={isCloudEvent ? '#9333EA' : '#7C3AED'} opacity={0.85} />
              <rect x="9" y="142" width="82" height="30" rx="4" fill="#FCA5A5" opacity={0.5} />
            </svg>
          </div>

          {/* Metrics */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.675rem', fontWeight: 700, color: dimCol, letterSpacing: '0.04em' }}>STATE OF CHARGE</div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'monospace', color: valCol, lineHeight: 1 }}>{soc}%</div>
            <div style={{ fontSize: '0.8rem', color: dimCol, marginTop: '4px' }}>Total Energy: <strong style={{ color: valCol }}>{currentKwh.toFixed(0)} kWh</strong></div>
            <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: `1px dashed ${borderDash}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
                <Shield size={14} /> Usable: {usableKwh.toFixed(0)} kWh
              </div>
              <div style={{ fontSize: '0.7rem', color: '#DC2626', marginTop: '2px', fontWeight: 500 }}>20% Reserve: 40 kWh locked</div>
            </div>
          </div>
        </div>

        {/* Dispatch Specs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem' }}>
          <div style={{ backgroundColor: bgMini, padding: '8px 10px', borderRadius: '4px', border: `1px solid ${border}` }}>
            <span style={{ color: dimCol }}>Max Discharge:</span>
            <div style={{ fontWeight: 700, color: valCol, fontFamily: 'monospace' }}>80.0 kW</div>
          </div>
          <div style={{ backgroundColor: bgMini, padding: '8px 10px', borderRadius: '4px', border: `1px solid ${border}` }}>
            <span style={{ color: dimCol }}>Target Dispatch:</span>
            <div style={{ fontWeight: 700, color: '#9333EA', fontFamily: 'monospace' }}>
              {isCloudEvent ? '70.0 kW (2.5h)' : '0.0 kW (Standby)'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
