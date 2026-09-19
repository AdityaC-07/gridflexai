import React from 'react';
import { useBuildingContext } from '../../context/BuildingContext';
import { X, Octagon, Cpu } from 'lucide-react';

export function AnalysisLoadingModal() {
  const { isAnalyzing, closeModals, theme } = useBuildingContext();
  const isLight = theme === 'light';

  if (!isAnalyzing) return null;

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
          width: '560px',
          maxWidth: '100%',
          backgroundColor: isLight ? '#FFFFFF' : '#161616',
          border: isLight ? '1px solid #DAE2D2' : '1px solid #282828',
          borderRadius: '8px',
          padding: '36px',
          position: 'relative',
          boxShadow: isLight ? '0 20px 50px rgba(0, 0, 0, 0.12)' : '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(212, 132, 26, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
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

        {/* Header Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 12px',
            backgroundColor: '#1E1E1E',
            border: '1px solid #2E2E2E',
            borderRadius: '4px',
            marginBottom: '20px',
            fontFamily: 'JetBrains Mono',
            fontSize: '0.68rem',
            fontWeight: 600,
            color: '#D1CCC3',
            letterSpacing: '0.1em',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#34D399',
              boxShadow: '0 0 6px #34D399',
            }}
          />
          AI ENGINE V4.2 • SYNCHRONIZING
        </div>

        {/* Title */}
        <h2
          style={{
            fontFamily: 'Space Grotesk',
            fontSize: '1.8rem',
            fontWeight: 600,
            color: '#F5F1E8',
            marginBottom: '28px',
          }}
        >
          Analyzing Building
        </h2>

        {/* Glowing Orange Pulse Node */}
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '16px',
            backgroundColor: 'rgba(212, 132, 26, 0.12)',
            border: '1.5px solid #D4841A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '28px',
            boxShadow: '0 0 30px rgba(212, 132, 26, 0.35)',
            position: 'relative',
          }}
          className="animate-pulse-glow"
        >
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#E89B3C',
              boxShadow: '0 0 12px #E89B3C',
            }}
          />
        </div>

        {/* Status indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.92rem',
            fontFamily: 'Space Grotesk',
            color: '#E89B3C',
            marginBottom: '32px',
          }}
        >
          <Cpu size={16} />
          <span>Analyzing energy patterns...</span>
        </div>

        {/* Step indicators */}
        <div
          style={{
            display: 'flex',
            width: '100%',
            gap: '8px',
            marginBottom: '24px',
            borderBottom: '1px solid #242424',
            paddingBottom: '12px',
          }}
        >
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: '#D4841A', fontWeight: 700 }}>
              LOAD
            </div>
            <div
              style={{
                height: '3px',
                backgroundColor: '#D4841A',
                borderRadius: '2px',
                marginTop: '6px',
                boxShadow: '0 0 8px rgba(212, 132, 26, 0.6)',
              }}
            />
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: '#64748B' }}>HVAC</div>
            <div style={{ height: '3px', backgroundColor: '#242424', borderRadius: '2px', marginTop: '6px' }} />
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: '#64748B' }}>ENGINE</div>
            <div style={{ height: '3px', backgroundColor: '#242424', borderRadius: '2px', marginTop: '6px' }} />
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: '#64748B' }}>SYNTH</div>
            <div style={{ height: '3px', backgroundColor: '#242424', borderRadius: '2px', marginTop: '6px' }} />
          </div>
        </div>

        <p style={{ fontFamily: 'DM Sans', fontSize: '0.82rem', color: '#94A3B8', marginBottom: '24px' }}>
          Usually takes 15–30 seconds
        </p>

        {/* Cancel CTA */}
        <button
          onClick={closeModals}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            backgroundColor: '#1E1E1E',
            border: '1px solid #3A3A3A',
            borderRadius: '4px',
            color: '#E89B3C',
            fontFamily: 'Space Grotesk',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: '32px',
          }}
        >
          <Octagon size={15} color="#E89B3C" />
          <span>Cancel Analysis</span>
        </button>

        {/* Telemetry metadata footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
            paddingTop: '16px',
            borderTop: '1px solid #222222',
            fontFamily: 'JetBrains Mono',
            fontSize: '0.68rem',
            color: '#64748B',
          }}
        >
          <span>SESSION: 0X9AF48E</span>
          <span>LATENCY: 18MS</span>
          <span>PEER: DEL-NODE-7</span>
        </div>
      </div>
    </div>
  );
}
