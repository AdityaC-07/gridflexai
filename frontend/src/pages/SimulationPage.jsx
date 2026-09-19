import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sliders, CloudRain, RotateCcw, ArrowRight, Zap, Database } from 'lucide-react';
import { useGridState } from '../context/GridStateContext';

export function SimulationPage() {
  const navigate = useNavigate();
  const { isCloudEvent, triggerCloudEvent, resetSimulation, isLoading, isUsingMock } = useGridState();

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sliders size={24} color="#0284C7" />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0F172A' }}>
            Grid Operations Scenario Simulator
          </h2>
        </div>
        <p style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '2px' }}>
          Inject physical solar cloud events or demand surges to evaluate GridFlex AI intelligence response.
        </p>
      </div>

      {/* Main Control Console Card */}
      <div className="ops-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <div className="ops-panel-header" style={{ margin: '-24px -24px 20px -24px', borderRadius: '6px 6px 0 0' }}>
          <div className="ops-panel-title">
            <Zap size={16} color="#0284C7" />
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
          backgroundColor: isCloudEvent ? '#FFFBEB' : '#ECFDF5',
          border: isCloudEvent ? '1px solid #FDE68A' : '1px solid #A7F3D0',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: isCloudEvent ? '#B45309' : '#047857', letterSpacing: '0.05em' }}>
              OPERATING CONDITION
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: isCloudEvent ? '#78350F' : '#065F46', marginTop: '2px' }}>
              {isCloudEvent ? 'Severe Cloud Event Active (79% Degradation)' : 'Normal Solar & Demand Profile'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: isCloudEvent ? '#92400E' : '#047857', marginTop: '4px' }}>
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
                {/* Priority 13: View Grid Impact Navigation CTA */}
                <button
                  onClick={() => navigate('/operator')}
                  className="ops-btn ops-btn-warning"
                  style={{ fontSize: '0.8rem', padding: '8px 14px', boxShadow: '0 2px 4px rgba(217, 119, 6, 0.15)' }}
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
          
          {/* Action 1: Trigger Cloud Event */}
          <div style={{
            backgroundColor: '#FAFAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justify: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#D97706', fontWeight: 700, fontSize: '0.95rem' }}>
                <CloudRain size={20} />
                <span>Inject Cloud Event</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '6px', lineHeight: 1.4 }}>
                Simulates rapid solar irradiance loss over Dharavi North. Solar generation drops by 79% (118 kW → 25 kW) for a 150-minute duration.
              </p>
            </div>

            <button
              onClick={() => triggerCloudEvent(79)}
              disabled={isLoading || isCloudEvent}
              className="ops-btn ops-btn-warning"
              style={{ width: '100%', marginTop: '20px', padding: '12px' }}
            >
              <CloudRain size={16} />
              <span>Trigger Cloud Event — Severe (79%)</span>
            </button>
          </div>

          {/* Action 2: Reset to Normal State */}
          <div style={{
            backgroundColor: '#FAFAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justify: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', fontWeight: 700, fontSize: '0.95rem' }}>
                <RotateCcw size={20} />
                <span>Reset to Balanced State</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '6px', lineHeight: 1.4 }}>
                Clears all cloud events and restores standard daylight solar irradiance profiles and normal demand telemetry.
              </p>
            </div>

            <button
              onClick={() => resetSimulation()}
              disabled={isLoading || !isCloudEvent}
              className="ops-btn ops-btn-outline"
              style={{ width: '100%', marginTop: '20px', padding: '12px' }}
            >
              <RotateCcw size={16} />
              <span>Reset Scenario to Normal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scenario Parameters Card */}
      <div className="ops-panel" style={{ padding: '20px' }}>
        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
          Simulated Cloud Event Parameters (Backend Contract)
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', fontSize: '0.775rem' }}>
          <div style={{ backgroundColor: '#F8FAFC', padding: '10px', borderRadius: '4px' }}>
            <div style={{ color: '#64748B' }}>SEVERITY DEGRADATION</div>
            <div style={{ fontWeight: 700, color: '#D97706', fontFamily: 'monospace', fontSize: '1rem' }}>79%</div>
          </div>

          <div style={{ backgroundColor: '#F8FAFC', padding: '10px', borderRadius: '4px' }}>
            <div style={{ color: '#64748B' }}>DURATION WINDOW</div>
            <div style={{ fontWeight: 700, color: '#0F172A', fontFamily: 'monospace', fontSize: '1rem' }}>150 Minutes</div>
          </div>

          <div style={{ backgroundColor: '#F8FAFC', padding: '10px', borderRadius: '4px' }}>
            <div style={{ color: '#64748B' }}>SOLAR BEFORE / AFTER</div>
            <div style={{ fontWeight: 700, color: '#0F172A', fontFamily: 'monospace', fontSize: '0.95rem' }}>118 kW → 25 kW</div>
          </div>

          <div style={{ backgroundColor: '#F8FAFC', padding: '10px', borderRadius: '4px' }}>
            <div style={{ color: '#64748B' }}>RESULTING ENERGY GAP</div>
            <div style={{ fontWeight: 700, color: '#DC2626', fontFamily: 'monospace', fontSize: '1rem' }}>80 kW</div>
          </div>
        </div>
      </div>
    </div>
  );
}
