import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBuildingContext } from '../context/BuildingContext';
import {
  Wrench,
  CheckCircle,
  Check,
  Zap,
  TrendingUp,
  FileText,
  RotateCcw,
  Download,
  ChevronDown,
  Plus,
} from 'lucide-react';

export function RetrofitsPage() {
  const navigate = useNavigate();
  const { retrofits, toggleRetrofitSelection, theme } = useBuildingContext();
  const isLight = theme === 'light';
  const [activeCategory, setActiveCategory] = useState('ALL');

  const selectedCount  = retrofits.filter((r) => r.selected).length;
  const totalCapex     = retrofits.filter((r) => r.selected).reduce((acc, r) => acc + r.capex, 0);
  const totalYield     = retrofits.filter((r) => r.selected).reduce((acc, r) => acc + r.annualYield, 0);
  // Computed KPIs from actual retrofits data
  const allCapex       = retrofits.reduce((acc, r) => acc + r.capex, 0);
  const allYield       = retrofits.reduce((acc, r) => acc + r.annualYield, 0);
  const paybackYears   = allYield > 0 ? (allCapex / allYield).toFixed(1) : '—';
  const roiPct         = allCapex > 0 ? Math.round(((allYield * 10 - allCapex) / allCapex) * 100) : 0;
  // Carbon offset: ~0.82 kg CO2/kWh for Mumbai MSEDCL grid
  const carbonOffset   = (allYield / 1000 * 0.82).toFixed(1);

  // Export capital plan as CSV
  const exportPlan = () => {
    const rows = [
      ['Retrofit', 'Category', 'CAPEX (INR)', 'Annual Yield (INR)', 'Payback', 'Selected'],
      ...retrofits.map(r => [r.title, r.category, r.capex, r.annualYield, r.payback, r.selected ? 'Yes' : 'No']),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'gridflex_capital_plan_f01.csv';
    a.click();
  };

  const filteredRetrofits = retrofits.filter((r) => {
    if (activeCategory === 'ALL') return true;
    if (activeCategory === 'SMART CONTROLS') return r.category === 'SMART CONTROLS';
    if (activeCategory === 'HVAC EQUIPMENT') return r.category === 'HVAC EQUIPMENT';
    if (activeCategory === 'LIGHTING') return r.category === 'LIGHTING';
    return true;
  });

  return (
    <div style={{ position: 'relative', paddingBottom: '100px' }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: isLight ? '#5C6B61' : '#64748B' }}>
          <span>Dashboard</span>
          <span>/</span>
          <span>Buildings</span>
          <span>/</span>
          <span>Dharavi North F01</span>
          <span>/</span>
          <span style={{ color: isLight ? '#0D472B' : '#F5F1E8', fontWeight: 600 }}>Retrofits</span>
        </div>
      </div>

      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '28px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <h1
              style={{
                fontFamily: 'Space Grotesk',
                fontSize: '2.5rem',
                fontWeight: 700,
                color: isLight ? '#0D472B' : '#F5F1E8',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
              }}
            >
              Retrofit Roadmap
            </h1>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                backgroundColor: isLight ? '#FDF4E3' : 'rgba(212, 132, 26, 0.15)',
                color: isLight ? '#B45309' : '#E89B3C',
                border: isLight ? '1px solid #FCD34D' : '1px solid rgba(212, 132, 26, 0.3)',
                fontFamily: 'JetBrains Mono',
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
              }}
            >
              GROQ AI OPTIMIZED
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.82rem', color: isLight ? '#5C6B61' : '#94A3B8' }}>
            <span>Dharavi North — Feeder F01</span>
            <span>•</span>
            <span>Community Residential Feeder (4,200 m² GFA)</span>
            <span>•</span>
            <span style={{ color: '#059669' }}>ECBC Compliant • MSEDCL Zone</span>
          </div>
        </div>

        {/* Top Buttons — all functional */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={exportPlan}
            title="Export capital plan as CSV"
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 16px', backgroundColor: isLight ? '#FFFFFF' : '#161616',
              border: isLight ? '1px solid #DAE2D2' : '1px solid #2A2A2A',
              borderRadius: '4px', color: isLight ? '#0D472B' : '#F5F1E8',
              fontFamily: 'Space Grotesk', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer',
            }}
          >
            <Download size={15} />
            <span>Export Plan (CSV)</span>
          </button>

          <button
            onClick={() => navigate('/simulation')}
            title="Open simulation console to model grid peak scenario"
            className="btn-primary"
            style={{ padding: '10px 20px', backgroundColor: isLight ? '#0D472B' : '#D4841A', color: '#FFFFFF' }}>
            <Zap size={16} />
            <span>Simulate Grid Peak</span>
          </button>
        </div>
      </div>

      {/* Top 4 Summary KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        {/* KPI 1 */}
        <div style={{ backgroundColor: isLight ? '#FFFFFF' : '#161616', border: isLight ? '1px solid #E2E8DC' : '1px solid #242424', borderRadius: '6px', padding: '18px 20px', boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.03)' : 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: isLight ? '#5C6B61' : '#64748B', letterSpacing: '0.08em' }}>
              TOTAL INVESTMENT
            </span>
            <Wrench size={16} color={isLight ? '#0D472B' : '#D4841A'} />
          </div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '2rem', fontWeight: 700, color: isLight ? '#B45309' : '#E89B3C', lineHeight: 1 }}>
            ₹{allCapex.toLocaleString('en-IN')}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.75rem', color: isLight ? '#5C6B61' : '#94A3B8' }}>
            <span>{retrofits.length} Identified Retrofits</span>
            <span style={{ color: isLight ? '#5C6B61' : '#64748B' }}>Capex Est.</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div style={{ backgroundColor: isLight ? '#FFFFFF' : '#161616', border: isLight ? '1px solid #E2E8DC' : '1px solid #242424', borderRadius: '6px', padding: '18px 20px', boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.03)' : 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: isLight ? '#5C6B61' : '#64748B', letterSpacing: '0.08em' }}>
              ANNUAL SAVINGS
            </span>
            <CheckCircle size={16} color="#059669" />
          </div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '2rem', fontWeight: 700, color: '#059669', lineHeight: 1 }}>
            ₹{allYield.toLocaleString('en-IN')} <span style={{ fontSize: '0.9rem', color: '#059669' }}>/yr</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.75rem', color: '#059669' }}>
            <span>{Math.round(allYield / 7.5)} kWh Avoided</span>
            <span style={{ color: isLight ? '#5C6B61' : '#64748B' }}>Estimated</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div style={{ backgroundColor: isLight ? '#FFFFFF' : '#161616', border: isLight ? '1px solid #E2E8DC' : '1px solid #242424', borderRadius: '6px', padding: '18px 20px', boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.03)' : 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: isLight ? '#5C6B61' : '#64748B', letterSpacing: '0.08em' }}>
              PAYBACK PERIOD
            </span>
            <TrendingUp size={16} color={isLight ? '#B45309' : '#E8A035'} />
          </div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '2rem', fontWeight: 700, color: isLight ? '#0F172A' : '#F5F1E8', lineHeight: 1 }}>
            {paybackYears} <span style={{ fontSize: '1rem', color: isLight ? '#5C6B61' : '#94A3B8' }}>years</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.75rem', color: isLight ? '#B45309' : '#E8A035' }}>
            <span>Target amort. threshold</span>
            <span>Fast Amortization</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div style={{ backgroundColor: isLight ? '#FFFFFF' : '#161616', border: isLight ? '1px solid #E2E8DC' : '1px solid #242424', borderRadius: '6px', padding: '18px 20px', boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.03)' : 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: isLight ? '#5C6B61' : '#64748B', letterSpacing: '0.08em' }}>
              10-YEAR ROI
            </span>
            <TrendingUp size={16} color="#059669" />
          </div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '2rem', fontWeight: 700, color: '#059669', lineHeight: 1 }}>
            {roiPct}%
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.75rem', color: isLight ? '#5C6B61' : '#94A3B8' }}>
            <span>{carbonOffset} tCO2e/yr offset</span>
            <span style={{ color: '#059669', fontWeight: 600 }}>10-Year Return</span>
          </div>
        </div>
      </div>

      {/* Filter controls & Category Tabs */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Filter Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: isLight ? '#FFFFFF' : '#161616', padding: '6px 12px', border: isLight ? '1px solid #DAE2D2' : '1px solid #2A2A2A', borderRadius: '4px', fontSize: '0.82rem' }}>
            <span style={{ color: isLight ? '#5C6B61' : '#64748B' }}>Filter by Budget:</span>
            <span style={{ color: isLight ? '#0F172A' : '#F5F1E8' }}>All Bands</span>
            <ChevronDown size={14} color={isLight ? '#5C6B61' : '#64748B'} />
          </div>

          {/* Sort Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: isLight ? '#FFFFFF' : '#161616', padding: '6px 12px', border: isLight ? '1px solid #DAE2D2' : '1px solid #2A2A2A', borderRadius: '4px', fontSize: '0.82rem' }}>
            <span style={{ color: isLight ? '#5C6B61' : '#64748B' }}>Sort by:</span>
            <span style={{ color: isLight ? '#0F172A' : '#F5F1E8' }}>Highest 10Y ROI</span>
            <ChevronDown size={14} color={isLight ? '#5C6B61' : '#64748B'} />
          </div>

          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { label: 'ALL', count: 8 },
              { label: 'SMART CONTROLS', count: 3 },
              { label: 'HVAC EQUIPMENT', count: 3 },
              { label: 'LIGHTING', count: 2 },
            ].map((cat) => (
              <button
                key={cat.label}
                onClick={() => setActiveCategory(cat.label)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontFamily: 'Space Grotesk',
                  fontSize: '0.8rem',
                  fontWeight: activeCategory === cat.label ? 600 : 400,
                  color: activeCategory === cat.label ? '#FFFFFF' : isLight ? '#3A4A3E' : '#94A3B8',
                  backgroundColor: activeCategory === cat.label ? (isLight ? '#0D472B' : '#D4841A') : isLight ? '#FFFFFF' : '#161616',
                  border: activeCategory === cat.label ? (isLight ? '1px solid #0D472B' : '1px solid #D4841A') : isLight ? '1px solid #DAE2D2' : '1px solid #242424',
                  cursor: 'pointer',
                }}
              >
                {cat.label} ({cat.count})
              </button>
            ))}
          </div>
        </div>

        <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.72rem', color: isLight ? '#5C6B61' : '#64748B' }}>
          • Showing 8 retrofits modeled by Groq Neural Engine
        </span>
      </div>

      {/* Retrofits List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: 'calc(100% - 320px)' }}>
        {filteredRetrofits.map((r) => (
          <div
            key={r.id}
            style={{
              backgroundColor: isLight ? '#FFFFFF' : '#161616',
              border: r.selected ? (isLight ? '1px solid #0D472B' : '1px solid #D4841A') : isLight ? '1px solid #E2E8DC' : '1px solid #242424',
              borderRadius: '8px',
              padding: '24px',
              position: 'relative',
              boxShadow: r.selected ? (isLight ? '0 4px 16px rgba(13, 71, 43, 0.12)' : '0 4px 20px rgba(212, 132, 26, 0.15)') : isLight ? '0 2px 8px rgba(0,0,0,0.03)' : 'none',
              transition: 'all 200ms ease',
            }}
          >
            {/* Header: Title, Categories, Badges */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                  <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.4rem', fontWeight: 700, color: isLight ? '#0F172A' : '#F5F1E8' }}>
                    {r.title}
                  </h3>
                  <span
                    style={{
                      fontFamily: 'JetBrains Mono',
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '3px',
                      backgroundColor: isLight ? '#FDF4E3' : 'rgba(212, 132, 26, 0.15)',
                      color: isLight ? '#B45309' : '#E89B3C',
                    }}
                  >
                    {r.category}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.78rem', color: isLight ? '#5C6B61' : '#64748B' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Zap size={13} color={isLight ? '#0D472B' : '#D4841A'} /> Immediate Implementation
                  </span>
                  {r.subLocation && (
                    <>
                      <span>•</span>
                      <span>{r.subLocation}</span>
                    </>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    fontFamily: 'JetBrains Mono',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '3px',
                    backgroundColor: isLight ? '#E6F5EC' : 'rgba(107, 165, 135, 0.15)',
                    color: isLight ? '#059669' : '#7CB899',
                  }}
                >
                  EFFORT: {r.effort}
                </span>

                <span style={{ fontFamily: 'Outfit', fontSize: '0.78rem', color: '#059669', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle size={13} color="#059669" /> ECBC Compliant
                </span>
              </div>
            </div>

            <p style={{ fontFamily: 'DM Sans', fontSize: '0.88rem', color: isLight ? '#3A4A3E' : '#CBD5E1', marginBottom: '20px', lineHeight: '1.5' }}>
              {r.description}
            </p>

            {/* Metrics 3 columns + Gauge circle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '40px' }}>
                <div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.62rem', color: isLight ? '#5C6B61' : '#64748B' }}>REQUIRED CAPEX</div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: '1.25rem', fontWeight: 700, color: isLight ? '#B45309' : '#E89B3C' }}>
                    ₹{r.capex.toLocaleString()}
                  </div>
                  <div style={{ fontFamily: 'DM Sans', fontSize: '0.72rem', color: isLight ? '#5C6B61' : '#64748B' }}>{r.capexLabel}</div>
                </div>

                <div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.62rem', color: isLight ? '#5C6B61' : '#64748B' }}>ANNUAL YIELD</div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: '1.25rem', fontWeight: 700, color: '#059669' }}>
                    +₹{r.annualYield.toLocaleString()}
                  </div>
                  <div style={{ fontFamily: 'DM Sans', fontSize: '0.72rem', color: isLight ? '#5C6B61' : '#64748B' }}>{r.yieldLabel}</div>
                </div>

                <div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.62rem', color: isLight ? '#5C6B61' : '#64748B' }}>PAYBACK WINDOW</div>
                  <div style={{ fontFamily: 'Space Grotesk', fontSize: '1.25rem', fontWeight: 700, color: isLight ? '#0F172A' : '#F5F1E8' }}>
                    {r.payback}
                  </div>
                  <div style={{ fontFamily: 'DM Sans', fontSize: '0.72rem', color: isLight ? '#5C6B61' : '#64748B' }}>Turnkey deployment</div>
                </div>
              </div>

              {/* Applicability score gauge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'Space Grotesk', fontSize: '1.1rem', fontWeight: 700, color: isLight ? '#0D472B' : '#F5F1E8' }}>
                    {r.applicabilityScore}%
                  </div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.62rem', color: isLight ? '#5C6B61' : '#64748B' }}>APPLICABILITY</div>
                </div>

                <svg width="40" height="40" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="16" fill="none" stroke={isLight ? '#EAEFE3' : '#242424'} strokeWidth="4" />
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    fill="none"
                    stroke={isLight ? '#0D472B' : '#34D399'}
                    strokeWidth="4"
                    strokeDasharray="100"
                    strokeDashoffset={100 - r.applicabilityScore}
                    transform="rotate(-90 20 20)"
                  />
                </svg>
              </div>
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: isLight ? '1px solid #E2E8DC' : '1px solid #1E1E1E' }}>
              <button onClick={() => navigate('/simulation')} title="Model this retrofit in simulation" style={{ background: 'none', border: 'none', color: isLight ? '#0D472B' : '#E89B3C', fontFamily: 'Space Grotesk', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
                Simulate Impact →
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={exportPlan} title="Export plan as CSV" style={{ padding: '7px 14px', backgroundColor: isLight ? '#FFFFFF' : '#1E1E1E', border: isLight ? '1px solid #DAE2D2' : '1px solid #333', borderRadius: '4px', color: isLight ? '#5C6B61' : '#94A3B8', fontFamily: 'Space Grotesk', fontSize: '0.8rem', cursor: 'pointer' }}>
                  Export CSV
                </button>
                <button
                  onClick={() => toggleRetrofitSelection(r.id)}
                  className={r.selected ? 'btn-secondary' : 'btn-primary'}
                  style={{ padding: '7px 16px', fontSize: '0.8rem', backgroundColor: r.selected ? (isLight ? '#EAEFE3' : '#242424') : (isLight ? '#0D472B' : '#D4841A'), color: r.selected ? (isLight ? '#0D472B' : '#F5F1E8') : '#FFFFFF' }}
                >
                  {r.selected ? (
                    <>
                      <Check size={14} color="#059669" />
                      <span>In Plan</span>
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      <span>Add to Plan</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Plan Summary Panel (Fixed Bottom Right) */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '32px',
          width: '300px',
          backgroundColor: isLight ? '#FFFFFF' : '#161616',
          border: isLight ? '1px solid #0D472B' : '1px solid #D4841A',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: isLight ? '0 10px 30px rgba(0, 0, 0, 0.1), 0 0 20px rgba(13, 71, 43, 0.15)' : '0 10px 30px rgba(0, 0, 0, 0.8), 0 0 20px rgba(212, 132, 26, 0.2)',
          zIndex: 80,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h4 style={{ fontFamily: 'Space Grotesk', fontSize: '1.05rem', fontWeight: 700, color: isLight ? '#0F172A' : '#F5F1E8' }}>
            Plan Summary
          </h4>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: '#059669', fontWeight: 700 }}>
            ACTIVE BATCH
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem', marginBottom: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: isLight ? '#5C6B61' : '#64748B' }}>Selected Retrofits</span>
            <span style={{ color: isLight ? '#0F172A' : '#F5F1E8', fontWeight: 600 }}>{selectedCount} of {retrofits.length}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: isLight ? '#5C6B61' : '#64748B' }}>Total Investment</span>
            <span style={{ color: isLight ? '#B45309' : '#E89B3C', fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: '0.95rem' }}>
              ₹{totalCapex.toLocaleString()}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: isLight ? '#5C6B61' : '#64748B' }}>Annual Savings</span>
            <span style={{ color: '#059669', fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: '0.95rem' }}>
              ₹{totalYield.toLocaleString()}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: isLight ? '#5C6B61' : '#64748B' }}>Blended Payback</span>
            <span style={{ color: isLight ? '#0F172A' : '#F5F1E8', fontWeight: 600 }}>
              {totalYield > 0 ? (totalCapex / totalYield).toFixed(1) : '—'} Years
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: isLight ? '#5C6B61' : '#64748B' }}>Est. Carbon Offset</span>
            <span style={{ color: '#059669' }}>{(totalYield / 1000 * 0.82).toFixed(1)} tCO2e/yr</span>
          </div>
        </div>

        <button
          onClick={exportPlan}
          title="Download capital plan as CSV"
          className="btn-primary"
          style={{ width: '100%', padding: '11px', fontSize: '0.88rem', marginBottom: '8px', backgroundColor: isLight ? '#0D472B' : '#D4841A', color: '#FFFFFF' }}
        >
          <Download size={15} />
          <span>Export Capital Plan (CSV)</span>
        </button>

        <button
          onClick={() => navigate('/reliability')}
          title="View reliability impact of selected retrofits"
          style={{ width: '100%', padding: '8px', backgroundColor: isLight ? '#EAEFE3' : '#1E1E1E', border: isLight ? '1px solid #DAE2D2' : '1px solid #333', borderRadius: '4px', color: isLight ? '#5C6B61' : '#94A3B8', fontFamily: 'Space Grotesk', fontSize: '0.78rem', cursor: 'pointer', marginBottom: '8px' }}
        >
          View Reliability Impact
        </button>

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => retrofits.forEach(r => r.selected && toggleRetrofitSelection(r.id))}
            title="Deselect all retrofits"
            style={{ background: 'none', border: 'none', color: isLight ? '#5C6B61' : '#64748B', fontFamily: 'Space Grotesk', fontSize: '0.72rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <RotateCcw size={10} />
            <span>Reset Selection</span>
          </button>
        </div>
      </div>
    </div>
  );
}
