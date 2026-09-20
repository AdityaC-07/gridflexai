import React from 'react';
import { Sun, Zap, BatteryCharging, ShieldAlert, ArrowUpRight, ArrowDownRight, AlertOctagon } from 'lucide-react';
import { useGridState } from '../../context/GridStateContext';
import { useBuildingContext } from '../../context/BuildingContext';

export function KeyMetricsStrip() {
  const { feederState, isCloudEvent, scenarioFeeder } = useGridState();
  const { theme } = useBuildingContext();
  const isLight = theme === 'light';

  const S = scenarioFeeder || null;
  const solarKw    = S?.solar_kw    ?? feederState?.solar_kw    ?? 118.0;
  const demandKw   = S?.demand_kw   ?? feederState?.demand_kw   ?? 162.0;
  const batterySoc = feederState?.battery_soc_pct ?? 80.0;
  const netGapKw   = S?.net_gap_kw  ?? feederState?.net_gap_kw  ?? 0.0;
  const riskLevel  = S?.risk_level  ?? feederState?.risk_level  ?? 'LOW';
  const stressIndex = S?.stress_index ?? feederState?.stress_index ?? 12.4;
  const gridImportKw = S?.grid_import_kw ?? feederState?.grid_import_kw ?? 44;
  const battAvailKwh = feederState?.battery_available_kwh ?? Math.round(batterySoc * 2);

  // Theme tokens
  const bg     = isLight ? '#FFFFFF' : '#161616';
  const border = isLight ? '#E2E8F0' : '#242424';
  const valCol = isLight ? '#0F172A' : '#F5F1E8';
  const dimCol = isLight ? '#64748B' : '#64748B';
  const iconBg = (lightBg, darkBg) => isLight ? lightBg : darkBg;

  const riskBorderColor = {
    LOW: '#059669', MEDIUM: '#D97706', HIGH: '#DC2626', CRITICAL: '#DC2626',
  }[riskLevel] || '#059669';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>

      {/* 1. Solar Generation */}
      <div style={{ background: bg, border: `1px solid ${border}`, borderTop: `3px solid ${isCloudEvent ? '#D97706' : '#F59E0B'}`, borderRadius: '6px', padding: '16px', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.725rem', fontWeight: 700, color: dimCol, letterSpacing: '0.04em' }}>SOLAR GENERATION</span>
          <div style={{ width: '26px', height: '26px', borderRadius: '4px', backgroundColor: iconBg('#FFFBEB', 'rgba(217,119,6,0.15)'), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
            <Sun size={16} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span style={{ fontSize: '2.1rem', fontWeight: 700, fontFamily: 'monospace', color: isCloudEvent ? '#D97706' : valCol }}>{solarKw}</span>
          <span style={{ fontSize: '0.9rem', color: dimCol, fontWeight: 600 }}>kW</span>
          {S && <span className="tech-tag tech-tag-warning">SCENARIO</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '0.75rem' }}>
          {isCloudEvent
            ? <span style={{ color: '#DC2626', fontWeight: 600, display: 'flex', alignItems: 'center' }}><ArrowDownRight size={14} /> -79% Cloud Degradation</span>
            : <span style={{ color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center' }}><ArrowUpRight size={14} /> Peak Daylight Profile</span>}
        </div>
      </div>

      {/* 2. Community Demand */}
      <div style={{ background: bg, border: `1px solid ${border}`, borderTop: '3px solid #0284C7', borderRadius: '6px', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.725rem', fontWeight: 700, color: dimCol, letterSpacing: '0.04em' }}>COMMUNITY DEMAND</span>
          <div style={{ width: '26px', height: '26px', borderRadius: '4px', backgroundColor: iconBg('#F0F9FF', 'rgba(2,132,199,0.15)'), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7' }}>
            <Zap size={16} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span style={{ fontSize: '2.1rem', fontWeight: 700, fontFamily: 'monospace', color: valCol }}>{demandKw}</span>
          <span style={{ fontSize: '0.9rem', color: dimCol, fontWeight: 600 }}>kW</span>
          {S && <span className="tech-tag tech-tag-warning">SCENARIO</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '0.75rem', color: dimCol }}>
          <span>Peak cap: 175 kW</span><span>·</span>
          <span>Import: {gridImportKw} kW{S ? ' (scenario)' : ''}</span>
        </div>
      </div>

      {/* 3. Community Battery */}
      <div style={{ background: bg, border: `1px solid ${border}`, borderTop: '3px solid #9333EA', borderRadius: '6px', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.725rem', fontWeight: 700, color: dimCol, letterSpacing: '0.04em' }}>COMMUNITY BATTERY</span>
          <div style={{ width: '26px', height: '26px', borderRadius: '4px', backgroundColor: iconBg('#F3E8FF', 'rgba(147,51,234,0.15)'), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333EA' }}>
            <BatteryCharging size={16} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span style={{ fontSize: '2.1rem', fontWeight: 700, fontFamily: 'monospace', color: valCol }}>{batterySoc}%</span>
          <span style={{ fontSize: '0.85rem', color: dimCol, fontWeight: 500 }}>({battAvailKwh} kWh avail)</span>
        </div>
        <div style={{ marginTop: '8px', position: 'relative', height: '6px', backgroundColor: isLight ? '#E2E8F0' : '#2A2A2A', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ width: `${batterySoc}%`, height: '100%', backgroundColor: '#9333EA', borderRadius: '3px', transition: 'width 300ms ease' }} />
          <div style={{ position: 'absolute', left: '20%', top: 0, bottom: 0, width: '2px', backgroundColor: '#DC2626', zIndex: 2 }} title="20% Safety Reserve" />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.65rem', color: dimCol }}>
          <span style={{ color: '#DC2626', fontWeight: 600 }}>Reserve 20%</span>
          <span>100% (200 kWh)</span>
        </div>
      </div>

      {/* 4. System Health & Gap */}
      <div style={{
        background: isCloudEvent ? (isLight ? '#FEF2F2' : 'rgba(220,38,38,0.08)') : bg,
        border: `1px solid ${isCloudEvent ? (isLight ? '#FCA5A5' : 'rgba(220,38,38,0.3)') : border}`,
        borderTop: `3px solid ${riskBorderColor}`,
        borderRadius: '6px', padding: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.725rem', fontWeight: 700, color: dimCol, letterSpacing: '0.04em' }}>SYSTEM HEALTH & GAP</span>
          <div style={{ width: '26px', height: '26px', borderRadius: '4px', backgroundColor: isCloudEvent ? (isLight ? '#FEE2E2' : 'rgba(220,38,38,0.15)') : (isLight ? '#ECFDF5' : 'rgba(5,150,105,0.15)'), display: 'flex', alignItems: 'center', justifyContent: 'center', color: isCloudEvent ? '#DC2626' : '#059669' }}>
            {isCloudEvent ? <AlertOctagon size={16} /> : <ShieldAlert size={16} />}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span className={`tech-tag ${isCloudEvent ? 'tech-tag-critical' : 'tech-tag-ok'}`} style={{ fontSize: '0.9rem', padding: '2px 8px' }}>
            {riskLevel} RISK
          </span>
          {S && <span className="tech-tag tech-tag-warning">SCENARIO</span>}
          <span style={{ fontSize: '0.8rem', color: dimCol, fontFamily: 'monospace' }}>Stress: {stressIndex}/100</span>
        </div>
        <div style={{ marginTop: '8px', fontSize: '0.775rem' }}>
          {isCloudEvent
            ? <div style={{ color: '#DC2626', fontWeight: 600 }}>Energy Gap: <span style={{ fontFamily: 'monospace', fontSize: '0.95rem' }}>{netGapKw} kW</span></div>
            : <div style={{ color: '#059669', fontWeight: 600 }}>Grid Balanced (0 kW Gap)</div>}
        </div>
      </div>
    </div>
  );
}
