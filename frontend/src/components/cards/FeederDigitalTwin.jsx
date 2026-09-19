import React, { useState, useEffect } from 'react';
import { Zap, Building, Home, ShieldCheck, AlertTriangle, TrendingUp } from 'lucide-react';
import { useGridState } from '../../context/GridStateContext';

export function FeederDigitalTwin() {
  const { feederState } = useGridState();

  const transformerLoading = feederState?.transformer_loading || { loading_pct: 73, status: 'NORMAL' };
  const voltageRisk = feederState?.voltage_risk || 'NORMAL';
  const demand = feederState?.demand_kw || 62;
  const solar = feederState?.solar_kw || 28;

  const getLoadingColor = (pct) => {
    if (pct > 90) return { bg: '#FEF2F2', text: '#DC2626', bar: '#DC2626' };
    if (pct > 75) return { bg: '#FEF3C7', text: '#D97706', bar: '#D97706' };
    if (pct > 60) return { bg: '#DBEAFE', text: '#2563EB', bar: '#2563EB' };
    return { bg: '#ECFDF5', text: '#059669', bar: '#059669' };
  };

  const getVoltageRiskColor = (risk) => {
    switch (risk) {
      case 'HIGH': return { bg: '#FEF2F2', text: '#DC2626', border: '#FCA5A5' };
      case 'MEDIUM': return { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' };
      default: return { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' };
    }
  };

  const getSectionColor = (load_pct) => {
    if (load_pct > 85) return '#DC2626';
    if (load_pct > 70) return '#D97706';
    if (load_pct > 50) return '#2563EB';
    return '#059669';
  };

  const loadingStyle = getLoadingColor(transformerLoading.loading_pct);
  const voltageStyle = getVoltageRiskColor(voltageRisk);

  // Simulated section loads
  const sections = [
    { name: 'Section A', load_pct: 65, critical: ['Hospital Annex', 'School'], icon: Building },
    { name: 'Section B', load_pct: 78, critical: ['Community Battery'], icon: Zap },
    { name: 'Section C', load_pct: 45, critical: ['EV Charging'], icon: Home },
  ];

  return (
    <div className="ops-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="ops-panel-header">
        <div className="ops-panel-title">
          <Zap size={16} color="#0284C7" />
          <span>Feeder Digital Twin</span>
        </div>
        <span className="tech-tag">SECTOR 7</span>
      </div>

      <div className="ops-panel-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Transformer Loading */}
        <div style={{
          backgroundColor: loadingStyle.bg,
          border: `1px solid ${loadingStyle.bar}`,
          borderRadius: '6px',
          padding: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: loadingStyle.text, letterSpacing: '0.04em' }}>
              TRANSFORMER LOADING
            </div>
            <div style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: '3px',
              backgroundColor: loadingStyle.text,
              color: 'white'
            }}>
              {transformerLoading.status}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, transformerLoading.loading_pct)}%`,
                  backgroundColor: loadingStyle.bar,
                  borderRadius: '4px',
                  transition: 'width 300ms ease'
                }} />
              </div>
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'monospace', color: loadingStyle.text }}>
              {transformerLoading.loading_pct.toFixed(0)}%
            </div>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '4px' }}>
            500 kVA Capacity · {transformerLoading.load_kva.toFixed(1)} kVA Load
          </div>
        </div>

        {/* Voltage Risk */}
        <div style={{
          backgroundColor: voltageStyle.bg,
          border: `1px solid ${voltageStyle.border}`,
          borderRadius: '6px',
          padding: '10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {voltageRisk === 'HIGH' ? <AlertTriangle size={16} color="#DC2626" /> : <ShieldCheck size={16} color="#059669" />}
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: voltageStyle.text }}>
                VOLTAGE RISK
              </div>
              <div style={{ fontSize: '0.75rem', color: voltageStyle.text }}>
                Solar Penetration: {((solar / 150) * 100).toFixed(0)}%
              </div>
            </div>
          </div>
          <div style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            color: voltageStyle.text
          }}>
            {voltageRisk}
          </div>
        </div>

        {/* Feeder Topology */}
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', marginBottom: '8px' }}>
            FEEDER TOPOLOGY
          </div>
          <div style={{ backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
            {/* Substation */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px',
              backgroundColor: '#FFFFFF',
              borderRadius: '4px',
              border: '1px solid #CBD5E1',
              marginBottom: '8px'
            }}>
              <Zap size={16} color="#0284C7" />
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0F172A' }}>33kV Substation</div>
                <div style={{ fontSize: '0.7rem', color: '#64748B' }}>500 kVA Transformer</div>
              </div>
            </div>

            {/* Sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginLeft: '20px' }}>
              {sections.map((section, idx) => {
                const SectionIcon = section.icon;
                const sectionColor = getSectionColor(section.load_pct);
                return (
                  <div key={section.name} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '4px',
                    border: `1px solid ${sectionColor}`,
                    borderLeftWidth: '4px'
                  }}>
                    <SectionIcon size={14} color={sectionColor} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0F172A' }}>{section.name}</span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, fontFamily: 'monospace', color: sectionColor }}>
                          {section.load_pct}%
                        </span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                        {section.critical.join(', ')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Grid Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem' }}>
          <div style={{ backgroundColor: '#F8FAFC', padding: '8px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
            <div style={{ color: '#64748B', fontWeight: 600 }}>Current Demand</div>
            <div style={{ fontWeight: 700, fontFamily: 'monospace', color: '#0F172A' }}>{demand} kW</div>
          </div>
          <div style={{ backgroundColor: '#F8FAFC', padding: '8px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
            <div style={{ color: '#64748B', fontWeight: 600 }}>Solar Generation</div>
            <div style={{ fontWeight: 700, fontFamily: 'monospace', color: '#059669' }}>{solar} kW</div>
          </div>
        </div>
      </div>
    </div>
  );
}
