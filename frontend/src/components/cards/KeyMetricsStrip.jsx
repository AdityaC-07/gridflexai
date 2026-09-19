import React from 'react';
import { Sun, Zap, BatteryCharging, ShieldAlert, ArrowUpRight, ArrowDownRight, AlertOctagon } from 'lucide-react';
import { useGridState } from '../../context/GridStateContext';

export function KeyMetricsStrip() {
  const { feederState, isCloudEvent, scenarioFeeder } = useGridState();

  // While the frontend-local scenario is active, demand/solar/gap/stress are
  // scenario values from the shared scenario definition (labeled SCENARIO on
  // each overlaid card). Battery SOC stays live — the scenario does not move it.
  const S = scenarioFeeder || null;
  const solarKw = S?.solar_kw ?? feederState?.solar_kw ?? 118.0;
  const demandKw = S?.demand_kw ?? feederState?.demand_kw ?? 162.0;
  const batterySoc = feederState?.battery_soc_pct ?? 76.0;
  const netGapKw = S?.net_gap_kw ?? feederState?.net_gap_kw ?? 0.0;
  const riskLevel = S?.risk_level ?? feederState?.risk_level ?? 'LOW';
  const stressIndex = S?.stress_index ?? feederState?.stress_index ?? 12.4;
  const gridImportKw = S?.grid_import_kw ?? feederState?.grid_import_kw ?? 44;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '16px',
      marginBottom: '20px'
    }}>
      {/* 1. Solar Generation Metric */}
      <div className="ops-panel" style={{
        padding: '16px',
        borderTop: isCloudEvent ? '3px solid #D97706' : '3px solid #F59E0B',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.725rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.04em' }}>
            SOLAR GENERATION
          </span>
          <div style={{
            width: '26px', height: '26px', borderRadius: '4px',
            backgroundColor: isCloudEvent ? '#FEF3C7' : '#FFFBEB',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706'
          }}>
            <Sun size={16} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span style={{ fontSize: '2.1rem', fontWeight: 700, fontFamily: 'monospace', color: isCloudEvent ? '#D97706' : '#0F172A' }}>
            {solarKw}
          </span>
          <span style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 600 }}>kW</span>
          {S && <span className="tech-tag tech-tag-warning">SCENARIO</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '0.75rem' }}>
          {isCloudEvent ? (
            <span style={{ color: '#DC2626', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
              <ArrowDownRight size={14} /> -79% Cloud Degradation
            </span>
          ) : (
            <span style={{ color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
              <ArrowUpRight size={14} /> Peak Daylight Profile
            </span>
          )}
        </div>
      </div>

      {/* 2. Community Demand Metric */}
      <div className="ops-panel" style={{
        padding: '16px',
        borderTop: '3px solid #0284C7'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.725rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.04em' }}>
            COMMUNITY DEMAND
          </span>
          <div style={{
            width: '26px', height: '26px', borderRadius: '4px',
            backgroundColor: '#F0F9FF',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7'
          }}>
            <Zap size={16} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span style={{ fontSize: '2.1rem', fontWeight: 700, fontFamily: 'monospace', color: '#0F172A' }}>
            {demandKw}
          </span>
          <span style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 600 }}>kW</span>
          {S && <span className="tech-tag tech-tag-warning">SCENARIO</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '0.75rem', color: '#64748B' }}>
          <span>Peak cap: 175 kW</span>
          <span>·</span>
          <span>Import: {gridImportKw} kW{S ? ' (scenario)' : ''}</span>
        </div>
      </div>

      {/* 3. Battery SOC Metric (Visual Mini Fill) */}
      <div className="ops-panel" style={{
        padding: '16px',
        borderTop: '3px solid #9333EA'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.725rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.04em' }}>
            COMMUNITY BATTERY
          </span>
          <div style={{
            width: '26px', height: '26px', borderRadius: '4px',
            backgroundColor: '#F3E8FF',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333EA'
          }}>
            <BatteryCharging size={16} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span style={{ fontSize: '2.1rem', fontWeight: 700, fontFamily: 'monospace', color: '#0F172A' }}>
            {batterySoc}%
          </span>
          <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 500 }}>
            ({feederState?.battery_available_kwh ?? 112} kWh avail)
          </span>
        </div>
        {/* Progress Bar with 20% Reserve Line */}
        <div style={{ marginTop: '8px', position: 'relative', height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{
            width: `${batterySoc}%`,
            height: '100%',
            backgroundColor: '#9333EA',
            borderRadius: '3px',
            transition: 'width 300ms ease'
          }} />
          {/* Reserve Threshold Line */}
          <div style={{
            position: 'absolute',
            left: '20%',
            top: 0,
            bottom: 0,
            width: '2px',
            backgroundColor: '#DC2626',
            zIndex: 2
          }} title="20% Safety Reserve Threshold" />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.65rem', color: '#94A3B8' }}>
          <span style={{ color: '#DC2626', fontWeight: 600 }}>Reserve 20%</span>
          <span>100% (200 kWh)</span>
        </div>
      </div>

      {/* 4. Feeder Risk & Energy Gap Status */}
      <div className="ops-panel" style={{
        padding: '16px',
        borderTop: isCloudEvent ? '3px solid #DC2626' : '3px solid #059669',
        backgroundColor: isCloudEvent ? '#FEF2F2' : '#FFFFFF'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.725rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.04em' }}>
            SYSTEM HEALTH & GAP
          </span>
          <div style={{
            width: '26px', height: '26px', borderRadius: '4px',
            backgroundColor: isCloudEvent ? '#FEE2E2' : '#ECFDF5',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: isCloudEvent ? '#DC2626' : '#059669'
          }}>
            {isCloudEvent ? <AlertOctagon size={16} /> : <ShieldAlert size={16} />}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span className={`tech-tag ${isCloudEvent ? 'tech-tag-critical' : 'tech-tag-ok'}`} style={{ fontSize: '0.9rem', padding: '2px 8px' }}>
            {riskLevel} RISK
          </span>
          {S && <span className="tech-tag tech-tag-warning">SCENARIO</span>}
          <span style={{ fontSize: '0.8rem', color: '#64748B', fontFamily: 'monospace' }}>
            Stress: {stressIndex}/100
          </span>
        </div>

        <div style={{ marginTop: '8px', fontSize: '0.775rem' }}>
          {isCloudEvent ? (
            <div style={{ color: '#991B1B', fontWeight: 600 }}>
              Energy Gap: <span style={{ fontFamily: 'monospace', fontSize: '0.95rem' }}>{netGapKw} kW</span>
            </div>
          ) : (
            <div style={{ color: '#065F46', fontWeight: 600 }}>
              Grid Balanced (0 kW Gap)
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
