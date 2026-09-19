import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ShieldCheck, TrendingUp, AlertTriangle, CheckCircle2, Zap, ExternalLink } from 'lucide-react';
import { getReliabilityMetrics } from '../api/reliability';
import { getFeeders } from '../api/feeder';

export function DiscomDashboard() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [feeders, setFeeders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Live GET /api/v1/feeders returns { feeders: ["F01"] } (object wrapping
  // string IDs); mock fallback returns an array of feeder objects. Normalize
  // both shapes to row objects without inventing operational values.
  function normalizeFeeders(raw) {
    const list = Array.isArray(raw) ? raw : raw?.feeders;
    if (!Array.isArray(list)) return [];
    return list.map((entry) => {
      if (typeof entry === 'string') {
        return { feeder_id: entry, name: entry, status: null, reliability: null };
      }
      return {
        feeder_id: entry?.feeder_id ?? '—',
        name: entry?.name ?? entry?.feeder_id ?? '—',
        status: entry?.status ?? null,
        reliability: typeof entry?.reliability === 'number' && Number.isFinite(entry.reliability)
          ? entry.reliability
          : null,
      };
    });
  }

  // Live GET /api/v1/reliability/{id}/metrics returns flat computed fields
  // (baseline_unserved_energy_kwh, reliability_gain_pct, ...); mock fallback
  // returns nested { baseline, gridflex, impact }. Prefer real values from
  // whichever shape is present; null when the API provides nothing.
  function pickNumber(...vals) {
    for (const v of vals) {
      if (typeof v === 'number' && Number.isFinite(v)) return v;
    }
    return null;
  }

  useEffect(() => {
    async function loadData() {
      try {
        const [relRes, feederRes] = await Promise.all([
          getReliabilityMetrics('F01'),
          getFeeders()
        ]);
        setMetrics(relRes?.data ?? null);
        setFeeders(normalizeFeeders(feederRes?.data));
      } catch (err) {
        console.error('Failed to load DISCOM dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const baseline = {
    reliability_pct: pickNumber(metrics?.baseline?.reliability_pct, metrics?.supply_availability_baseline_pct),
    unserved_kwh: pickNumber(metrics?.baseline?.unserved_kwh, metrics?.baseline_unserved_energy_kwh),
    critical_interruptions: pickNumber(metrics?.baseline?.critical_interruptions, metrics?.critical_load_interruptions_baseline),
  };
  const gridflex = {
    // Live API provides no supply_availability score (null when total demand
    // is unavailable), but it does provide critical_load_uptime_gridflex_pct —
    // the measured GridFlex reliability outcome — which is semantically the
    // correct "reliability score" for the optimized side.
    reliability_pct: pickNumber(metrics?.gridflex?.reliability_pct, metrics?.supply_availability_gridflex_pct, metrics?.critical_load_uptime_gridflex_pct),
    unserved_kwh: pickNumber(metrics?.gridflex?.unserved_kwh, metrics?.gridflex_unserved_energy_kwh),
    critical_interruptions: pickNumber(metrics?.gridflex?.critical_interruptions, metrics?.critical_load_interruptions_gridflex),
  };
  const interruptionsAvoided = pickNumber(
    metrics?.impact?.critical_interruptions_avoided,
    baseline.critical_interruptions != null && gridflex.critical_interruptions != null
      ? baseline.critical_interruptions - gridflex.critical_interruptions
      : null
  );
  const impact = {
    reliability_improvement_pct: pickNumber(metrics?.impact?.reliability_improvement_pct, metrics?.reliability_gain_pct),
    unserved_energy_avoided_kwh: pickNumber(metrics?.impact?.unserved_energy_avoided_kwh, metrics?.unserved_energy_avoided_kwh),
    critical_interruptions_avoided: interruptionsAvoided,
  };

  // Render helper: show "—" when the API provides no value instead of crashing
  // or implying a measurement that was never returned.
  const fmt = (v, suffix = '') => (v == null ? '—' : `${v}${suffix}`);

  return (
    <div>
      {/* Top Section Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Building2 size={24} color="#0284C7" />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0F172A' }}>
            DISCOM Executive Reliability Dashboard
          </h2>
        </div>
        <p style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '2px' }}>
          Distribution Company Operational Oversight & System Reliability Benchmarks (Feeder F01 Dharavi North)
        </p>
      </div>

      {/* Hero Reliability Impact Comparison Banner */}
      <div className="ops-panel" style={{ padding: '24px', marginBottom: '28px', borderLeft: '5px solid #0284C7' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            24-HOUR SIMULATION RELIABILITY PERFORMANCE
          </span>
          <span className="tech-tag tech-tag-ok" style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
            {impact.reliability_improvement_pct == null ? 'RELIABILITY IMPACT' : `+${impact.reliability_improvement_pct}% RELIABILITY GAIN`}
          </span>
        </div>

        {/* Side-by-Side Comparison Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 1fr', gap: '16px', alignItems: 'center' }}>
          
          {/* Card 1: BASELINE (WITHOUT GRIDFLEX) */}
          <div style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: '8px',
            padding: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#991B1B', letterSpacing: '0.05em' }}>
                UNMANAGED BASELINE
              </span>
              <AlertTriangle size={18} color="#DC2626" />
            </div>
            
            <div style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'monospace', color: '#DC2626', marginTop: '6px' }}>
              {fmt(baseline.reliability_pct, '%')}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#7F1D1D', fontWeight: 600 }}>Feeder Reliability Score</div>

            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #FCA5A5', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: '#991B1B' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Unserved Energy:</span>
                <strong style={{ fontFamily: 'monospace' }}>{fmt(baseline.unserved_kwh)} kWh</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Critical Load Interruptions:</span>
                <strong style={{ fontFamily: 'monospace' }}>{fmt(baseline.critical_interruptions)} events</strong>
              </div>
            </div>
          </div>

          {/* Versus Arrow Divider */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              backgroundColor: '#0284C7', color: '#FFFFFF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 4px auto', fontWeight: 700, fontSize: '0.85rem'
            }}>
              VS
            </div>
            <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>OPTIMIZED</span>
          </div>

          {/* Card 2: WITH GRIDFLEX AI */}
          <div style={{
            backgroundColor: '#ECFDF5',
            border: '1px solid #A7F3D0',
            borderRadius: '8px',
            padding: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#065F46', letterSpacing: '0.05em' }}>
                GRIDFLEX AI OPTIMIZED
              </span>
              <ShieldCheck size={20} color="#059669" />
            </div>

            <div style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'monospace', color: '#059669', marginTop: '6px' }}>
              {fmt(gridflex.reliability_pct, '%')}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#047857', fontWeight: 600 }}>Feeder Reliability Score</div>

            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #A7F3D0', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: '#065F46' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Unserved Energy:</span>
                <strong style={{ fontFamily: 'monospace' }}>{fmt(gridflex.unserved_kwh)} kWh</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Critical Load Interruptions:</span>
                <strong style={{ fontFamily: 'monospace', color: '#059669' }}>{fmt(gridflex.critical_interruptions)} events (Protected)</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Quantified Impact Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
          <div style={{ backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>UNSERVED ENERGY AVOIDED</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0284C7', fontFamily: 'monospace', marginTop: '2px' }}>
              {fmt(impact.unserved_energy_avoided_kwh)} kWh
            </div>
          </div>

          <div style={{ backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>CRITICAL OUTAGES PREVENTED</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669', fontFamily: 'monospace', marginTop: '2px' }}>
              {fmt(impact.critical_interruptions_avoided)} Critical Events
            </div>
          </div>

          <div style={{ backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>RELIABILITY MARGIN IMPROVEMENT</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#D97706', fontFamily: 'monospace', marginTop: '2px' }}>
              {impact.reliability_improvement_pct == null ? '—' : `+${impact.reliability_improvement_pct}%`}
            </div>
          </div>
        </div>
      </div>

      {/* DISCOM Feeder Overview Table */}
      <div className="ops-panel" style={{ padding: '0' }}>
        <div className="ops-panel-header">
          <div className="ops-panel-title">
            <Zap size={16} color="#0284C7" />
            <span>DISCOM Feeder Registry & Reliability Overview</span>
          </div>
          <span className="tech-tag">{feeders.length} FEEDERS MONITORED</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
                <th style={{ padding: '12px 16px' }}>FEEDER ID</th>
                <th style={{ padding: '12px 16px' }}>NAME / ZONE</th>
                <th style={{ padding: '12px 16px' }}>OPERATIONAL STATUS</th>
                <th style={{ padding: '12px 16px' }}>RELIABILITY SCORE</th>
                <th style={{ padding: '12px 16px' }}>DATA MODE</th>
                <th style={{ padding: '12px 16px' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {feeders.map((f, i) => {
                const isPrimary = f.feeder_id === 'F01';
                // The live /feeders endpoint carries no per-feeder score, so the
                // primary F01 row binds to the live GridFlex reliability outcome
                // above (critical-load uptime). Anything without a live value
                // renders a bare "—" — never a dangling "%".
                const rowScore = (isPrimary && f.reliability == null) ? gridflex.reliability_pct : f.reliability;
                return (
                  <tr key={f.feeder_id || i} style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: isPrimary ? '#F0F9FF' : 'transparent' }}>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 700, color: '#0284C7' }}>
                      {f.feeder_id}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0F172A' }}>
                      {f.name} {isPrimary && <span style={{ fontSize: '0.7rem', color: '#0284C7' }}>(Primary Demo)</span>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="tech-tag tech-tag-ok">{f.status ?? 'UNKNOWN'}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 700, color: '#0F172A' }}>
                      {rowScore == null ? '—' : `${rowScore}%`}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className={`tech-tag ${isPrimary ? 'tech-tag-blue' : ''}`}>
                        {isPrimary ? 'LIVE TELEMETRY' : 'DEMO SNAPSHOT'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={() => navigate('/operator')}
                        className="ops-btn ops-btn-outline"
                        style={{ fontSize: '0.725rem', padding: '4px 10px', gap: '4px' }}
                      >
                        <span>Open Console</span>
                        <ExternalLink size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
