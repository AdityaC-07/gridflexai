import React, { useState } from 'react';
import { useBuildingContext } from '../context/BuildingContext';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  AlertTriangle,
  CheckCircle,
  Building,
  Upload,
  MoreVertical,
  Activity,
  Wrench,
  FileText,
  ArrowRight,
  TrendingUp,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function BuildingDetailsPage() {
  const navigate = useNavigate();
  const { activeBuilding, triggerAIAnalysis, setSelectedAnomaly, setIsAnalysisComplete, theme } = useBuildingContext();
  const isLight = theme === 'light';
  const [chartTimeframe, setChartTimeframe] = useState('7 days');

  // Chart dataset for 7-day energy consumption curve matching screenshot 6
  const energyData = [
    { date: 'Sep 09', hvac: 320, lighting: 150, plug: 120, total: 590 },
    { date: 'Sep 10', hvac: 340, lighting: 155, plug: 125, total: 620 },
    { date: 'Sep 11', hvac: 310, lighting: 148, plug: 118, total: 576 },
    { date: 'Sep 12', hvac: 380, lighting: 160, plug: 130, total: 670 },
    { date: 'Sep 13', hvac: 420, lighting: 165, plug: 135, total: 720 },
    { date: 'Sep 14', hvac: 450, lighting: 170, plug: 140, total: 760 },
    { date: 'Sep 15 (Today)', hvac: 520, lighting: 180, plug: 150, total: 850 },
  ];

  const handleInspectAnomaly = (anomaly) => {
    setSelectedAnomaly(anomaly);
  };

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: isLight ? '#5C6B61' : '#64748B' }}>
          <span>Dashboard</span>
          <span>/</span>
          <span>Buildings</span>
          <span>/</span>
          <span style={{ color: isLight ? '#0D472B' : '#F5F1E8', fontWeight: 600 }}>Delhi Tech Park</span>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h1
              style={{
                fontFamily: 'Syne',
                fontSize: '2.6rem',
                fontWeight: 800,
                color: isLight ? '#0D472B' : '#F5F1E8',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
              }}
            >
              Delhi Tech Park
            </h1>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                backgroundColor: 'rgba(52, 211, 153, 0.12)',
                color: '#34D399',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                fontFamily: 'JetBrains Mono',
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
              }}
            >
              • ACTIVE TELEMETRY
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.82rem', color: 'var(--color-text-dim, #94A3B8)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><MapPin size={13} color="#D4841A" /> Delhi NCR, India</span>
            <span>•</span>
            <span>5,000 m² GFA</span>
            <span>•</span>
            <span>Commercial Workplace</span>
            <span>•</span>
            <span style={{ color: '#7CB899' }}>ECBC COMPLIANT</span>
            <span>•</span>
            <span
              style={{
                fontFamily: 'JetBrains Mono',
                fontSize: '0.7rem',
                color: '#E89B3C',
                backgroundColor: '#1E1B18',
                padding: '2px 6px',
                borderRadius: '3px',
              }}
            >
              ZONE: COMPOSITE
            </span>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={triggerAIAnalysis} className="btn-primary" style={{ padding: '10px 20px' }}>
            <TrendingUp size={16} />
            <span>Analyze Portfolio</span>
          </button>

          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              backgroundColor: isLight ? '#FFFFFF' : '#161616',
              border: isLight ? '1px solid #DAE2D2' : '1px solid #2A2A2A',
              borderRadius: '4px',
              color: isLight ? '#0D472B' : '#F5F1E8',
              fontFamily: 'Space Grotesk',
              fontSize: '0.85rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Upload size={15} />
            <span>Upload Data</span>
          </button>

          <button
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '4px',
              backgroundColor: isLight ? '#FFFFFF' : '#161616',
              border: isLight ? '1px solid #DAE2D2' : '1px solid #2A2A2A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isLight ? '#5C6B61' : '#94A3B8',
              cursor: 'pointer',
            }}
          >
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      {/* Top 4 Metrics Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        {/* Metric 1 */}
        <div
          style={{
            backgroundColor: isLight ? '#FFFFFF' : '#161616',
            border: isLight ? '1px solid #E2E8DC' : '1px solid #242424',
            borderRadius: '6px',
            padding: '18px 20px',
            boxShadow: isLight ? '0 2px 10px rgba(0,0,0,0.03)' : 'none',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: isLight ? '#5C6B61' : '#64748B', letterSpacing: '0.08em' }}>
                BUILDING AREA
              </div>
              <div style={{ fontFamily: 'Space Grotesk', fontSize: '0.95rem', fontWeight: 600, color: isLight ? '#0F172A' : '#F5F1E8' }}>
                Conditioned Space
              </div>
            </div>
            <Building size={18} color="#D4841A" />
          </div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '2.2rem', fontWeight: 700, color: isLight ? '#0F172A' : '#F5F1E8', lineHeight: 1 }}>
            1,200 <span style={{ fontSize: '1rem', fontWeight: 500, color: isLight ? '#5C6B61' : '#94A3B8' }}>m²</span>
          </div>
          <div style={{ fontFamily: 'DM Sans', fontSize: '0.75rem', color: isLight ? '#5C6B61' : '#64748B', marginTop: '6px' }}>5,000 sqm GFA</div>
        </div>

        {/* Metric 2 */}
        <div
          style={{
            backgroundColor: isLight ? '#FFFFFF' : '#161616',
            border: isLight ? '1px solid #E2E8DC' : '1px solid #242424',
            borderRadius: '6px',
            padding: '18px 20px',
            boxShadow: isLight ? '0 2px 10px rgba(0,0,0,0.03)' : 'none',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: isLight ? '#5C6B61' : '#64748B', letterSpacing: '0.08em' }}>
                TODAY'S USAGE
              </div>
              <div style={{ fontFamily: 'Space Grotesk', fontSize: '0.95rem', fontWeight: 600, color: isLight ? '#0F172A' : '#F5F1E8' }}>
                Current Load
              </div>
            </div>
            <Zap size={18} color="#E89B3C" />
          </div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '2.2rem', fontWeight: 700, color: '#E89B3C', lineHeight: 1 }}>
            850 <span style={{ fontSize: '1rem', fontWeight: 500, color: isLight ? '#5C6B61' : '#94A3B8' }}>kWh</span>
          </div>
          <div style={{ fontFamily: 'DM Sans', fontSize: '0.75rem', color: '#059669', marginTop: '6px' }}>
            → Steady load curve
          </div>
        </div>

        {/* Metric 3 */}
        <div
          style={{
            backgroundColor: isLight ? '#FFFFFF' : '#161616',
            border: isLight ? '1px solid #E2E8DC' : '1px solid #242424',
            borderRadius: '6px',
            padding: '18px 20px',
            boxShadow: isLight ? '0 2px 10px rgba(0,0,0,0.03)' : 'none',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: isLight ? '#5C6B61' : '#64748B', letterSpacing: '0.08em' }}>
                DEMAND BASELINE
              </div>
              <div style={{ fontFamily: 'Space Grotesk', fontSize: '0.95rem', fontWeight: 600, color: isLight ? '#0F172A' : '#F5F1E8' }}>
                Peak Excursion
              </div>
            </div>
            <AlertTriangle size={18} color="#FF6B5B" />
          </div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '2.2rem', fontWeight: 700, color: '#FF6B5B', lineHeight: 1 }}>
            +25%
          </div>
          <div
            style={{
              fontFamily: 'JetBrains Mono',
              fontSize: '0.68rem',
              color: '#FF6B5B',
              backgroundColor: 'rgba(255, 107, 91, 0.12)',
              padding: '2px 6px',
              borderRadius: '3px',
              display: 'inline-block',
              marginTop: '6px',
            }}
          >
            Excursion Alert
          </div>
        </div>

        {/* Metric 4 */}
        <div
          style={{
            backgroundColor: isLight ? '#FFFFFF' : '#161616',
            border: isLight ? '1px solid #E2E8DC' : '1px solid #242424',
            borderRadius: '6px',
            padding: '18px 20px',
            boxShadow: isLight ? '0 2px 10px rgba(0,0,0,0.03)' : 'none',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: isLight ? '#5C6B61' : '#64748B', letterSpacing: '0.08em' }}>
                EFFICIENCY BENCHMARK
              </div>
              <div style={{ fontFamily: 'Space Grotesk', fontSize: '0.95rem', fontWeight: 600, color: isLight ? '#0F172A' : '#F5F1E8' }}>
                Building Rating
              </div>
            </div>
            <CheckCircle size={18} color="#6BA587" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontFamily: 'JetBrains Mono',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: isLight ? '#FFFFFF' : '#0F0F0F',
                backgroundColor: isLight ? '#0D472B' : '#6BA587',
                padding: '4px 10px',
                borderRadius: '4px',
              }}
            >
              Good
            </span>
            <span style={{ fontFamily: 'DM Sans', fontSize: '0.78rem', color: isLight ? '#5C6B61' : '#94A3B8' }}>Top 35% quartile</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Column 70%, Right Column 30% */}
      <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: '28px' }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* 15-Min Consumption Recharts Graph */}
          <div
            style={{
              backgroundColor: isLight ? '#FFFFFF' : '#161616',
              border: isLight ? '1px solid #E2E8DC' : '1px solid #242424',
              borderRadius: '8px',
              padding: '24px',
              boxShadow: isLight ? '0 2px 10px rgba(0,0,0,0.03)' : 'none',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#E89B3C',
                    }}
                  />
                  <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.2rem', fontWeight: 700, color: isLight ? '#0F172A' : '#F5F1E8' }}>
                    Energy Consumption
                  </h3>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.68rem', color: isLight ? '#5C6B61' : '#64748B' }}>
                    15-MIN INTERVALS
                  </span>
                </div>
              </div>

              {/* Timeframe tabs */}
              <div style={{ display: 'flex', gap: '4px', backgroundColor: isLight ? '#EAEFE3' : '#121212', padding: '3px', borderRadius: '4px' }}>
                {['7 days', '30 days', '90 days'].map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setChartTimeframe(tf)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '3px',
                      fontFamily: 'Space Grotesk',
                      fontSize: '0.75rem',
                      fontWeight: chartTimeframe === tf ? 600 : 400,
                      color: chartTimeframe === tf ? (isLight ? '#FFFFFF' : '#F5F1E8') : isLight ? '#5C6B61' : '#64748B',
                      backgroundColor: chartTimeframe === tf ? (isLight ? '#0D472B' : '#242424') : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {/* Recharts graph */}
            <div style={{ width: '100%', height: '240px', position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={energyData}>
                  <XAxis dataKey="date" stroke={isLight ? '#CBD5E1' : '#3A3A3A'} tick={{ fill: isLight ? '#5C6B61' : '#64748B', fontSize: 11 }} />
                  <YAxis stroke={isLight ? '#CBD5E1' : '#3A3A3A'} tick={{ fill: isLight ? '#5C6B61' : '#64748B', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: isLight ? '#FFFFFF' : '#0F0F0F', borderColor: '#D4841A', borderRadius: '4px', color: isLight ? '#0F172A' : '#F5F1E8' }}
                    labelStyle={{ color: isLight ? '#0D472B' : '#F5F1E8', fontWeight: 'bold' }}
                  />
                  <Line type="monotone" dataKey="hvac" stroke="#0284C7" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="lighting" stroke="#E89B3C" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="plug" stroke="#FF6B5B" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Legend Toggles */}
            <div style={{ display: 'flex', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: isLight ? '1px solid #E2E8DC' : '1px solid #202020' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#0284C7' }} />
                <span style={{ fontFamily: 'DM Sans', fontSize: '0.82rem', color: isLight ? '#2D3E33' : '#D1CCC3' }}>HVAC 62%</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#E89B3C' }} />
                <span style={{ fontFamily: 'DM Sans', fontSize: '0.82rem', color: isLight ? '#2D3E33' : '#D1CCC3' }}>Lighting 21%</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#FF6B5B' }} />
                <span style={{ fontFamily: 'DM Sans', fontSize: '0.82rem', color: isLight ? '#2D3E33' : '#D1CCC3' }}>Plug Load 17%</span>
              </div>
            </div>

            <p style={{ fontFamily: 'Outfit', fontSize: '0.78rem', color: isLight ? '#5C6B61' : '#64748B', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={13} color="#D4841A" /> HVAC accounts for 62% of facility consumption. Peak demand threshold consistently breached between 2:00 PM – 4:00 PM.
            </p>
          </div>

          {/* Recent Anomalies Callout */}
          <div
            style={{
              backgroundColor: isLight ? '#FFFFFF' : '#161616',
              border: isLight ? '1px solid #FF8073' : '1px solid #FF6B5B',
              borderRadius: '8px',
              padding: '24px',
              position: 'relative',
              boxShadow: isLight ? '0 4px 16px rgba(255, 107, 91, 0.08)' : '0 4px 20px rgba(255, 107, 91, 0.12)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertTriangle size={20} color="#FF6B5B" />
                <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.2rem', fontWeight: 700, color: isLight ? '#0F172A' : '#F5F1E8' }}>
                  Recent Anomalies
                </h3>
                <span
                  style={{
                    fontFamily: 'JetBrains Mono',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255, 107, 91, 0.15)',
                    color: '#FF6B5B',
                  }}
                >
                  1 Active
                </span>
              </div>

              <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.68rem', color: isLight ? '#5C6B61' : '#64748B' }}>
                Real-time Sentry Log
              </span>
            </div>

            {activeBuilding.anomalies.map((anom) => (
              <div
                key={anom.id}
                style={{
                  backgroundColor: isLight ? '#FAFCF7' : '#121212',
                  border: isLight ? '1px solid #E2E8DC' : '1px solid #262626',
                  borderRadius: '6px',
                  padding: '18px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ fontFamily: 'Space Grotesk', fontSize: '1rem', fontWeight: 700, color: isLight ? '#0F172A' : '#F5F1E8' }}>
                    {anom.title}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        backgroundColor: '#FF6B5B',
                        color: '#FFFFFF',
                        fontFamily: 'JetBrains Mono',
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        borderRadius: '3px',
                      }}
                    >
                      HIGH SEVERITY
                    </span>
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.72rem', color: isLight ? '#5C6B61' : '#64748B' }}>
                      {anom.timestamp}
                    </span>
                  </div>
                </div>

                <p style={{ fontFamily: 'DM Sans', fontSize: '0.85rem', color: isLight ? '#3A4A3E' : '#CBD5E1', marginBottom: '14px' }}>
                  Observed telemetry: <strong style={{ color: '#D4841A' }}>{anom.observedLoad}</strong> (vs typical profile baseline 180 kWh, <strong style={{ color: '#FF6B5B' }}>{anom.deviation} deviation</strong>).
                </p>

                {/* Groq AI Automated Diagnostics */}
                <div
                  style={{
                    backgroundColor: isLight ? '#FDF8F0' : 'rgba(212, 132, 26, 0.08)',
                    borderLeft: '3px solid #D4841A',
                    padding: '12px 14px',
                    borderRadius: '4px',
                    marginBottom: '16px',
                  }}
                >
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', fontWeight: 700, color: '#D4841A', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Zap size={13} color="#D4841A" /> GROQ AI AUTOMATED DIAGNOSTICS
                  </div>
                  <p style={{ fontFamily: 'DM Sans', fontSize: '0.82rem', color: isLight ? '#2D3E33' : '#D1CCC3' }}>
                    {anom.groqDiagnosis}
                  </p>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    onClick={() => handleInspectAnomaly(anom)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: isLight ? '#0D472B' : '#E89B3C',
                      fontFamily: 'Space Grotesk',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>Inspect Raw Phase Telemetry</span>
                    <ArrowRight size={14} />
                  </button>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      style={{
                        padding: '6px 12px',
                        backgroundColor: isLight ? '#FFFFFF' : '#1E1E1E',
                        border: isLight ? '1px solid #DAE2D2' : '1px solid #333333',
                        borderRadius: '4px',
                        color: isLight ? '#5C6B61' : '#94A3B8',
                        fontFamily: 'Space Grotesk',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                      }}
                    >
                      Dismiss / Acknowledge
                    </button>
                    <button
                      onClick={() => handleInspectAnomaly(anom)}
                      className="btn-primary"
                      style={{ padding: '6px 14px', fontSize: '0.78rem', backgroundColor: isLight ? '#0D472B' : '#D4841A', color: '#FFFFFF' }}
                    >
                      Dispatch Field Tech
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Equipment Inventory Table */}
          <div
            style={{
              backgroundColor: isLight ? '#FFFFFF' : '#161616',
              border: isLight ? '1px solid #E2E8DC' : '1px solid #242424',
              borderRadius: '8px',
              padding: '24px',
              boxShadow: isLight ? '0 2px 10px rgba(0,0,0,0.03)' : 'none',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <span style={{ fontFamily: 'Space Grotesk', fontSize: '0.95rem', fontWeight: 700, color: isLight ? '#0D472B' : '#F5F1E8', borderBottom: isLight ? '2px solid #0D472B' : '2px solid #D4841A', paddingBottom: '6px' }}>
                  EQUIPMENT INVENTORY
                </span>
                <span style={{ fontFamily: 'Space Grotesk', fontSize: '0.95rem', color: isLight ? '#5C6B61' : '#64748B' }}>
                  OCCUPANCY & COMFORT
                </span>
                <span style={{ fontFamily: 'Space Grotesk', fontSize: '0.95rem', color: isLight ? '#5C6B61' : '#64748B' }}>
                  TELEMETRY EVENT LOG
                </span>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: isLight ? '1px solid #E2E8DC' : '1px solid #242424', fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: isLight ? '#5C6B61' : '#64748B', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 12px' }}>ASSET IDENTIFIER</th>
                  <th style={{ padding: '10px 12px' }}>SUBSYSTEM GROUP</th>
                  <th style={{ padding: '10px 12px' }}>HEALTH STATUS</th>
                  <th style={{ padding: '10px 12px' }}>AGE / TECHNICAL SPECS</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>ACTION PROTOCOL</th>
                </tr>
              </thead>
              <tbody>
                {activeBuilding.equipment.map((eq) => (
                  <tr key={eq.id} style={{ borderBottom: isLight ? '1px solid #F0F4EC' : '1px solid #1E1E1E', fontSize: '0.85rem' }}>
                    <td style={{ padding: '14px 12px', fontFamily: 'Space Grotesk', fontWeight: 600, color: isLight ? '#0F172A' : '#F5F1E8' }}>
                      {eq.assetName}
                    </td>
                    <td style={{ padding: '14px 12px', color: isLight ? '#5C6B61' : '#94A3B8' }}>{eq.subsystem}</td>
                    <td style={{ padding: '14px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '60px', height: '6px', backgroundColor: isLight ? '#EAEFE3' : '#242424', borderRadius: '3px' }}>
                          <div
                            style={{
                              width: `${eq.healthScore}%`,
                              height: '100%',
                              backgroundColor: eq.healthScore > 90 ? '#059669' : eq.healthScore > 80 ? '#D4841A' : '#DC2626',
                              borderRadius: '3px',
                            }}
                          />
                        </div>
                        <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: isLight ? '#2D3E33' : '#D1CCC3' }}>
                          {eq.healthScore}%
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 12px', color: isLight ? '#5C6B61' : '#64748B', fontFamily: 'DM Sans', fontSize: '0.8rem' }}>
                      {eq.ageSpecs}
                    </td>
                    <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                      <button
                        style={{
                          padding: '4px 10px',
                          backgroundColor: isLight ? '#FDF4E3' : '#1E1E1E',
                          border: isLight ? '1px solid #FCD34D' : '1px solid #333333',
                          borderRadius: '4px',
                          color: isLight ? '#B45309' : '#E89B3C',
                          fontFamily: 'Space Grotesk',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {eq.actionProtocol}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (Sidebar) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Building Profile Panel */}
          <div
            style={{
              backgroundColor: isLight ? '#FFFFFF' : '#161616',
              border: isLight ? '1px solid #E2E8DC' : '1px solid #242424',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: isLight ? '0 2px 10px rgba(0,0,0,0.03)' : 'none',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.05rem', fontWeight: 700, color: isLight ? '#0F172A' : '#F5F1E8' }}>
                Building Profile
              </h3>
              <Building size={16} color={isLight ? '#5C6B61' : '#94A3B8'} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: isLight ? '#5C6B61' : '#64748B' }}>Typology</span>
                <span style={{ color: isLight ? '#0F172A' : '#F5F1E8', fontWeight: 500 }}>{activeBuilding.typology}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: isLight ? '#5C6B61' : '#64748B' }}>Micro-Climate</span>
                <span style={{ color: isLight ? '#0F172A' : '#F5F1E8', fontWeight: 500 }}>{activeBuilding.microClimate}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: isLight ? '#5C6B61' : '#64748B' }}>Commissioning Year</span>
                <span style={{ color: isLight ? '#0F172A' : '#F5F1E8', fontWeight: 500 }}>{activeBuilding.commissioningYear}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: isLight ? '#5C6B61' : '#64748B' }}>ECBC Compliance</span>
                <span style={{ color: '#059669', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>Compliant <CheckCircle2 size={13} color="#059669" /></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: isLight ? '#5C6B61' : '#64748B' }}>Occupancy Baseline</span>
                <span style={{ color: isLight ? '#0F172A' : '#F5F1E8', fontWeight: 500 }}>{activeBuilding.occupancyBaseline}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: isLight ? '#5C6B61' : '#64748B' }}>Tariff Peak Window</span>
                <span style={{ color: isLight ? '#B45309' : '#E89B3C', fontFamily: 'JetBrains Mono', fontSize: '0.78rem' }}>
                  {activeBuilding.tariffPeakWindow}
                </span>
              </div>
            </div>

            {/* Subsystem Health Matrix */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: isLight ? '1px solid #E2E8DC' : '1px solid #222222' }}>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: isLight ? '#5C6B61' : '#64748B', letterSpacing: '0.08em', marginBottom: '10px' }}>
                SUBSYSTEM HEALTH MATRIX
              </div>

              {activeBuilding.subsystems.map((sub, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '6px' }}>
                  <span style={{ color: isLight ? '#2D3E33' : '#D1CCC3' }}>{sub.name}</span>
                  <span style={{ color: sub.status === 'optimal' ? '#059669' : '#D4841A', fontWeight: 600 }}>
                    {sub.health}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Efficiency Rating Ring Gauge */}
          <div
            style={{
              backgroundColor: isLight ? '#FFFFFF' : '#161616',
              border: isLight ? '1px solid #E2E8DC' : '1px solid #242424',
              borderRadius: '8px',
              padding: '24px',
              textAlign: 'center',
              boxShadow: isLight ? '0 2px 10px rgba(0,0,0,0.03)' : 'none',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.05rem', fontWeight: 700, color: isLight ? '#0F172A' : '#F5F1E8' }}>
                Efficiency Rating
              </h3>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: isLight ? '#5C6B61' : '#64748B' }}>
                BEE EQUIVALENT
              </span>
            </div>

            {/* Gauge Ring */}
            <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 16px auto' }}>
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke={isLight ? '#EAEFE3' : '#242424'} strokeWidth="10" />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke={isLight ? '#0D472B' : '#34D399'}
                  strokeWidth="10"
                  strokeDasharray="314"
                  strokeDashoffset="110"
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontFamily: 'Space Grotesk', fontSize: '1rem', fontWeight: 700, color: isLight ? '#0D472B' : '#34D399' }}>
                  GOOD
                </span>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.9rem', fontWeight: 700, color: isLight ? '#0F172A' : '#F5F1E8' }}>
                  65%
                </span>
              </div>
            </div>

            <p style={{ fontFamily: 'DM Sans', fontSize: '0.8rem', color: isLight ? '#5C6B61' : '#94A3B8', marginBottom: '16px' }}>
              Performance exceeds <strong>65%</strong> of peer commercial real-estate installations within the New Delhi Composite Climate Band.
            </p>

            <div style={{ backgroundColor: isLight ? '#FAFCF7' : '#121212', padding: '12px', borderRadius: '4px', textAlign: 'left', fontSize: '0.78rem', border: isLight ? '1px solid #E2E8DC' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: isLight ? '#5C6B61' : '#64748B' }}>Regional Quartile</span>
                <span style={{ color: isLight ? '#0F172A' : '#F5F1E8', fontWeight: 600 }}>65th Percentile</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: isLight ? '#5C6B61' : '#64748B' }}>Optimization Target</span>
                <span style={{ color: isLight ? '#B45309' : '#E89B3C', fontWeight: 600 }}>Top 25% (A-Class)</span>
              </div>
            </div>
          </div>

          {/* Facility Actions Panel */}
          <div
            style={{
              backgroundColor: isLight ? '#FFFFFF' : '#161616',
              border: isLight ? '1px solid #E2E8DC' : '1px solid #242424',
              borderRadius: '8px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: isLight ? '0 2px 10px rgba(0,0,0,0.03)' : 'none',
            }}
          >
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: isLight ? '#5C6B61' : '#64748B', letterSpacing: '0.08em' }}>
              FACILITY ACTIONS
            </div>

            <button
              onClick={() => setIsAnalysisComplete(true)}
              className="btn-primary"
              style={{ width: '100%', padding: '11px', fontSize: '0.88rem', backgroundColor: isLight ? '#0D472B' : '#D4841A', color: '#FFFFFF' }}
            >
              <Activity size={16} />
              <span>View Full Analysis</span>
            </button>

            <button
              onClick={() => navigate('/retrofits')}
              className="btn-secondary"
              style={{ width: '100%', padding: '10px', fontSize: '0.85rem', backgroundColor: isLight ? '#EAEFE3' : '#242424', border: isLight ? '1px solid #DAE2D2' : '1px solid #3A3A3A', color: isLight ? '#0D472B' : '#F5F1E8' }}
            >
              <Wrench size={15} color={isLight ? '#0D472B' : '#D4841A'} />
              <span>See Retrofit Plan</span>
            </button>

            <button
              style={{
                width: '100%',
                padding: '9px',
                backgroundColor: 'transparent',
                border: isLight ? '1px solid #DAE2D2' : '1px solid #262626',
                borderRadius: '4px',
                color: isLight ? '#5C6B61' : '#94A3B8',
                fontFamily: 'Space Grotesk',
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <FileText size={14} />
              <span>Telemetry Report (PDF/CSV)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
