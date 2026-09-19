import React from 'react';
import { useBuildingContext } from '../../context/BuildingContext';
import { AlertTriangle, X, Wrench, ShieldAlert, ArrowRight } from 'lucide-react';

export function AnomalyDetailModal() {
  const { selectedAnomaly, setSelectedAnomaly, theme } = useBuildingContext();
  const isLight = theme === 'light';

  if (!selectedAnomaly) return null;

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
          backgroundColor: isLight ? '#FFFFFF' : '#161616',
          border: '1px solid #FF6B5B',
          borderRadius: '8px',
          padding: '28px',
          position: 'relative',
          boxShadow: isLight ? '0 20px 50px rgba(0, 0, 0, 0.12)' : '0 20px 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(255, 107, 91, 0.25)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={() => setSelectedAnomaly(null)}
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

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '6px',
              backgroundColor: 'rgba(255, 107, 91, 0.15)',
              border: '1px solid #FF6B5B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FF6B5B',
            }}
          >
            <AlertTriangle size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h3
                style={{
                  fontFamily: 'Space Grotesk',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: '#F5F1E8',
                }}
              >
                {selectedAnomaly.title || 'Chiller #1 Energy Spike Excursion'}
              </h3>
              <span
                style={{
                  padding: '3px 8px',
                  borderRadius: '3px',
                  backgroundColor: '#FF6B5B',
                  color: '#0F0F0F',
                  fontFamily: 'JetBrains Mono',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                }}
              >
                HIGH SEVERITY
              </span>
            </div>
            <p style={{ fontFamily: 'JetBrains Mono', fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
              Observed Telemetry: {selectedAnomaly.timestamp || 'Sep 15, 14:00 PM IST'} • Zone: Basement 01
            </p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '12px',
            backgroundColor: '#121212',
            padding: '16px',
            borderRadius: '4px',
            border: '1px solid #222222',
            margin: '20px 0',
          }}
        >
          <div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: '#64748B' }}>OBSERVED LOAD</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '1.3rem', fontWeight: 700, color: '#E89B3C' }}>
              {selectedAnomaly.observedLoad || '520 kWh'}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: '#64748B' }}>DYNAMIC BASELINE</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '1.3rem', fontWeight: 700, color: '#94A3B8' }}>
              {selectedAnomaly.baselineLoad || '180 kWh'}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: '#64748B' }}>VARIANCE BREACH</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '1.3rem', fontWeight: 700, color: '#FF6B5B' }}>
              {selectedAnomaly.deviation || '+189.4%'}
            </div>
          </div>
        </div>

        {/* Groq AI Diagnosis Callout */}
        <div
          style={{
            backgroundColor: 'rgba(212, 132, 26, 0.08)',
            borderLeft: '4px solid #D4841A',
            borderTop: '1px solid rgba(212, 132, 26, 0.2)',
            borderRight: '1px solid rgba(212, 132, 26, 0.2)',
            borderBottom: '1px solid rgba(212, 132, 26, 0.2)',
            borderRadius: '4px',
            padding: '16px',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <ShieldAlert size={16} color="#E89B3C" />
            <span
              style={{
                fontFamily: 'JetBrains Mono',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#E89B3C',
                letterSpacing: '0.08em',
              }}
            >
              GROQ NEURAL DIAGNOSTICS (CONFIDENCE: {selectedAnomaly.confidence || 87}%)
            </span>
          </div>
          <p style={{ fontFamily: 'DM Sans', fontSize: '0.88rem', color: '#F5F1E8', leading: '1.5' }}>
            {selectedAnomaly.groqDiagnosis ||
              '78% probability of centrifugal compressor vane degradation or refrigerant flow bottleneck. Immediate service triage advised within 48 hours to avert an estimated +15% ongoing surcharge.'}
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <button
            onClick={() => setSelectedAnomaly(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#E89B3C',
              fontFamily: 'Space Grotesk',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <span>Inspect Raw Phase Telemetry</span>
            <ArrowRight size={14} />
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setSelectedAnomaly(null)}
              style={{
                padding: '10px 16px',
                backgroundColor: '#1E1E1E',
                border: '1px solid #3A3A3A',
                borderRadius: '4px',
                color: '#94A3B8',
                fontFamily: 'Space Grotesk',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Dismiss Alert
            </button>
            <button
              onClick={() => setSelectedAnomaly(null)}
              className="btn-primary"
              style={{ padding: '10px 18px', fontSize: '0.85rem' }}
            >
              <Wrench size={15} />
              <span>Schedule Field Service</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
