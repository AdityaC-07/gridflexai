import React, { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import { getReliabilityMetrics } from '../api/reliability';
import { useBuildingContext } from '../context/BuildingContext';

export function ReliabilityPage() {
  const { theme } = useBuildingContext();
  const isLight = theme === 'light';
  const [data, setData] = useState(null);

  useEffect(() => {
    async function load() {
      const res = await getReliabilityMetrics('F01');
      setData(res.data);
    }
    load();
  }, []);

  const pickNum = (...vals) => {
    for (const v of vals) {
      if (typeof v === 'number' && Number.isFinite(v)) return v;
    }
    return null;
  };
  const fmt = (v, suffix = '') => (v == null ? '—' : `${v}${suffix}`);

  const baseline = {
    unserved_kwh: pickNum(data?.baseline?.unserved_kwh, data?.baseline_unserved_energy_kwh),
    critical_interruptions: pickNum(data?.baseline?.critical_interruptions, data?.critical_load_interruptions_baseline),
    reliability_pct: pickNum(data?.baseline?.reliability_pct),
  };
  const gridflex = {
    unserved_kwh: pickNum(data?.gridflex?.unserved_kwh, data?.gridflex_unserved_energy_kwh),
    critical_interruptions: pickNum(data?.gridflex?.critical_interruptions, data?.critical_load_interruptions_gridflex),
    uptime_pct: pickNum(data?.gridflex?.reliability_pct, data?.critical_load_uptime_gridflex_pct),
  };
  const interruptionsAvoided = pickNum(
    data?.impact?.critical_interruptions_avoided,
    baseline.critical_interruptions != null && gridflex.critical_interruptions != null
      ? baseline.critical_interruptions - gridflex.critical_interruptions
      : null
  );
  const impact = {
    unserved_energy_avoided_kwh: pickNum(data?.impact?.unserved_energy_avoided_kwh, data?.unserved_energy_avoided_kwh),
    reliability_improvement_pct: pickNum(data?.impact?.reliability_improvement_pct, data?.reliability_gain_pct),
    critical_interruptions_avoided: interruptionsAvoided,
  };
  const totalDemand = pickNum(data?.total_demand_kwh);

  // Theme-aware color tokens
  const bg       = isLight ? '#FFFFFF' : '#111111';
  const bgPage   = isLight ? '#F4F7EF' : '#0F0F0F';
  const border   = isLight ? '#E2E8DC' : '#1E1E1E';
  const textPri  = isLight ? '#0F172A' : '#F5F1E8';
  const textSec  = isLight ? '#475569' : '#94A3B8';
  const textDim  = isLight ? '#64748B' : '#64748B';
  const bgStripe = isLight ? '#F8FAFC' : '#161616';
  const borderStripe = isLight ? '#E2E8F0' : '#242424';

  return (
    <div style={{ color: textPri }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck size={24} color="#059669" />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: textPri }}>
            Feeder F01 Reliability &amp; Performance Analysis
          </h2>
        </div>
        <p style={{ fontSize: '0.875rem', color: textDim, marginTop: '2px' }}>
          Quantified Grid Reliability Metrics · 24-Hour Operational Simulation (Dharavi North Feeder)
        </p>
        <div style={{ marginTop: '8px' }}>
          <span className="tech-tag tech-tag-blue">LIVE API METRICS · FEEDER F01</span>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>

        <div style={{ backgroundColor: bg, border: `1px solid ${border}`, borderTop: '3px solid #0284C7', borderRadius: '6px', padding: '16px' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: textDim }}>TOTAL 24H DEMAND</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'monospace', color: textPri, marginTop: '4px' }}>
            {fmt(totalDemand)} <span style={{ fontSize: '0.8rem', color: textDim }}>kWh</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: textDim, marginTop: '4px' }}>
            {totalDemand == null ? 'Live total unavailable for this window' : 'Dharavi North Feeder F01'}
          </div>
        </div>

        <div style={{ backgroundColor: bg, border: `1px solid ${border}`, borderTop: '3px solid #DC2626', borderRadius: '6px', padding: '16px' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: textDim }}>BASELINE UNSERVED</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'monospace', color: '#DC2626', marginTop: '4px' }}>
            {fmt(baseline.unserved_kwh)} <span style={{ fontSize: '0.8rem', color: textDim }}>kWh</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: isLight ? '#991B1B' : '#FCA5A5', marginTop: '4px' }}>
            {baseline.reliability_pct != null
              ? `${baseline.reliability_pct}% Baseline Reliability`
              : `${fmt(baseline.critical_interruptions)} baseline critical interruptions`}
          </div>
        </div>

        <div style={{ backgroundColor: bg, border: `1px solid ${border}`, borderTop: '3px solid #059669', borderRadius: '6px', padding: '16px' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: textDim }}>GRIDFLEX UNSERVED</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'monospace', color: '#059669', marginTop: '4px' }}>
            {fmt(gridflex.unserved_kwh)} <span style={{ fontSize: '0.8rem', color: textDim }}>kWh</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '4px' }}>
            {gridflex.uptime_pct != null ? `${gridflex.uptime_pct}% critical-load uptime` : 'Critical-load outcome unavailable'}
          </div>
        </div>

        <div style={{
          backgroundColor: isLight ? '#F3E8FF' : '#1A0F2E',
          border: isLight ? '1px solid #D8B4FE' : '1px solid #3B1F6A',
          borderTop: '3px solid #9333EA',
          borderRadius: '6px', padding: '16px',
        }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: isLight ? '#6B21A8' : '#C084FC' }}>ENERGY AVOIDED</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'monospace', color: isLight ? '#7E22CE' : '#A855F7', marginTop: '4px' }}>
            {fmt(impact.unserved_energy_avoided_kwh)} <span style={{ fontSize: '0.8rem', color: isLight ? '#6B21A8' : '#C084FC' }}>kWh</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: isLight ? '#7E22CE' : '#C084FC', marginTop: '4px' }}>
            {impact.reliability_improvement_pct != null ? `${impact.reliability_improvement_pct}% reliability gain` : 'Improvement unavailable'}
          </div>
        </div>
      </div>

      {/* Detailed Analysis Panel */}
      <div style={{ backgroundColor: bg, border: `1px solid ${border}`, borderRadius: '6px', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: textPri }}>
            Key Operational Outcomes &amp; Safety Guarantees
          </h3>
          <span className="tech-tag tech-tag-amber">DEMO SNAPSHOT · REFERENCE SCENARIO</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ backgroundColor: bgStripe, padding: '16px', borderRadius: '6px', border: `1px solid ${borderStripe}` }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: textPri, marginBottom: '8px' }}>
              Critical Load Protection
            </h4>
            <p style={{ fontSize: '0.8rem', color: textSec, lineHeight: 1.5 }}>
              Under baseline operation, severe cloud events trigger
              {' '}<strong style={{ color: textPri }}>{fmt(baseline.critical_interruptions)}</strong> critical load shedding interruptions.
              With GridFlex optimization,
              {' '}<strong style={{ color: '#059669' }}>{fmt(gridflex.critical_interruptions, ' interruptions')} recorded</strong> — critical loads
              remain continuous and protected at all times.
            </p>
          </div>

          <div style={{ backgroundColor: bgStripe, padding: '16px', borderRadius: '6px', border: `1px solid ${borderStripe}` }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: textPri, marginBottom: '8px' }}>
              Battery &amp; Flexibility Co-Optimization
            </h4>
            <p style={{ fontSize: '0.8rem', color: textSec, lineHeight: 1.5 }}>
              GridFlex reduced unserved energy from
              {' '}<strong style={{ color: '#DC2626' }}>{fmt(baseline.unserved_kwh)} kWh</strong> (baseline) to
              {' '}<strong style={{ color: '#059669' }}>{fmt(gridflex.unserved_kwh)} kWh</strong> — a
              {' '}<strong style={{ color: textPri }}>{fmt(impact.reliability_improvement_pct)}%</strong> reliability improvement.
              Community battery dispatch combined with flexible load shifting (water heaters, EV chargers) bridges energy gaps while maintaining a 20% safety reserve.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
