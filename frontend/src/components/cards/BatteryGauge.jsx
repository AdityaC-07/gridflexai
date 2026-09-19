import React from 'react';
import { BatteryCharging, Shield } from 'lucide-react';
import { useGridState } from '../../context/GridStateContext';

export function BatteryGauge() {
  const { feederState, isCloudEvent } = useGridState();

  const soc = feederState?.battery_soc_pct ?? 76.0;
  const totalCapacityKwh = 200.0;
  const currentKwh = (soc / 100) * totalCapacityKwh;
  const reserveKwh = 40.0; // 20% of 200 kWh
  const usableKwh = Math.max(0, currentKwh - reserveKwh);

  return (
    <div className="ops-panel" style={{ padding: '0', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="ops-panel-header">
        <div className="ops-panel-title">
          <BatteryCharging size={16} color="#9333EA" />
          <span>Battery Storage Asset</span>
        </div>
        <span className="tech-tag tech-tag-blue">BESS-F01 · 200 kWh</span>
      </div>

      <div className="ops-panel-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Custom Industrial SVG Battery Visualization */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', backgroundColor: '#FAFAFC', padding: '16px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
          
          {/* SVG Battery Body */}
          <div style={{ width: '90px', position: 'relative' }}>
            <svg viewBox="0 0 100 180" style={{ width: '100%', height: 'auto', display: 'block' }}>
              {/* Battery Terminal Cap */}
              <rect x="35" y="0" width="30" height="8" rx="2" fill="#475569" />

              {/* Main Outer Battery Shell */}
              <rect x="5" y="8" width="90" height="168" rx="8" fill="#FFFFFF" stroke="#334155" strokeWidth="3" />

              {/* 20% Reserve Line (dotted) */}
              <line x1="5" y1="142" x2="95" y2="142" stroke="#DC2626" strokeWidth="2" strokeDasharray="3 3" />

              {/* Usable / Current Energy Fill */}
              <rect
                x="9"
                y={172 - (soc / 100) * 160}
                width="82"
                height={(soc / 100) * 160}
                rx="4"
                fill={isCloudEvent ? '#9333EA' : '#7C3AED'}
                opacity={0.85}
              />

              {/* Reserve Fill Zone (Below 20% line) */}
              <rect
                x="9"
                y="142"
                width="82"
                height="30"
                rx="4"
                fill="#FCA5A5"
                opacity={0.5}
              />
            </svg>
          </div>

          {/* Metrics Column */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.675rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.04em' }}>
              STATE OF CHARGE
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'monospace', color: '#0F172A', lineHeight: 1 }}>
              {soc}%
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '4px' }}>
              Total Energy: <strong style={{ color: '#0F172A' }}>{currentKwh.toFixed(0)} kWh</strong>
            </div>

            <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed #CBD5E1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
                <Shield size={14} /> Usable Capacity: {usableKwh.toFixed(0)} kWh
              </div>
              <div style={{ fontSize: '0.7rem', color: '#DC2626', marginTop: '2px', fontWeight: 500 }}>
                20% Safety Reserve: 40 kWh locked
              </div>
            </div>
          </div>
        </div>

        {/* Dispatch Capability & Specs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem' }}>
          <div style={{ backgroundColor: '#F8FAFC', padding: '8px 10px', borderRadius: '4px' }}>
            <span style={{ color: '#64748B' }}>Max Discharge:</span>
            <div style={{ fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>80.0 kW</div>
          </div>
          <div style={{ backgroundColor: '#F8FAFC', padding: '8px 10px', borderRadius: '4px' }}>
            <span style={{ color: '#64748B' }}>Target Dispatch:</span>
            <div style={{ fontWeight: 700, color: '#9333EA', fontFamily: 'monospace' }}>
              {isCloudEvent ? '70.0 kW (2.5h)' : '0.0 kW (Standby)'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
