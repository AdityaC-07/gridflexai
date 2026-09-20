import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ShieldCheck, AlertTriangle, Zap, ExternalLink } from 'lucide-react';
import { getReliabilityMetrics } from '../api/reliability';
import { getFeeders } from '../api/feeder';
import { useBuildingContext } from '../context/BuildingContext';

export function DiscomDashboard() {
  const navigate = useNavigate();
  const { theme } = useBuildingContext();
  const isLight = theme === 'light';

  const [metrics, setMetrics] = useState(null);
  const [feeders, setFeeders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Theme tokens
  const bg        = isLight ? '#FFFFFF' : '#111111';
  const border    = isLight ? '#E2E8DC' : '#1E1E1E';
  const borderMid = isLight ? '#E2E8F0' : '#242424';
  const textPri   = isLight ? '#0F172A' : '#F5F1E8';
  const textSec   = isLight ? '#475569' : '#94A3B8';
  const textDim   = isLight ? '#64748B' : '#64748B';
  const bgStripe  = isLight ? '#F8FAFC' : '#161616';
  const bgHead    = isLight ? '#F8FAFC' : '#0A0A0A';
  const bgRowAlt  = isLight ? '#F0F9FF' : '#0D1B2A';

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
          ? entry.reliability : null,
      };
    });
  }

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
          getFeeders(),
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
    reliability_pct:       pickNumber(metrics?.baseline?.reliability_pct, metrics?.supply_availability_baseline_pct),
    unserved_kwh:          pickNumber(metrics?.baseline?.unserved_kwh, metrics?.baseline_unserved_energy_kwh),
    critical_interruptions: pickNumber(metrics?.baseline?.critical_interruptions, metrics?.critical_load_interruptions_baseline),
  };
  const gridflex = {
    reliability_pct:       pickNumber(metrics?.gridflex?.reliability_pct, metrics?.supply_availability_gridflex_pct, metrics?.critical_load_uptime_gridflex_pct),
    unserved_kwh:          pickNumber(metrics?.gridflex?.unserved_kwh, metrics?.gridflex_unserved_energy_kwh),
    critical_interruptions: pickNumber(metrics?.gridflex?.critical_interruptions, metrics?.critical_load_interruptions_gridflex),
  };
  const interruptionsAvoided = pickNumber(
    metrics?.impact?.critical_interruptions_avoided,
    baseline.critical_interruptions != null && gridflex.critical_interruptions != null
      ? baseline.critical_interruptions - gridflex.critical_interruptions : null
  );
  const impact = {
    reliability_improvement_pct: pickNumber(metrics?.impact?.reliability_improvement_pct, metrics?.reliability_gain_pct),
    unserved_energy_avoided_kwh: pickNumber(metrics?.impact?.unserved_energy_avoided_kwh, metrics?.unserved_energy_avoided_kwh),
    critical_interruptions_avoided: interruptionsAvoided,
  };
  const fmt = (v, suffix = '') => (v == null ? '—' : `${v}${suffix}`);

  return (
    <div style={{ color: textPri }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Building2 size={24} color={isLight ? '#0284C7' : '#E89B3C'} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: textPri }}>
            DISCOM Executive Reliability Dashboard
          </h2>
        </div>
        <p style={{ fontSize: '0.875rem', color: textDim, marginTop: '2px' }}>
          Distribution Company Operational Oversight &amp; System Reliability Benchmarks (Feeder F01 Dharavi North)
        </p>
      </div>

      {/* Hero Reliability Impact Comparison */}
      <div style={{
        backgroundColor: bg,
        border: `1px solid ${border}`,
        borderLeft: `5px solid ${isLight ? '#0284C7' : '#E89B3C'}`,
        borderRadius: '6px',
        padding: '24px',
        marginBottom: '28px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: textDim, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            24-HOUR SIMULATION RELIABILITY PERFORMANCE
          </span>
          <span className="tech-tag tech-tag-ok" style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
            {impact.reliability_improvement_pct == null ? 'RELIABILITY IMPACT' : `+${impact.reliability_improvement_pct}% RELIABILITY GAIN`}
          </span>
        </div>

        {/* Side-by-side comparison */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 1fr', gap: '16px', alignItems: 'center' }}>

          {/* Baseline card */}
          <div style={{
            backgroundColor: isLight ? '#FEF2F2' : '#1A0808',
            border: isLight ? '1px solid #FCA5A5' : '1px solid #7F1D1D',
            borderRadius: '8px', padding: '20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isLight ? '#991B1B' : '#FCA5A5', letterSpacing: '0.05em' }}>
                UNMANAGED BASELINE
              </span>
              <AlertTriangle size={18} color="#DC2626" />
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'monospace', color: '#DC2626', marginTop: '6px' }}>
              {fmt(baseline.reliability_pct, '%')}
            </div>
            <div style={{ fontSize: '0.8rem', color: isLight ? '#7F1D1D' : '#FCA5A5', fontWeight: 600 }}>Feeder Reliability Score</div>
            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: isLight ? '1px solid #FCA5A5' : '1px solid #7F1D1D', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: isLight ? '#991B1B' : '#FCA5A5' }}>
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

          {/* VS divider */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              backgroundColor: isLight ? '#0284C7' : '#D4841A',
              color: '#FFFFFF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 4px auto', fontWeight: 700, fontSize: '0.85rem',
            }}>
              VS
            </div>
            <span style={{ fontSize: '0.7rem', color: textDim, fontWeight: 600 }}>OPTIMIZED</span>
          </div>

          {/* GridFlex card */}
          <div style={{
            backgroundColor: isLight ? '#ECFDF5' : '#071410',
            border: isLight ? '1px solid #A7F3D0' : '1px solid #064E3B',
            borderRadius: '8px', padding: '20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isLight ? '#065F46' : '#34D399', letterSpacing: '0.05em' }}>
                GRIDFLEX AI OPTIMIZED
              </span>
              <ShieldCheck size={20} color="#059669" />
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'monospace', color: '#059669', marginTop: '6px' }}>
              {fmt(gridflex.reliability_pct, '%')}
            </div>
            <div style={{ fontSize: '0.8rem', color: isLight ? '#047857' : '#6EE7B7', fontWeight: 600 }}>Feeder Reliability Score</div>
            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: isLight ? '1px solid #A7F3D0' : '1px solid #064E3B', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: isLight ? '#065F46' : '#6EE7B7' }}>
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

        {/* Impact summary row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '20px', paddingTop: '16px', borderTop: `1px solid ${borderMid}` }}>
          {[
            { label: 'UNSERVED ENERGY AVOIDED', value: `${fmt(impact.unserved_energy_avoided_kwh)} kWh`, color: isLight ? '#0284C7' : '#E89B3C' },
            { label: 'CRITICAL OUTAGES PREVENTED', value: `${fmt(impact.critical_interruptions_avoided)} Critical Events`, color: '#059669' },
            { label: 'RELIABILITY MARGIN IMPROVEMENT', value: impact.reliability_improvement_pct == null ? '—' : `+${impact.reliability_improvement_pct}%`, color: '#D97706' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ backgroundColor: bgStripe, padding: '12px', borderRadius: '6px', border: `1px solid ${borderMid}` }}>
              <div style={{ fontSize: '0.7rem', color: textDim, fontWeight: 600 }}>{label}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color, fontFamily: 'monospace', marginTop: '2px' }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Feeder Registry Table */}
      <div style={{ backgroundColor: bg, border: `1px solid ${border}`, borderRadius: '6px', overflow: 'hidden' }}>
        {/* Table header bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px',
          backgroundColor: bgHead,
          borderBottom: `1px solid ${borderMid}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 700, color: textSec, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <Zap size={16} color={isLight ? '#0284C7' : '#E89B3C'} />
            <span>DISCOM Feeder Registry &amp; Reliability Overview</span>
          </div>
          <span className="tech-tag">{feeders.length} FEEDERS MONITORED</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: bgHead, borderBottom: `1px solid ${borderMid}`, color: textSec }}>
                {['FEEDER ID', 'NAME / ZONE', 'OPERATIONAL STATUS', 'RELIABILITY SCORE', 'DATA MODE', 'ACTION'].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {feeders.map((f, i) => {
                const isPrimary = f.feeder_id === 'F01';
                const rowScore = (isPrimary && f.reliability == null) ? gridflex.reliability_pct : f.reliability;
                return (
                  <tr key={f.feeder_id || i} style={{
                    borderBottom: `1px solid ${borderMid}`,
                    backgroundColor: isPrimary ? bgRowAlt : 'transparent',
                  }}>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 700, color: isLight ? '#0284C7' : '#E89B3C' }}>
                      {f.feeder_id}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: textPri }}>
                      {f.name} {isPrimary && <span style={{ fontSize: '0.7rem', color: isLight ? '#0284C7' : '#94A3B8' }}>(Primary Demo)</span>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="tech-tag tech-tag-ok">{f.status ?? 'UNKNOWN'}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 700, color: textPri }}>
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
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          padding: '4px 10px', borderRadius: '4px',
                          backgroundColor: 'transparent',
                          border: `1px solid ${isLight ? '#CBD5E1' : '#3A3A3A'}`,
                          color: textSec, fontSize: '0.725rem', fontWeight: 600,
                          cursor: 'pointer',
                        }}
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
