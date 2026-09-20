import React, { useState } from 'react';
import { useBuildingContext } from '../../context/BuildingContext';
import { useNavigate } from 'react-router-dom';
import { Check, X, Lightbulb, ChevronDown, ChevronUp, FileText, ArrowRight, Download } from 'lucide-react';

export function AnalysisCompleteModal() {
  const { isAnalysisComplete, closeModals, retrofits, theme } = useBuildingContext();
  const isLight = theme === 'light';
  const navigate = useNavigate();
  const [expandedIndex, setExpandedIndex] = useState(0);

  if (!isAnalysisComplete) return null;

  const handleViewRetrofits = () => {
    closeModals();
    navigate('/retrofits');
  };

  // Compute real values from actual retrofits data
  const totalRetrofits = retrofits.length;
  const totalYield = retrofits.reduce((s, r) => s + r.annualYield, 0);
  const totalCapex  = retrofits.reduce((s, r) => s + r.capex, 0);
  const savingsPct  = totalCapex > 0 ? Math.round((totalYield / totalCapex) * 100) : 0;

  const handleDownloadPDF = () => {
    // Export analysis summary as CSV (PDF generation requires server-side in production)
    const rows = [
      ['GridFlex AI — Building Analysis Report'],
      ['Generated', new Date().toLocaleString()],
      ['Feeder', 'F01 — Dharavi North'],
      [],
      ['RETROFIT OPPORTUNITIES'],
      ['Title', 'Category', 'CAPEX (INR)', 'Annual Yield (INR)', 'Payback', 'Applicability'],
      ...retrofits.map(r => [r.title, r.category, r.capex, r.annualYield, r.payback, `${r.applicabilityScore}%`]),
      [],
      ['TOTALS'],
      ['Total CAPEX', totalCapex],
      ['Total Annual Yield', totalYield],
      ['Estimated Payback', totalYield > 0 ? `${(totalCapex/totalYield).toFixed(1)} years` : '—'],
    ];
    const csv = rows.map(r => Array.isArray(r) ? r.join(',') : r).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'gridflex_analysis_report.csv';
    a.click();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: isLight ? 'rgba(240, 245, 235, 0.85)' : 'rgba(10, 10, 10, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '640px',
          maxWidth: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: isLight ? '#FFFFFF' : '#161616',
          border: isLight ? '1px solid #DAE2D2' : '1px solid #282828',
          borderRadius: '8px',
          padding: '32px',
          position: 'relative',
          boxShadow: isLight ? '0 20px 50px rgba(0, 0, 0, 0.12)' : '0 20px 50px rgba(0, 0, 0, 0.9), 0 0 40px rgba(52, 211, 153, 0.1)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={closeModals}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            color: '#64748B',
            cursor: 'pointer',
          }}
        >
          <X size={18} />
        </button>

        {/* Top Check Icon */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              backgroundColor: 'rgba(52, 211, 153, 0.12)',
              border: '1px solid #34D399',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#34D399',
            }}
          >
            <Check size={28} strokeWidth={2.5} />
          </div>
        </div>

        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2
            style={{
              fontFamily: 'Space Grotesk',
              fontSize: '1.6rem',
              fontWeight: 700,
              color: '#F5F1E8',
              marginBottom: '4px',
            }}
          >
            Analysis Complete
          </h2>
          <p style={{ fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: '#34D399' }}>
            • Generated in 22 seconds
          </p>
        </div>

        {/* Key Insight Box */}
        <div
          style={{
            backgroundColor: '#1E1B18',
            borderLeft: '4px solid #D4841A',
            borderTop: '1px solid #2E261E',
            borderRight: '1px solid #2E261E',
            borderBottom: '1px solid #2E261E',
            borderRadius: '4px',
            padding: '16px 20px',
            marginBottom: '28px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <Lightbulb size={20} color="#E89B3C" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <h4
                style={{
                  fontFamily: 'Space Grotesk',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: '#E89B3C',
                  marginBottom: '4px',
                }}
              >
                Key Insight
              </h4>
              <p
                style={{
                  fontFamily: 'DM Sans',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#F5F1E8',
                  marginBottom: '6px',
                }}
              >
                Your building can save <span style={{ color: '#E89B3C' }}>25% energy</span> with 3 targeted retrofits.
              </p>
              <p style={{ fontFamily: 'JetBrains Mono', fontSize: '0.72rem', color: '#94A3B8' }}>
                Confidence: 87% • Groq AI Neural Model v4.2
              </p>
            </div>
          </div>
        </div>

        {/* Top Opportunities Section */}
        <div style={{ marginBottom: '28px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '14px',
            }}
          >
            <span
              style={{
                fontFamily: 'JetBrains Mono',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#CBD5E1',
                letterSpacing: '0.08em',
              }}
            >
              TOP OPPORTUNITIES (3 IDENTIFIED)
            </span>
            <span
              style={{
                fontFamily: 'JetBrains Mono',
                fontSize: '0.65rem',
                color: '#64748B',
                letterSpacing: '0.08em',
              }}
            >
              PRIORITY RANKED
            </span>
          </div>

          {/* Opportunity Card 1 */}
          <div
            style={{
              backgroundColor: '#1E1E1E',
              border: '1px solid #2E2E2E',
              borderRadius: '6px',
              marginBottom: '10px',
              overflow: 'hidden',
            }}
          >
            <button
              onClick={() => setExpandedIndex(expandedIndex === 0 ? -1 : 0)}
              style={{
                width: '100%',
                padding: '14px 18px',
                backgroundColor: 'transparent',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '3px',
                    backgroundColor: 'rgba(255, 107, 91, 0.2)',
                    color: '#FF6B5B',
                    fontFamily: 'JetBrains Mono',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                  }}
                >
                  1. HVAC OPTIMIZATION
                </span>
                <span
                  style={{
                    fontFamily: 'Space Grotesk',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    color: '#F5F1E8',
                  }}
                >
                  HVAC Scheduling Optimization
                </span>
              </div>
              {expandedIndex === 0 ? <ChevronUp size={16} color="#94A3B8" /> : <ChevronDown size={16} color="#94A3B8" />}
            </button>

            {expandedIndex === 0 && (
              <div style={{ padding: '0 18px 18px 18px', borderTop: '1px solid #282828', paddingTop: '14px' }}>
                <p style={{ fontFamily: 'DM Sans', fontSize: '0.85rem', color: '#CBD5E1', marginBottom: '16px' }}>
                  Optimize HVAC setpoints and schedules based on occupancy patterns. Maintain comfort during occupied
                  hours, reduce conditioning during vacant periods.
                </p>

                {/* Metrics 3 columns */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '12px',
                    backgroundColor: '#141414',
                    padding: '12px 14px',
                    borderRadius: '4px',
                    border: '1px solid #222222',
                    marginBottom: '14px',
                  }}
                >
                  <div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.62rem', color: '#64748B' }}>SAVINGS</div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: '1.05rem', fontWeight: 700, color: '#E89B3C' }}>
                      50,000 <span style={{ fontSize: '0.75rem' }}>kWh/yr</span>
                    </div>
                    <div style={{ fontFamily: 'DM Sans', fontSize: '0.7rem', color: '#94A3B8' }}>15% reduction</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.62rem', color: '#64748B' }}>PRIORITY</div>
                    <div style={{ fontFamily: 'Space Grotesk', fontSize: '1.05rem', fontWeight: 700, color: '#FF6B5B' }}>
                      HIGH
                    </div>
                    <div style={{ fontFamily: 'DM Sans', fontSize: '0.7rem', color: '#94A3B8' }}>Immediate impact</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.62rem', color: '#64748B' }}>EFFORT</div>
                    <div style={{ fontFamily: 'Space Grotesk', fontSize: '1.05rem', fontWeight: 700, color: '#34D399' }}>
                      EASY
                    </div>
                    <div style={{ fontFamily: 'DM Sans', fontSize: '0.7rem', color: '#94A3B8' }}>4 weeks setup</div>
                  </div>
                </div>

                {/* AI Context note */}
                <div
                  style={{
                    padding: '10px 12px',
                    backgroundColor: '#181614',
                    borderLeft: '3px solid #E89B3C',
                    borderRadius: '2px',
                    fontFamily: 'DM Sans',
                    fontSize: '0.78rem',
                    color: '#D1CCC3',
                  }}
                >
                  Your building occupancy is erratic (50-90%), but HVAC runs on fixed hours. Our analysis shows 25% of
                  cooling occurs during unoccupied periods. Implementing occupancy-based scheduling can save 50,000 kWh
                  annually.
                </div>
              </div>
            )}
          </div>

          {/* Opportunity Card 2 */}
          <div
            style={{
              backgroundColor: '#1E1E1E',
              border: '1px solid #2E2E2E',
              borderRadius: '6px',
              marginBottom: '10px',
            }}
          >
            <button
              onClick={() => setExpandedIndex(expandedIndex === 1 ? -1 : 1)}
              style={{
                width: '100%',
                padding: '14px 18px',
                backgroundColor: 'transparent',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '3px',
                    backgroundColor: 'rgba(232, 160, 53, 0.15)',
                    color: '#E8A035',
                    fontFamily: 'JetBrains Mono',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                  }}
                >
                  2. CHILLER UPGRADE
                </span>
                <span style={{ fontFamily: 'Space Grotesk', fontSize: '0.9rem', color: '#F5F1E8' }}>
                  Chiller Variable Frequency Drive (VFD) Retrofit
                </span>
              </div>
              {expandedIndex === 1 ? <ChevronUp size={16} color="#94A3B8" /> : <ChevronDown size={16} color="#94A3B8" />}
            </button>
            {expandedIndex === 1 && (
              <div style={{ padding: '0 18px 16px 18px', fontFamily: 'DM Sans', fontSize: '0.82rem', color: '#94A3B8' }}>
                Est. Savings: 35,000 kWh/yr • Medium Effort • Payback 14 mo
              </div>
            )}
          </div>

          {/* Opportunity Card 3 */}
          <div
            style={{
              backgroundColor: '#1E1E1E',
              border: '1px solid #2E2E2E',
              borderRadius: '6px',
            }}
          >
            <button
              onClick={() => setExpandedIndex(expandedIndex === 2 ? -1 : 2)}
              style={{
                width: '100%',
                padding: '14px 18px',
                backgroundColor: 'transparent',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '3px',
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    color: '#38BDF8',
                    fontFamily: 'JetBrains Mono',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                  }}
                >
                  3. SOLAR PV INTEGRATION
                </span>
                <span style={{ fontFamily: 'Space Grotesk', fontSize: '0.9rem', color: '#F5F1E8' }}>
                  Smart Inverter & BESS Peak Shaving Arbitrage
                </span>
              </div>
              {expandedIndex === 2 ? <ChevronUp size={16} color="#94A3B8" /> : <ChevronDown size={16} color="#94A3B8" />}
            </button>
            {expandedIndex === 2 && (
              <div style={{ padding: '0 18px 16px 18px', fontFamily: 'DM Sans', fontSize: '0.82rem', color: '#94A3B8' }}>
                Est. Savings: 22,500 kWh/yr • High Impact • Carbon Offset 18t
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleViewRetrofits}
            className="btn-primary"
            style={{ flex: 1, padding: '12px 20px', fontSize: '0.92rem' }}
          >
            <span>View Retrofit Plan</span>
            <ArrowRight size={16} />
          </button>

          <button
            onClick={handleDownloadPDF}
            title="Download analysis report as CSV"
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '12px 18px',
              backgroundColor: isLight ? '#EAEFE3' : '#1E1E1E',
              border: isLight ? '1px solid #DAE2D2' : '1px solid #3A3A3A',
              borderRadius: '4px',
              color: isLight ? '#0D472B' : '#E89B3C',
              fontFamily: 'Space Grotesk', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Download size={16} />
            <span>Download Report</span>
          </button>

          <button
            onClick={closeModals}
            style={{
              padding: '12px 16px',
              backgroundColor: 'transparent',
              border: '1px solid #282828',
              borderRadius: '4px',
              color: '#94A3B8',
              fontFamily: 'Space Grotesk',
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
