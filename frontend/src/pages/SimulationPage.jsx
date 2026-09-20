import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sliders, CloudRain, RotateCcw, ArrowRight, Zap, Database } from 'lucide-react';
import { useGridState } from '../context/GridStateContext';
import { useBuildingContext } from '../context/BuildingContext';

export function SimulationPage() {
  const navigate = useNavigate();
  const { isCloudEvent, triggerCloudEvent, resetSimulation, isLoading } = useGridState();
  const { theme } = useBuildingContext();
  const isLight = theme === 'light';

  // Theme tokens
  const bg        = isLight ? '#FFFFFF' : '#111111';
  const bgPage    = isLight ? '#F4F7EF' : '#0F0F0F';
  const border    = isLight ? '#E2E8DC' : '#1E1E1E';
  const borderMid = isLight ? '#E2E8F0' : '#242424';
  const textPri   = isLight ? '#0F172A' : '#F5F1E8';
  const textSec   = isLight ? '#475569' : '#94A3B8';
  const textDim   = isLight ? '#64748B' : '#64748B';
  const bgCard    = isLight ? '#FAFAFC' : '#161616';

  // Cloud event palette
  const cloudBg     = isLight ? '#FFFBEB' : '#1C1608';
  const cloudBorder = isLight ? '#FDE68A' : '#78350F';
  const cloudTitle  = isLight ? '#78350F' : '#FCD34D';
  const cloudSub    = isLight ? '#92400E' : '#FDE68A';

  // Normal palette
  const normalBg     = isLight ? '#ECFDF5' : '#071410';
  const normalBorder = isLight ? '#A7F3D0' : '#064E3B';
  const normalTitle  = isLight ? '#065F46' : '#34D399';
  const normalSub    = isLight ? '#047857' : '#6EE7B7';

  // Param cards
  const paramBg     = isLight ? '#F8FAFC' : '#161616';
  const paramBorder = isLight ? '#E2E8F0' : '#242424';

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', color: textPri }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sliders size={24} color={isLight ? '#0284C7' : '#E89B3C'} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: textPri }}>
            Grid Operations Scenario Simulator
          </h2>
        </div>
        <p style={{ fontSize: '0.875rem', color: textDim, marginTop: '2px' }}>
          Inject physical solar cloud events or demand surges to evaluate GridFlex AI intelligence response.
        </p>
      </div>

      {/* Main Control Console */}
      <div style={{ backgroundColor: bg, border: `1px solid ${border}`, borderRadius: '6px', padding: '24px', marginBottom: '24px' }}>

        {/* Panel header */}
        <div style={{
          margin: '-24px -24px 20px -24px',
          padding: '12px 20px',
          backgroundColor: isLight ? '#F8FAFC' : '#0A0A0A',
          borderBottom: `1px solid ${borderMid}`,
          borderRadius: '6px 6px 0 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 700, color: textSec, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <Zap size={16} color={isLight ? '#0284C7' : '#E89B3C'} />
            <span>Target Asset: Feeder F01 (Dharavi North)</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span className="tech-tag tech-tag-amber" style={{ gap: '4px' }}>
              <Database size={11} />
              SCENARIO MODE · Local Scenario Injection
            </span>
            <span className={`tech-tag ${isCloudEvent ? 'tech-tag-warning' : 'tech-tag-ok'}`}>
              STATUS: {isCloudEvent ? 'CLOUD EVENT ACTIVE' : 'BALANCED'}
            </span>
          </div>
        </div>

        {/* Status Box */}
        <div style={{
          backgroundColor: isCloudEvent ? cloudBg : normalBg,
          border: `1px solid ${isCloudEvent ? cloudBorder : normalBorder}`,
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: isCloudEvent ? (isLight ? '#B45309' : '#FBBF24') : (isLight ? '#047857' : '#34D399'), letterSpacing: '0.05em' }}>
              OPERATING CONDITION
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: isCloudEvent ? cloudTitle : normalTitle, marginTop: '2px' }}>
              {isCloudEvent ? 'Severe Cloud Event Active (79% Degradation)' : 'Normal Solar & Demand Profile'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: isCloudEvent ? cloudSub : normalSub, marginTop: '4px' }}>
              {isCloudEvent
                ? 'Solar output collapsed from ~118 kW to ~25 kW. 80 kW net energy gap active.'
                : 'Solar generation ~118 kW, demand ~162 kW. Zero net energy gap.'}
            </p>
          </div>

          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
            {isCloudEvent ? (
              <>
                <span className="tech-tag tech-tag-warning" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
                  79% SEVERITY
                </span>
                <button
                  onClick={() => navigate('/operator')}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '8px 14px', borderRadius: '4px',
                    backgroundColor: '#D97706', border: 'none', color: '#FFFFFF',
                    fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
                  }}
                >
                  <span>VIEW GRID IMPACT</span>
                  <ArrowRight size={14} />
                </button>
              </>
            ) : (
              <span className="tech-tag tech-tag-ok" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
                0% DEGRADATION
              </span>
            )}
          </div>
        </div>

        {/* Trigger Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

          {/* Inject Cloud Event */}
          <div style={{
            backgroundColor: bgCard,
            border: `1px solid ${borderMid}`,
            borderRadius: '8px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '16px',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#D97706', fontWeight: 700, fontSize: '0.95rem' }}>
                <CloudRain size={20} />
                <span>Inject Cloud Event</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: textSec, marginTop: '6px', lineHeight: 1.4 }}>
                Simulates rapid solar irradiance loss over Dharavi North. Solar generation drops by 79% (118 kW → 25 kW) for a 150-minute duration.
              </p>
            </div>
            <button
              onClick={() => triggerCloudEvent(79)}
              disabled={isLoading || isCloudEvent}
              style={{
                width: '100%', padding: '12px',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                backgroundColor: isLoading || isCloudEvent ? (isLight ? '#D1D5DB' : '#2A2A2A') : '#D97706',
                border: 'none', borderRadius: '4px',
                color: isLoading || isCloudEvent ? (isLight ? '#9CA3AF' : '#64748B') : '#FFFFFF',
                fontWeight: 700, fontSize: '0.85rem',
                cursor: isLoading || isCloudEvent ? 'not-allowed' : 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              <CloudRain size={16} />
              <span>Trigger Cloud Event — Severe (79%)</span>
            </button>
          </div>

          {/* Reset to Normal */}
          <div style={{
            backgroundColor: bgCard,
            border: `1px solid ${borderMid}`,
            borderRadius: '8px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '16px',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', fontWeight: 700, fontSize: '0.95rem' }}>
                <RotateCcw size={20} />
                <span>Reset to Balanced State</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: textSec, marginTop: '6px', lineHeight: 1.4 }}>
                Clears all cloud events and restores standard daylight solar irradiance profiles and normal demand telemetry.
              </p>
            </div>
            <button
              onClick={() => resetSimulation()}
              disabled={isLoading || !isCloudEvent}
              style={{
                width: '100%', padding: '12px',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                backgroundColor: 'transparent',
                border: `1px solid ${isLoading || !isCloudEvent ? (isLight ? '#D1D5DB' : '#333') : (isLight ? '#D1D5DB' : '#3A3A3A')}`,
                borderRadius: '4px',
                color: isLoading || !isCloudEvent ? (isLight ? '#9CA3AF' : '#4B5563') : textPri,
                fontWeight: 600, fontSize: '0.85rem',
                cursor: isLoading || !isCloudEvent ? 'not-allowed' : 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              <RotateCcw size={16} />
              <span>Reset Scenario to Normal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scenario Parameters */}
      <div style={{ backgroundColor: bg, border: `1px solid ${border}`, borderRadius: '6px', padding: '20px' }}>
        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: textSec, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
          Simulated Cloud Event Parameters (Backend Contract)
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', fontSize: '0.775rem' }}>
          {[
            { label: 'SEVERITY DEGRADATION', value: '79%', color: '#D97706' },
            { label: 'DURATION WINDOW',      value: '150 Minutes', color: textPri },
            { label: 'SOLAR BEFORE / AFTER', value: '118 kW → 25 kW', color: textPri },
            { label: 'RESULTING ENERGY GAP', value: '80 kW', color: '#DC2626' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ backgroundColor: paramBg, border: `1px solid ${paramBorder}`, padding: '10px', borderRadius: '4px' }}>
              <div style={{ color: textDim, fontSize: '0.68rem', marginBottom: '4px' }}>{label}</div>
              <div style={{ fontWeight: 700, color, fontFamily: 'monospace', fontSize: '1rem' }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
