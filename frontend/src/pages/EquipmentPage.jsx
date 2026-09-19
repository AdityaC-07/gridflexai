import React from 'react';
import { useBuildingContext } from '../context/BuildingContext';
import { AlertTriangle, Info, ArrowRight, Download, Zap } from 'lucide-react';

export function EquipmentPage() {
  const { setSelectedAnomaly, theme } = useBuildingContext();
  const isLight = theme === 'light';

  const handleOpenModal = () => {
    setSelectedAnomaly({
      title: 'Chiller #1 Energy Spike Excursion',
      severity: 'HIGH SEVERITY',
      timestamp: 'Sep 15, 2:00 PM IST',
      observedLoad: '520 kWh',
      baselineLoad: '180 kWh',
      deviation: '+189.4%',
      confidence: 87,
      groqDiagnosis:
        '78% probability of centrifugal compressor vane degradation or refrigerant flow bottleneck. Immediate service triage advised within 48 hours to avert an estimated +15% ongoing surcharge.',
    });
  };

  return (
    <div>
      {/* Top Banner Tag */}
      <div style={{ marginBottom: '12px', fontFamily: 'JetBrains Mono', fontSize: '0.68rem', color: isLight ? '#5C6B61' : '#64748B' }}>
        FRAME 10 COMPONENT CATALOG // GRIDFLEX AI
      </div>

      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1
            style={{
              fontFamily: 'Space Grotesk',
              fontSize: '2.4rem',
              fontWeight: 700,
              color: isLight ? '#0D472B' : '#F5F1E8',
              letterSpacing: '-0.02em',
              marginBottom: '6px',
            }}
          >
            Anomaly Alert Card
          </h1>
          <p style={{ fontFamily: 'DM Sans', fontSize: '0.92rem', color: isLight ? '#3A4A3E' : '#94A3B8', maxWidth: '800px' }}>
            Reusable enterprise diagnostic telemetry alert card configured in Warm Mineral design tokens. Includes the core
            standard specification, severity tiers, and structural viewport variations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <span
            style={{
              fontFamily: 'JetBrains Mono',
              fontSize: '0.72rem',
              padding: '6px 12px',
              backgroundColor: isLight ? '#FFFFFF' : '#161616',
              border: isLight ? '1px solid #E2E8DC' : '1px solid #242424',
              borderRadius: '4px',
              color: '#059669',
            }}
          >
            • Active Sentry: Live
          </span>
          <button className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.8rem', backgroundColor: isLight ? '#0D472B' : '#D4841A', color: '#FFFFFF' }}>
            <Download size={14} />
            <span>Export Snippet</span>
          </button>
        </div>
      </div>

      {/* Section 1: Core Standard Specification */}
      <div style={{ marginBottom: '36px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#059669' }} />
            <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.2rem', fontWeight: 700, color: isLight ? '#0F172A' : '#F5F1E8' }}>
              Core Standard Specification (400px × 180px)
            </h3>
          </div>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.68rem', color: isLight ? '#5C6B61' : '#64748B' }}>
            Viewport: 400px × 180px
          </span>
        </div>

        <div
          style={{
            backgroundColor: isLight ? '#FFFFFF' : '#121212',
            border: isLight ? '1px solid #E2E8DC' : '1px solid #242424',
            borderRadius: '8px',
            padding: '24px',
            display: 'grid',
            gridTemplateColumns: '400px 1fr',
            gap: '32px',
            alignItems: 'center',
            boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.03)' : 'none',
          }}
        >
          {/* Card preview */}
          <div
            style={{
              backgroundColor: isLight ? '#FFFDF9' : '#1A1A1A',
              borderLeft: '4px solid #FF6B5B',
              borderTop: isLight ? '1px solid #E2E8DC' : '1px solid #2A2A2A',
              borderRight: isLight ? '1px solid #E2E8DC' : '1px solid #2A2A2A',
              borderBottom: isLight ? '1px solid #E2E8DC' : '1px solid #2A2A2A',
              borderRadius: '6px',
              padding: '16px',
              boxShadow: isLight ? '0 4px 12px rgba(255, 107, 91, 0.1)' : '0 4px 12px rgba(255, 107, 91, 0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={16} color="#FF6B5B" />
                <span style={{ fontFamily: 'Space Grotesk', fontSize: '0.95rem', fontWeight: 700, color: isLight ? '#0F172A' : '#F5F1E8' }}>
                  Chiller Energy Spike
                </span>
              </div>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.6rem', padding: '2px 6px', backgroundColor: '#FF6B5B', color: '#FFFFFF', fontWeight: 800, borderRadius: '2px' }}>
                HIGH
              </span>
            </div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.68rem', color: isLight ? '#5C6B61' : '#64748B', marginBottom: '8px' }}>
              Sep 15, 2:00 PM
            </div>
            <p style={{ fontFamily: 'DM Sans', fontSize: '0.78rem', color: isLight ? '#3A4A3E' : '#D1CCC3', marginBottom: '12px' }}>
              Solar generation collapsed to 25 kW. Projected energy gap: 80 kWh. Optimization ready.
            </p>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: isLight ? '#5C6B61' : '#94A3B8', display: 'flex', justifyContent: 'space-between', borderTop: isLight ? '1px solid #E2E8DC' : '1px solid #242424', paddingTop: '8px' }}>
              <span>Consumed: <strong style={{ color: isLight ? '#B45309' : '#E89B3C' }}>520 kWh</strong></span>
              <span>Baseline: 180 kWh</span>
              <span>Var: <strong style={{ color: '#FF6B5B' }}>+189%</strong></span>
            </div>
          </div>

          {/* Tokens list */}
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: isLight ? '#5C6B61' : '#94A3B8', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ color: isLight ? '#0F172A' : '#F5F1E8', fontWeight: 700, marginBottom: '4px' }}>Telemetry Specification Tokens:</div>
            <div>• Surface: <span style={{ color: isLight ? '#B45309' : '#E89B3C' }}>{isLight ? '#FFFDF9' : '#1A1A1A'}</span></div>
            <div>• Urgent Stroke: <span style={{ color: '#FF6B5B' }}>#FF6B5B (4px left)</span></div>
            <div>• Accent: <span style={{ color: isLight ? '#0D472B' : '#D4841A' }}>{isLight ? '#0D472B' : '#D4841A'} (Groq Link)</span></div>
            <div>• Font Pair: Space Grotesk + DM Sans</div>
            <div>• Elevation: 0 4px 12px rgba(255,107,91,0.2)</div>
            <div>• Animation: Continuous 2s pulse glow</div>
          </div>
        </div>
      </div>

      {/* Section 2: Severity Hierarchy Matrix */}
      <div style={{ marginBottom: '36px' }}>
        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#059669' }} />
            <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.2rem', fontWeight: 700, color: isLight ? '#0F172A' : '#F5F1E8' }}>
              Severity Hierarchy Matrix
            </h3>
          </div>
          <p style={{ fontFamily: 'DM Sans', fontSize: '0.82rem', color: isLight ? '#5C6B61' : '#64748B', marginTop: '2px' }}>
            Color-coded triage indicators for dynamic alert classification in grid telemetry feeds.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {/* HIGH alert */}
          <div style={{ backgroundColor: isLight ? '#FFFFFF' : '#1A1A1A', borderLeft: '4px solid #FF6B5B', borderTop: isLight ? '1px solid #E2E8DC' : '1px solid #282828', borderRight: isLight ? '1px solid #E2E8DC' : '1px solid #282828', borderBottom: isLight ? '1px solid #E2E8DC' : '1px solid #282828', borderRadius: '6px', padding: '16px', boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.03)' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={15} color="#FF6B5B" />
                <span style={{ fontFamily: 'Space Grotesk', fontSize: '0.9rem', fontWeight: 700, color: isLight ? '#0F172A' : '#F5F1E8' }}>Chiller Energy Spike</span>
              </div>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.62rem', backgroundColor: '#FF6B5B', color: '#FFFFFF', fontWeight: 800, padding: '2px 6px', borderRadius: '2px' }}>HIGH</span>
            </div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.68rem', color: isLight ? '#5C6B61' : '#64748B', marginBottom: '8px' }}>Sep 15, 2:00 PM</div>
            <p style={{ fontFamily: 'DM Sans', fontSize: '0.78rem', color: isLight ? '#3A4A3E' : '#D1CCC3', marginBottom: '12px' }}>Solar generation collapsed to 25 kW. Projected gap: 80 kWh. Optimization ready.</p>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: isLight ? '#5C6B61' : '#94A3B8', borderTop: isLight ? '1px solid #E2E8DC' : '1px solid #242424', paddingTop: '8px', marginBottom: '10px' }}>
              Consumed: <strong style={{ color: isLight ? '#B45309' : '#E89B3C' }}>520 kWh</strong> Baseline: 180 kWh Var: <strong style={{ color: '#FF6B5B' }}>+189%</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={handleOpenModal} style={{ background: 'none', border: 'none', color: isLight ? '#0D472B' : '#E89B3C', fontFamily: 'Space Grotesk', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>View Groq Diagnosis →</button>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: '#FF6B5B' }}>P1 CRITICAL</span>
            </div>
          </div>

          {/* MEDIUM alert */}
          <div style={{ backgroundColor: isLight ? '#FFFFFF' : '#1A1A1A', borderLeft: '4px solid #E8A035', borderTop: isLight ? '1px solid #E2E8DC' : '1px solid #282828', borderRight: isLight ? '1px solid #E2E8DC' : '1px solid #282828', borderBottom: isLight ? '1px solid #E2E8DC' : '1px solid #282828', borderRadius: '6px', padding: '16px', boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.03)' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={15} color="#E8A035" />
                <span style={{ fontFamily: 'Space Grotesk', fontSize: '0.9rem', fontWeight: 700, color: isLight ? '#0F172A' : '#F5F1E8' }}>HVAC Deadband Drift</span>
              </div>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.62rem', backgroundColor: '#E8A035', color: '#FFFFFF', fontWeight: 800, padding: '2px 6px', borderRadius: '2px' }}>MEDIUM</span>
            </div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.68rem', color: isLight ? '#5C6B61' : '#64748B', marginBottom: '8px' }}>Sep 15, 1:15 PM</div>
            <p style={{ fontFamily: 'DM Sans', fontSize: '0.78rem', color: isLight ? '#3A4A3E' : '#D1CCC3', marginBottom: '12px' }}>AHU-3 cooling setpoint overridden to 19.5°C in unleased Zone B. Thermal delta 4.2°C.</p>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: isLight ? '#5C6B61' : '#94A3B8', borderTop: isLight ? '1px solid #E2E8DC' : '1px solid #242424', paddingTop: '8px', marginBottom: '10px' }}>
              Consumed: <strong style={{ color: isLight ? '#B45309' : '#E89B3C' }}>340 kWh</strong> Baseline: 290 kWh Var: <strong style={{ color: isLight ? '#B45309' : '#E8A035' }}>+17.2%</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={handleOpenModal} style={{ background: 'none', border: 'none', color: isLight ? '#0D472B' : '#E89B3C', fontFamily: 'Space Grotesk', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>View Groq Diagnosis →</button>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: isLight ? '#B45309' : '#E8A035' }}>P2 WARNING</span>
            </div>
          </div>

          {/* LOW alert */}
          <div style={{ backgroundColor: isLight ? '#FFFFFF' : '#1A1A1A', borderLeft: '4px solid #94A3B8', borderTop: isLight ? '1px solid #E2E8DC' : '1px solid #282828', borderRight: isLight ? '1px solid #E2E8DC' : '1px solid #282828', borderBottom: isLight ? '1px solid #E2E8DC' : '1px solid #282828', borderRadius: '6px', padding: '16px', boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.03)' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Info size={15} color={isLight ? '#5C6B61' : '#94A3B8'} />
                <span style={{ fontFamily: 'Space Grotesk', fontSize: '0.9rem', fontWeight: 700, color: isLight ? '#0F172A' : '#F5F1E8' }}>Lighting Bus Timeout</span>
              </div>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.62rem', backgroundColor: isLight ? '#5C6B61' : '#94A3B8', color: '#FFFFFF', fontWeight: 800, padding: '2px 6px', borderRadius: '2px' }}>LOW</span>
            </div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.68rem', color: isLight ? '#5C6B61' : '#64748B', marginBottom: '8px' }}>Sep 15, 11:30 AM</div>
            <p style={{ fontFamily: 'DM Sans', fontSize: '0.78rem', color: isLight ? '#3A4A3E' : '#D1CCC3', marginBottom: '12px' }}>DALI photocell sensor #14 returned delayed packet. Daylight harvesting nominal.</p>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: isLight ? '#5C6B61' : '#94A3B8', borderTop: isLight ? '1px solid #E2E8DC' : '1px solid #242424', paddingTop: '8px', marginBottom: '10px' }}>
              Consumed: <strong style={{ color: isLight ? '#B45309' : '#E89B3C' }}>62 kWh</strong> Baseline: 60 kWh Var: <strong style={{ color: '#059669' }}>+3.3%</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={handleOpenModal} style={{ background: 'none', border: 'none', color: isLight ? '#0D472B' : '#E89B3C', fontFamily: 'Space Grotesk', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>View Groq Diagnosis →</button>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: isLight ? '#5C6B61' : '#94A3B8' }}>P3 ADVISORY</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Expanded Diagnostic Trigger Button */}
      <div
        style={{
          backgroundColor: isLight ? '#FFFFFF' : '#161616',
          border: isLight ? '1px solid #E2E8DC' : '1px solid #242424',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '36px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.03)' : 'none',
        }}
      >
        <div>
          <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.1rem', fontWeight: 700, color: isLight ? '#0F172A' : '#F5F1E8', marginBottom: '4px' }}>
            Interactive Expanded Modal View
          </h3>
          <p style={{ fontFamily: 'DM Sans', fontSize: '0.85rem', color: isLight ? '#5C6B61' : '#94A3B8' }}>
            Click below to inspect the full expanded telemetry diagnostic overlay modal with phase analysis.
          </p>
        </div>

        <button onClick={handleOpenModal} className="btn-primary" style={{ padding: '10px 20px', backgroundColor: isLight ? '#0D472B' : '#D4841A', color: '#FFFFFF' }}>
          <span>Trigger Anomaly Modal</span>
          <ArrowRight size={16} />
        </button>
      </div>

      {/* Footer */}
      <div style={{ borderTop: isLight ? '1px solid #E2E8DC' : '1px solid #202020', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', fontFamily: 'JetBrains Mono', fontSize: '0.72rem', color: isLight ? '#5C6B61' : '#64748B' }}>
        <span>GridFlex AI Design System • Frame 10 Component Delivery</span>
        <span>CSS: Vanilla CSS // Typography: Syne + Cinzel + Outfit + JetBrains Mono</span>
      </div>
    </div>
  );
}
