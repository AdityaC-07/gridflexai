import React from 'react';
import { Zap, Building, Home, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useGridState } from '../../context/GridStateContext';
import { useBuildingContext } from '../../context/BuildingContext';

export function FeederDigitalTwin() {
  const { feederState } = useGridState();
  const { theme } = useBuildingContext();
  const isLight = theme === 'light';

  const transformerLoading = feederState?.transformer_loading || { loading_pct: 27, load_kva: 136.1, status: 'NORMAL' };
  const voltageRisk = feederState?.voltage_risk || 'NORMAL';
  const demand = feederState?.demand_kw || 122;
  const solar  = feederState?.solar_kw  || 118;

  // Theme tokens
  const bg     = isLight ? '#F8FAFC' : '#111111';
  const bgCard = isLight ? '#FFFFFF'  : '#1A1A1A';
  const border = isLight ? '#E2E8F0'  : '#242424';
  const borderMid = isLight ? '#CBD5E1' : '#2A2A2A';
  const valCol = isLight ? '#0F172A'  : '#F5F1E8';
  const dimCol = isLight ? '#64748B'  : '#64748B';
  const subCol = isLight ? '#0F172A'  : '#F5F1E8';
  const subSub = isLight ? '#64748B'  : '#64748B';
  const bgMini = isLight ? '#F8FAFC'  : '#161616';

  const getLoadingColor = (pct) => {
    if (pct > 90) return { bg: isLight ? '#FEF2F2' : 'rgba(220,38,38,0.12)', text: '#DC2626', bar: '#DC2626' };
    if (pct > 75) return { bg: isLight ? '#FEF3C7' : 'rgba(217,119,6,0.12)',  text: '#D97706', bar: '#D97706' };
    if (pct > 60) return { bg: isLight ? '#DBEAFE' : 'rgba(37,99,235,0.12)',  text: '#2563EB', bar: '#2563EB' };
    return          { bg: isLight ? '#ECFDF5' : 'rgba(5,150,105,0.12)',  text: '#059669', bar: '#059669' };
  };

  const getVoltageStyle = (risk) => {
    const m = {
      HIGH:   { bg: isLight ? '#FEF2F2' : 'rgba(220,38,38,0.12)', text: '#DC2626', border: isLight ? '#FCA5A5' : 'rgba(220,38,38,0.3)' },
      MEDIUM: { bg: isLight ? '#FEF3C7' : 'rgba(217,119,6,0.12)',  text: '#D97706', border: isLight ? '#FDE68A' : 'rgba(217,119,6,0.3)' },
      NORMAL: { bg: isLight ? '#ECFDF5' : 'rgba(5,150,105,0.12)',  text: '#059669', border: isLight ? '#A7F3D0' : 'rgba(5,150,105,0.3)' },
    };
    return m[risk] || m.NORMAL;
  };

  const getSectionColor = (pct) => pct > 85 ? '#DC2626' : pct > 70 ? '#D97706' : pct > 50 ? '#2563EB' : '#059669';

  const loadStyle    = getLoadingColor(transformerLoading.loading_pct);
  const voltageStyle = getVoltageStyle(voltageRisk);

  const sections = [
    { name: 'Section A', load_pct: 65, critical: ['Hospital Annex', 'School'], icon: Building },
    { name: 'Section B', load_pct: 78, critical: ['Community Battery'], icon: Zap },
    { name: 'Section C', load_pct: 45, critical: ['EV Charging'], icon: Home },
  ];

  return (
    <div className="ops-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="ops-panel-header">
        <div className="ops-panel-title">
          <Zap size={16} color={isLight ? '#0284C7' : '#E89B3C'} />
          <span>Feeder Digital Twin</span>
        </div>
        <span className="tech-tag">DHARAVI NORTH</span>
      </div>

      <div className="ops-panel-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Transformer Loading */}
        <div style={{ backgroundColor: loadStyle.bg, border: `1px solid ${loadStyle.bar}`, borderRadius: '6px', padding: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: loadStyle.text, letterSpacing: '0.04em' }}>TRANSFORMER LOADING</div>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, padding: '2px 6px', borderRadius: '3px', backgroundColor: loadStyle.text, color: 'white' }}>
              {transformerLoading.status}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ height: '8px', backgroundColor: isLight ? '#E2E8F0' : '#2A2A2A', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, transformerLoading.loading_pct)}%`, backgroundColor: loadStyle.bar, borderRadius: '4px', transition: 'width 300ms ease' }} />
              </div>
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'monospace', color: loadStyle.text }}>
              {transformerLoading.loading_pct.toFixed(0)}%
            </div>
          </div>
          <div style={{ fontSize: '0.7rem', color: dimCol, marginTop: '4px' }}>
            500 kVA Capacity · {transformerLoading.load_kva?.toFixed(1)} kVA Load
          </div>
        </div>

        {/* Voltage Risk */}
        <div style={{ backgroundColor: voltageStyle.bg, border: `1px solid ${voltageStyle.border}`, borderRadius: '6px', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {voltageRisk === 'HIGH' ? <AlertTriangle size={16} color="#DC2626" /> : <ShieldCheck size={16} color="#059669" />}
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: voltageStyle.text }}>VOLTAGE RISK</div>
              <div style={{ fontSize: '0.75rem', color: voltageStyle.text }}>Solar Penetration: {((solar / 150) * 100).toFixed(0)}%</div>
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: voltageStyle.text }}>{voltageRisk}</div>
        </div>

        {/* Feeder Topology */}
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: dimCol, marginBottom: '8px' }}>FEEDER TOPOLOGY</div>
          <div style={{ backgroundColor: bg, padding: '12px', borderRadius: '6px', border: `1px solid ${border}` }}>
            {/* Substation node */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', backgroundColor: bgCard, borderRadius: '4px', border: `1px solid ${borderMid}`, marginBottom: '8px' }}>
              <Zap size={16} color={isLight ? '#0284C7' : '#E89B3C'} />
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: subCol }}>33kV Substation</div>
                <div style={{ fontSize: '0.7rem', color: subSub }}>500 kVA Transformer</div>
              </div>
            </div>
            {/* Sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginLeft: '20px' }}>
              {sections.map((section) => {
                const Icon = section.icon;
                const color = getSectionColor(section.load_pct);
                return (
                  <div key={section.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', backgroundColor: bgCard, borderRadius: '4px', border: `1px solid ${color}`, borderLeftWidth: '4px' }}>
                    <Icon size={14} color={color} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: subCol }}>{section.name}</span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, fontFamily: 'monospace', color }}>{section.load_pct}%</span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: subSub }}>{section.critical.join(', ')}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Grid Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem' }}>
          <div style={{ backgroundColor: bgMini, padding: '8px', borderRadius: '4px', border: `1px solid ${border}` }}>
            <div style={{ color: dimCol, fontWeight: 600 }}>Current Demand</div>
            <div style={{ fontWeight: 700, fontFamily: 'monospace', color: valCol }}>{demand} kW</div>
          </div>
          <div style={{ backgroundColor: bgMini, padding: '8px', borderRadius: '4px', border: `1px solid ${border}` }}>
            <div style={{ color: dimCol, fontWeight: 600 }}>Solar Generation</div>
            <div style={{ fontWeight: 700, fontFamily: 'monospace', color: '#059669' }}>{solar} kW</div>
          </div>
        </div>
      </div>
    </div>
  );
}
