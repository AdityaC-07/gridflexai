import React from 'react';
import { useBuildingContext } from '../context/BuildingContext';
import { Zap, Clock, ShieldCheck, Sun, Wind, Activity, ArrowRight, Download, CheckCircle2, MapPin, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export function GridOpsPage() {
  const { isAutoDREnabled, setIsAutoDREnabled, theme } = useBuildingContext();
  const isLight = theme === 'light';

  const drEarningsData = [
    { date: 'Sep 06', earnings: 450 },
    { date: 'Sep 07', earnings: 520 },
    { date: 'Sep 08', earnings: 480 },
    { date: 'Sep 09', earnings: 780 },
    { date: 'Sep 10', earnings: 620 },
    { date: 'Sep 11', earnings: 590 },
    { date: 'Sep 12', earnings: 410 },
    { date: 'Sep 13', earnings: 920 },
    { date: 'Sep 14', earnings: 850 },
    { date: 'Sep 15*', earnings: 1850, isToday: true },
  ];

  return (
    <div>
      {/* Breadcrumbs */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: isLight ? '#5C6B61' : '#64748B' }}>
          <span>Dashboard</span>
          <span>/</span>
          <span>District Portfolio</span>
          <span>/</span>
          <span style={{ color: isLight ? '#0D472B' : '#F5F1E8', fontWeight: 600 }}>Grid Operations & Demand Response</span>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <Zap size={22} color={isLight ? '#0D472B' : '#D4841A'} />
            <h1
              style={{
                fontFamily: 'Space Grotesk',
                fontSize: '2.4rem',
                fontWeight: 700,
                color: isLight ? '#0D472B' : '#F5F1E8',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
              }}
            >
              Grid Operations & Demand Response
            </h1>
          </div>
          <p style={{ fontFamily: 'DM Sans', fontSize: '0.92rem', color: isLight ? '#3A4A3E' : '#94A3B8' }}>
            Real-time grid signals and building flexibility metrics • Northern Regional Load Despatch Centre (NRLDC) Feed
          </p>
        </div>

        {/* Top Grid Status Indicators */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <div
            style={{
              padding: '10px 16px',
              backgroundColor: isLight ? '#FFFFFF' : '#161616',
              border: isLight ? '1px solid #E2E8DC' : '1px solid #242424',
              borderRadius: '6px',
              boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.03)' : 'none',
            }}
          >
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.62rem', color: isLight ? '#5C6B61' : '#64748B' }}>GRID FREQUENCY</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: '1.2rem', fontWeight: 700, color: isLight ? '#0F172A' : '#F5F1E8' }}>
                50.02 Hz
              </span>
              <span
                style={{
                  fontFamily: 'JetBrains Mono',
                  fontSize: '0.62rem',
                  padding: '2px 6px',
                  backgroundColor: isLight ? '#CBE2D3' : 'rgba(52, 211, 153, 0.15)',
                  color: isLight ? '#0D472B' : '#34D399',
                  borderRadius: '3px',
                }}
              >
                Nominal
              </span>
            </div>
          </div>

          <div
            style={{
              padding: '10px 16px',
              backgroundColor: isLight ? '#FFFFFF' : '#161616',
              border: isLight ? '1px solid #E2E8DC' : '1px solid #242424',
              borderRadius: '6px',
              boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.03)' : 'none',
            }}
          >
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.62rem', color: isLight ? '#5C6B61' : '#64748B' }}>GRID LOAD FACTOR</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: '1.2rem', fontWeight: 700, color: isLight ? '#B45309' : '#E89B3C' }}>
                92%
              </span>
              <span
                style={{
                  fontFamily: 'JetBrains Mono',
                  fontSize: '0.62rem',
                  padding: '2px 6px',
                  backgroundColor: isLight ? '#FDF4E3' : 'rgba(232, 160, 53, 0.15)',
                  color: isLight ? '#B45309' : '#E8A035',
                  borderRadius: '3px',
                }}
              >
                High Stress
              </span>
            </div>
          </div>

          <div
            style={{
              padding: '10px 16px',
              backgroundColor: isLight ? '#FFFFFF' : '#161616',
              border: isLight ? '1px solid #E2E8DC' : '1px solid #242424',
              borderRadius: '6px',
              boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.03)' : 'none',
            }}
          >
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.62rem', color: isLight ? '#5C6B61' : '#64748B' }}>REAL-TIME TARIFF</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: '1.2rem', fontWeight: 700, color: '#DC2626' }}>
                ₹15.50/kWh
              </span>
              <span
                style={{
                  fontFamily: 'JetBrains Mono',
                  fontSize: '0.62rem',
                  padding: '2px 6px',
                  backgroundColor: 'rgba(255, 107, 91, 0.15)',
                  color: '#DC2626',
                  borderRadius: '3px',
                }}
              >
                ↑ +2.5x Peak
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* PEAK DEMAND PERIOD ACTIVE Box */}
      <div
        style={{
          backgroundColor: isLight ? '#FFFDF9' : '#181414',
          border: isLight ? '1px solid #FF8073' : '1px solid #FF6B5B',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '32px',
          position: 'relative',
          boxShadow: isLight ? '0 4px 16px rgba(255, 107, 91, 0.08)' : '0 4px 24px rgba(255, 107, 91, 0.15)',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(255, 107, 91, 0.15)',
                  color: '#DC2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Zap size={18} />
              </div>

              <div>
                <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.3rem', fontWeight: 700, color: '#DC2626' }}>
                  PEAK DEMAND PERIOD ACTIVE
                </h3>
              </div>

              <span
                style={{
                  fontFamily: 'JetBrains Mono',
                  fontSize: '0.68rem',
                  padding: '4px 10px',
                  backgroundColor: 'rgba(255, 107, 91, 0.15)',
                  color: '#DC2626',
                  borderRadius: '3px',
                  border: '1px solid rgba(255, 107, 91, 0.3)',
                }}
              >
                DISCOM SENTRY TRIGGER: LEVEL 2
              </span>
            </div>

            <div style={{ display: 'flex', gap: '24px', marginBottom: '18px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isLight ? '#3A4A3E' : '#94A3B8', fontSize: '0.82rem' }}>
                  <Clock size={14} color="#D4841A" />
                  <span>Window: 14:00 – 18:00 IST</span>
                </div>
                <span
                  style={{
                    fontFamily: 'JetBrains Mono',
                    fontSize: '0.7rem',
                    color: isLight ? '#B45309' : '#E89B3C',
                    backgroundColor: isLight ? '#FDF4E3' : 'rgba(212, 132, 26, 0.15)',
                    padding: '2px 8px',
                    borderRadius: '3px',
                    marginTop: '4px',
                    display: 'inline-block',
                  }}
                >
                  1h 42m remaining
                </span>
              </div>

              <div>
                <div style={{ fontSize: '0.82rem', color: isLight ? '#3A4A3E' : '#94A3B8' }}>Current Marginal Rate:</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '1.05rem', fontWeight: 700, color: '#DC2626' }}>
                  ₹15.50/kWh <span style={{ fontSize: '0.75rem', color: isLight ? '#5C6B61' : '#64748B' }}>(2.5x normal baseline ₹6.20)</span>
                </div>
              </div>
            </div>

            {/* 2 Target Metrics */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                backgroundColor: isLight ? '#FFFFFF' : '#121010',
                padding: '16px',
                borderRadius: '6px',
                border: isLight ? '1px solid #E2E8DC' : '1px solid #241D1D',
                marginBottom: '16px',
              }}
            >
              <div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.62rem', color: isLight ? '#5C6B61' : '#64748B' }}>
                  TARGET CURTAILMENT CAPACITY
                </div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '1.8rem', fontWeight: 700, color: isLight ? '#0F172A' : '#F5F1E8' }}>
                  120 <span style={{ fontSize: '0.9rem', color: isLight ? '#5C6B61' : '#94A3B8' }}>kWh Load across Delhi Tech Park</span>
                </div>
              </div>

              <div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.62rem', color: isLight ? '#5C6B61' : '#64748B' }}>
                  ARBITRAGE INCENTIVE ACCRUAL
                </div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '1.8rem', fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  ₹1,850 <span style={{ fontSize: '0.8rem', color: '#059669', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={13} color="#059669" /> Projected Net Return Today</span>
                </div>
              </div>
            </div>

            <p style={{ fontFamily: 'Outfit', fontSize: '0.78rem', color: isLight ? '#5C6B61' : '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={13} color="#D4841A" /> NRLDC Forecast: Peak hours likely to extend to 19:00 IST due to regional heat index (25% confidence interval).
            </p>
          </div>

          {/* Automation State Box */}
          <div
            style={{
              backgroundColor: isLight ? '#FFFFFF' : '#121010',
              border: isLight ? '1px solid #E2E8DC' : '1px solid #282020',
              borderRadius: '6px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: isLight ? '#5C6B61' : '#64748B', letterSpacing: '0.08em', marginBottom: '12px' }}>
                AUTOMATION STATE
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  backgroundColor: isLight ? '#E6F5EC' : 'rgba(52, 211, 153, 0.1)',
                  border: isLight ? '1px solid #A8D4BB' : '1px solid rgba(52, 211, 153, 0.3)',
                  borderRadius: '4px',
                  marginBottom: '16px',
                }}
              >
                <ShieldCheck size={18} color="#059669" />
                <span style={{ fontFamily: 'Space Grotesk', fontSize: '0.9rem', fontWeight: 700, color: '#059669' }}>
                  Participating 65 kW Curtailed
                </span>
              </div>
            </div>

            <div>
              <button
                onClick={() => setIsAutoDREnabled(!isAutoDREnabled)}
                className="btn-primary"
                style={{ width: '100%', padding: '12px', fontSize: '0.9rem', marginBottom: '8px', backgroundColor: isLight ? '#0D472B' : '#D4841A', color: '#FFFFFF' }}
              >
                <span>{isAutoDREnabled ? 'Activate Full Auto-DR' : 'Auto-DR Active'}</span>
              </button>
              <div style={{ textAlign: 'center' }}>
                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    color: isLight ? '#5C6B61' : '#94A3B8',
                    fontFamily: 'Space Grotesk',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  Override Protocol Rules →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Regional Grid Generation Mix */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.2rem', fontWeight: 700, color: isLight ? '#0F172A' : '#F5F1E8' }}>
            Regional Grid Generation Mix
          </h3>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: isLight ? '#5C6B61' : '#64748B' }}>
            Updated 2 mins ago • State Grid Node B4
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
          {/* Solar Card */}
          <div style={{ backgroundColor: isLight ? '#FFFFFF' : '#161616', border: isLight ? '1px solid #E2E8DC' : '1px solid #242424', borderRadius: '6px', padding: '18px', boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.03)' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sun size={18} color="#D4841A" />
                <span style={{ fontFamily: 'Space Grotesk', fontSize: '0.92rem', fontWeight: 600, color: isLight ? '#0F172A' : '#F5F1E8' }}>
                  Solar Generation
                </span>
              </div>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.68rem', color: '#D4841A', fontWeight: 700 }}>
                35% SHARE
              </span>
            </div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '1.8rem', fontWeight: 700, color: isLight ? '#0F172A' : '#F5F1E8' }}>
              8,500 <span style={{ fontSize: '1rem', color: isLight ? '#5C6B61' : '#94A3B8' }}>MW</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.78rem', color: '#DC2626' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><TrendingDown size={14} color="#DC2626" /> 8% Decline</span>
              <span style={{ color: isLight ? '#5C6B61' : '#64748B' }}>Sunset at 18:15 IST</span>
            </div>
          </div>

          {/* Wind Card */}
          <div style={{ backgroundColor: isLight ? '#FFFFFF' : '#161616', border: isLight ? '1px solid #E2E8DC' : '1px solid #242424', borderRadius: '6px', padding: '18px', boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.03)' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wind size={18} color="#0284C7" />
                <span style={{ fontFamily: 'Space Grotesk', fontSize: '0.92rem', fontWeight: 600, color: isLight ? '#0F172A' : '#F5F1E8' }}>
                  Wind Generation
                </span>
              </div>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.68rem', color: '#0284C7', fontWeight: 700 }}>
                13% SHARE
              </span>
            </div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '1.8rem', fontWeight: 700, color: isLight ? '#0F172A' : '#F5F1E8' }}>
              3,200 <span style={{ fontSize: '1rem', color: isLight ? '#5C6B61' : '#94A3B8' }}>MW</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.78rem', color: '#059669' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><TrendingUp size={14} color="#059669" /> 12% Gust Front</span>
              <span style={{ color: isLight ? '#5C6B61' : '#64748B' }}>Western Corridor</span>
            </div>
          </div>

          {/* Conventional Card */}
          <div style={{ backgroundColor: isLight ? '#FFFFFF' : '#161616', border: isLight ? '1px solid #E2E8DC' : '1px solid #242424', borderRadius: '6px', padding: '18px', boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.03)' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} color="#059669" />
                <span style={{ fontFamily: 'Space Grotesk', fontSize: '0.92rem', fontWeight: 600, color: isLight ? '#0F172A' : '#F5F1E8' }}>
                  Conventional Baseload
                </span>
              </div>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.68rem', color: '#059669', fontWeight: 700 }}>
                52% SHARE
              </span>
            </div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '1.8rem', fontWeight: 700, color: isLight ? '#0F172A' : '#F5F1E8' }}>
              15,600 <span style={{ fontSize: '1rem', color: isLight ? '#5C6B61' : '#94A3B8' }}>MW</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.78rem', color: '#059669' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={14} color="#059669" /> Stable</span>
              <span style={{ color: isLight ? '#5C6B61' : '#64748B' }}>Spinning reserves active</span>
            </div>
          </div>
        </div>

        {/* Grid Advisory Banner */}
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: isLight ? '#FDF8F0' : '#1E1A14',
            borderLeft: '4px solid #D4841A',
            borderRadius: '4px',
            fontFamily: 'Outfit',
            fontSize: '0.82rem',
            color: isLight ? '#0F172A' : '#F5F1E8',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertTriangle size={16} color="#D4841A" />
          <span><strong>Grid Advisory:</strong> Solar generation declining as sunset approaches (18:15 IST). NRLDC will ramp thermal peaking gas turbines within 90 minutes. High peak tariff window anticipated until 20:00 IST.</span>
        </div>
      </div>

      {/* Facility Flexibility & Asset Dispatch */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.2rem', fontWeight: 700, color: isLight ? '#0F172A' : '#F5F1E8' }}>
            Facility Flexibility & Asset Dispatch
          </h3>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: isLight ? '#B45309' : '#E89B3C' }}>
            Available Controllable Capacity: 120 kWh
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Dispatch Card 1 */}
          <div style={{ backgroundColor: isLight ? '#FFFFFF' : '#161616', border: isLight ? '1px solid #E2E8DC' : '1px solid #242424', borderRadius: '6px', padding: '20px', boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.03)' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <h4 style={{ fontFamily: 'Space Grotesk', fontSize: '1.05rem', fontWeight: 700, color: isLight ? '#0F172A' : '#F5F1E8' }}>
                  HVAC Precision Pre-Cooling & Chiller Ramp
                </h4>
                <p style={{ fontFamily: 'DM Sans', fontSize: '0.78rem', color: isLight ? '#5C6B61' : '#64748B' }}>
                  District Chiller Plant A & B • Thermal Mass Buffer
                </p>
              </div>
              <span className="badge badge-optimal">• ACTIVE • DISPATCHED</span>
            </div>

            <div style={{ display: 'flex', gap: '24px', backgroundColor: isLight ? '#FAFCF7' : '#121212', padding: '14px', borderRadius: '4px', marginBottom: '14px', border: isLight ? '1px solid #E2E8DC' : 'none' }}>
              <div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.62rem', color: isLight ? '#5C6B61' : '#64748B' }}>FLEXIBLE LOAD SHIFTED</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '1.4rem', fontWeight: 700, color: isLight ? '#0F172A' : '#F5F1E8' }}>
                  85 <span style={{ fontSize: '0.85rem' }}>kWh</span>
                </div>
              </div>
              <div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.62rem', color: isLight ? '#5C6B61' : '#64748B' }}>AVOIDED PEAK SURCHARGE</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '1.4rem', fontWeight: 700, color: '#059669' }}>
                  ₹1,275/day
                </div>
              </div>
            </div>

            <p style={{ fontFamily: 'DM Sans', fontSize: '0.8rem', color: isLight ? '#3A4A3E' : '#94A3B8', marginBottom: '16px' }}>
              Strategy: Subcooled Delhi Tech Park to 21.5°C between 12:30–13:45 IST; VFD setpoint floated to 24.0°C during peak tariff window.
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={{ padding: '6px 12px', backgroundColor: isLight ? '#FFFFFF' : '#1E1E1E', border: isLight ? '1px solid #DAE2D2' : '1px solid #333', borderRadius: '4px', color: isLight ? '#0D472B' : '#F5F1E8', fontFamily: 'Space Grotesk', fontSize: '0.78rem', cursor: 'pointer' }}>
                  Pause Dispatch
                </button>
                <button style={{ padding: '6px 12px', backgroundColor: isLight ? '#FFFFFF' : '#1E1E1E', border: isLight ? '1px solid #DAE2D2' : '1px solid #333', borderRadius: '4px', color: isLight ? '#0D472B' : '#F5F1E8', fontFamily: 'Space Grotesk', fontSize: '0.78rem', cursor: 'pointer' }}>
                  Adjust Setpoint Deadband
                </button>
              </div>
              <button style={{ background: 'none', border: 'none', color: isLight ? '#0D472B' : '#E89B3C', fontFamily: 'Space Grotesk', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                Telemetry Logs →
              </button>
            </div>
          </div>

          {/* Dispatch Card 2 */}
          <div style={{ backgroundColor: isLight ? '#FFFFFF' : '#161616', border: isLight ? '1px solid #E2E8DC' : '1px solid #242424', borderRadius: '6px', padding: '20px', boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.03)' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <h4 style={{ fontFamily: 'Space Grotesk', fontSize: '1.05rem', fontWeight: 700, color: isLight ? '#0F172A' : '#F5F1E8' }}>
                  100 kWh Behind-The-Meter Lithium BESS
                </h4>
                <p style={{ fontFamily: 'DM Sans', fontSize: '0.78rem', color: isLight ? '#5C6B61' : '#64748B' }}>
                  Basement Substation O3 • Autonomous Inverter Pack
                </p>
              </div>
              <span className="badge badge-caution">• DISCHARGING • 35 kW RATE</span>
            </div>

            <div style={{ display: 'flex', gap: '24px', backgroundColor: isLight ? '#FAFCF7' : '#121212', padding: '14px', borderRadius: '4px', marginBottom: '14px', border: isLight ? '1px solid #E2E8DC' : 'none' }}>
              <div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.62rem', color: isLight ? '#5C6B61' : '#64748B' }}>ACTIVE DISCHARGE</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '1.4rem', fontWeight: 700, color: isLight ? '#B45309' : '#E89B3C' }}>
                  35 <span style={{ fontSize: '0.85rem' }}>kWh</span>
                </div>
              </div>
              <div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.62rem', color: isLight ? '#5C6B61' : '#64748B' }}>STATE OF CHARGE (SOC)</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '1.4rem', fontWeight: 700, color: '#059669' }}>
                  68%
                </div>
              </div>
            </div>

            <p style={{ fontFamily: 'DM Sans', fontSize: '0.8rem', color: isLight ? '#3A4A3E' : '#94A3B8', marginBottom: '16px' }}>
              Economic Arbitrage: Charged overnight at off-peak ₹3.80/kWh. Discharging now to offset ₹15.50/kWh peak demand charges.
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={{ padding: '6px 12px', backgroundColor: isLight ? '#FFFFFF' : '#1E1E1E', border: isLight ? '1px solid #DAE2D2' : '1px solid #333', borderRadius: '4px', color: isLight ? '#0D472B' : '#F5F1E8', fontFamily: 'Space Grotesk', fontSize: '0.78rem', cursor: 'pointer' }}>
                  Lock Reserve for Backup
                </button>
                <button style={{ padding: '6px 12px', backgroundColor: isLight ? '#FFFFFF' : '#1E1E1E', border: isLight ? '1px solid #DAE2D2' : '1px solid #333', borderRadius: '4px', color: isLight ? '#0D472B' : '#F5F1E8', fontFamily: 'Space Grotesk', fontSize: '0.78rem', cursor: 'pointer' }}>
                  Modify Discharge Profile
                </button>
              </div>
              <button style={{ background: 'none', border: 'none', color: isLight ? '#0D472B' : '#E89B3C', fontFamily: 'Space Grotesk', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                Inverter Health →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Demand Response Events Bar Chart */}
      <div
        style={{
          backgroundColor: isLight ? '#FFFFFF' : '#161616',
          border: isLight ? '1px solid #E2E8DC' : '1px solid #242424',
          borderRadius: '8px',
          padding: '24px',
          boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.03)' : 'none',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.2rem', fontWeight: 700, color: isLight ? '#0F172A' : '#F5F1E8' }}>
              Demand Response Events & Financial Reconciliation (Last 30 Days)
            </h3>
          </div>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: isLight ? '#5C6B61' : '#64748B' }}>
            Settlement Cycle: DISCOM NDPL-2024-Q3
          </span>
        </div>

        {/* 3 Summary metrics */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            marginBottom: '24px',
            backgroundColor: isLight ? '#FAFCF7' : '#121212',
            padding: '16px',
            borderRadius: '6px',
            border: isLight ? '1px solid #E2E8DC' : '1px solid #222222',
          }}
        >
          <div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.62rem', color: isLight ? '#5C6B61' : '#64748B' }}>EVENTS PARTICIPATED</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '1.6rem', fontWeight: 700, color: isLight ? '#0F172A' : '#F5F1E8' }}>
              8 <span style={{ fontSize: '0.8rem', color: '#059669' }}>100% compliance rate</span>
            </div>
            <div style={{ fontFamily: 'DM Sans', fontSize: '0.75rem', color: isLight ? '#5C6B61' : '#64748B' }}>Zero non-performance penalty fees</div>
          </div>

          <div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.62rem', color: isLight ? '#5C6B61' : '#64748B' }}>TOTAL ARBITRAGE & INCENTIVES</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '1.6rem', fontWeight: 700, color: '#059669' }}>
              ₹6,800 <span style={{ fontSize: '0.8rem', color: '#059669' }}>+18% vs prior month</span>
            </div>
            <div style={{ fontFamily: 'DM Sans', fontSize: '0.75rem', color: isLight ? '#5C6B61' : '#64748B' }}>Credited directly to commercial tariff bill</div>
          </div>

          <div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.62rem', color: isLight ? '#5C6B61' : '#64748B' }}>TOTAL GRID RELIEF GENERATED</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '1.6rem', fontWeight: 700, color: isLight ? '#0F172A' : '#F5F1E8' }}>
              340 <span style={{ fontSize: '0.8rem', color: isLight ? '#5C6B61' : '#94A3B8' }}>kWh Load Shifted</span>
            </div>
            <div style={{ fontFamily: 'DM Sans', fontSize: '0.75rem', color: '#059669' }}>0.28 tCO2e avoided from thermal peakers</div>
          </div>
        </div>

        {/* Recharts Bar Chart */}
        <div style={{ width: '100%', height: '220px', marginBottom: '16px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={drEarningsData}>
              <XAxis dataKey="date" stroke={isLight ? '#CBD5E1' : '#3A3A3A'} tick={{ fill: isLight ? '#5C6B61' : '#64748B', fontSize: 11 }} />
              <YAxis stroke={isLight ? '#CBD5E1' : '#3A3A3A'} tick={{ fill: isLight ? '#5C6B61' : '#64748B', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: isLight ? '#FFFFFF' : '#0F0F0F', borderColor: '#D4841A', borderRadius: '4px', color: isLight ? '#0F172A' : '#F5F1E8' }}
                labelStyle={{ color: isLight ? '#0D472B' : '#F5F1E8' }}
              />
              <Bar dataKey="earnings" radius={[4, 4, 0, 0]}>
                {drEarningsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.isToday ? '#DC2626' : isLight ? '#0D472B' : '#D4841A'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: isLight ? '#5C6B61' : '#64748B' }}>
          <span>*Sep 15 figure includes real-time Level 2 automated DR curtailment estimates.</span>
          <button
            style={{
              background: 'none',
              border: 'none',
              color: isLight ? '#0D472B' : '#E89B3C',
              fontFamily: 'Space Grotesk',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Download size={13} />
            <span>Export Settlement Data (CSV) →</span>
          </button>
        </div>
      </div>
    </div>
  );
}
