import React, { useState, useEffect } from 'react';
import { ShieldCheck, Zap, BarChart3, TrendingUp, CheckCircle } from 'lucide-react';
import { getReliabilityMetrics } from '../api/reliability';

export function ReliabilityPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    async function load() {
      const res = await getReliabilityMetrics('F01');
      setData(res.data);
    }
    load();
  }, []);

  // Live Data/API returns flat computed fields (baseline_unserved_energy_kwh,
  // reliability_gain_pct, ...); mock fallback returns nested
  // { baseline, gridflex, impact }. Prefer real values from whichever shape is
  // present; render "—" when the API provides nothing. Nothing is hardcoded.
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

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck size={24} color="#059669" />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0F172A' }}>
            Feeder F01 Reliability & Performance Analysis
          </h2>
        </div>
        <p style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '2px' }}>
          Quantified Grid Reliability Metrics · 24-Hour Operational Simulation (Dharavi North Feeder)
        </p>
        <div style={{ marginTop: '8px' }}>
          <span className="tech-tag tech-tag-blue">LIVE API METRICS · FEEDER F01</span>
        </div>
      </div>

      {/* Main Grid Impact Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        
        <div className="ops-panel" style={{ padding: '16px', borderTop: '3px solid #0284C7' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B' }}>TOTAL 24H DEMAND</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'monospace', color: '#0F172A', marginTop: '4px' }}>
            {fmt(totalDemand)} <span style={{ fontSize: '0.8rem', color: '#64748B' }}>kWh</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
            {totalDemand == null ? 'Live total unavailable for this window' : 'Dharavi North Feeder F01'}
          </div>
        </div>

        <div className="ops-panel" style={{ padding: '16px', borderTop: '3px solid #DC2626' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B' }}>BASELINE UNSERVED</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'monospace', color: '#DC2626', marginTop: '4px' }}>
            {fmt(baseline.unserved_kwh)} <span style={{ fontSize: '0.8rem', color: '#64748B' }}>kWh</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#991B1B', marginTop: '4px' }}>
            {baseline.reliability_pct != null
              ? `${baseline.reliability_pct}% Baseline Reliability`
              : `${fmt(baseline.critical_interruptions)} baseline critical interruptions`}
          </div>
        </div>

        <div className="ops-panel" style={{ padding: '16px', borderTop: '3px solid #059669' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B' }}>GRIDFLEX UNSERVED</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'monospace', color: '#059669', marginTop: '4px' }}>
            {fmt(gridflex.unserved_kwh)} <span style={{ fontSize: '0.8rem', color: '#64748B' }}>kWh</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '4px' }}>
            {gridflex.uptime_pct != null ? `${gridflex.uptime_pct}% critical-load uptime` : 'Critical-load outcome unavailable'}
          </div>
        </div>

        <div className="ops-panel" style={{ padding: '16px', borderTop: '3px solid #9333EA', backgroundColor: '#F3E8FF' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6B21A8' }}>ENERGY AVOIDED</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'monospace', color: '#7E22CE', marginTop: '4px' }}>
            {fmt(impact.unserved_energy_avoided_kwh)} <span style={{ fontSize: '0.8rem', color: '#6B21A8' }}>kWh</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#7E22CE', marginTop: '4px' }}>
            {impact.reliability_improvement_pct != null ? `${impact.reliability_improvement_pct}% reliability gain` : 'Improvement unavailable'}
          </div>
        </div>
      </div>

      {/* Detailed Analysis Breakdown Panel */}
      <div className="ops-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>
            Key Operational Outcomes & Safety Guarantees
          </h3>
          <span className="tech-tag tech-tag-amber">DEMO SNAPSHOT · REFERENCE SCENARIO</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
              Critical Load Protection
            </h4>
            <p style={{ fontSize: '0.8rem', color: '#64748B', lineHeight: 1.5 }}>
              Under baseline operation, severe cloud events trigger 3 critical load shedding events (totaling 145 minutes). With GridFlex optimization, 48 kW of critical loads remain continuous and 100% protected.
            </p>
          </div>

          <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
              Battery & Flexibility Co-Optimization
            </h4>
            <p style={{ fontSize: '0.8rem', color: '#64748B', lineHeight: 1.5 }}>
              By pairing 70 kW community battery dispatch with 20 kW of flexible load shifting (water heaters, EV chargers), the peak 80 kW gap is fully bridged while keeping battery SOC at 24.5% (above the 20% safety reserve).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
