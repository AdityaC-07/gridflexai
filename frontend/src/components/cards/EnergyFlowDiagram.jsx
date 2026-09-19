import React from 'react';
import { Activity } from 'lucide-react';
import { useGridState } from '../../context/GridStateContext';

export function EnergyFlowDiagram() {
  const { feederState, isCloudEvent, scenarioFeeder } = useGridState();

  // Scenario overlay: node values come from the shared scenario definition
  // while active (header tag switches to SCENARIO). Battery dispatch shown is
  // the scenario's planned support level, not a live dispatch measurement.
  const S = scenarioFeeder || null;
  const solarKw = S?.solar_kw ?? feederState?.solar_kw ?? 118;
  const demandKw = S?.demand_kw ?? feederState?.demand_kw ?? 162;
  const batteryDispatchKw = S ? (S.battery_coverage_kw ?? 70.0) : 0.0;
  const gridImportKw = S?.grid_import_kw ?? feederState?.grid_import_kw ?? 44;

  return (
    <div className="ops-panel" style={{ padding: '0', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="ops-panel-header">
        <div className="ops-panel-title">
          <Activity size={16} color="#059669" />
          <span>Feeder Topology & Energy Flow</span>
        </div>
        <span className={`tech-tag ${S ? 'tech-tag-warning' : 'tech-tag-ok'}`}>
          {S ? 'SCENARIO · SINGLE-LINE DIAGRAM' : 'SINGLE-LINE DIAGRAM'}
        </span>
      </div>

      <div className="ops-panel-body" style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <svg viewBox="0 0 540 220" style={{ width: '100%', height: 'auto' }}>
          <defs>
            <marker id="arrow-blue" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#0284C7" />
            </marker>
            <marker id="arrow-amber" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#D97706" />
            </marker>
            <marker id="arrow-purple" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#9333EA" />
            </marker>
          </defs>

          {/* 1. Solar -> Central Bus */}
          <line
            x1="100" y1="50" x2="250" y2="105"
            stroke="#D97706"
            strokeWidth={isCloudEvent ? "1.5" : "3"}
            strokeDasharray={isCloudEvent ? "4 4" : "none"}
            markerEnd="url(#arrow-amber)"
          />

          {/* 2. Grid -> Central Bus */}
          <line
            x1="100" y1="165" x2="250" y2="115"
            stroke="#0284C7"
            strokeWidth="3"
            markerEnd="url(#arrow-blue)"
          />

          {/* 3. Central Bus -> Community Load */}
          <line
            x1="290" y1="110" x2="430" y2="50"
            stroke="#0284C7"
            strokeWidth="3.5"
            markerEnd="url(#arrow-blue)"
          />

          {/* 4. Battery -> Central Bus (Prominent during cloud event) */}
          <line
            x1="270" y1="200" x2="270" y2="130"
            stroke="#9333EA"
            strokeWidth={isCloudEvent ? "4" : "1.5"}
            strokeDasharray={isCloudEvent ? "none" : "3 3"}
            markerEnd="url(#arrow-purple)"
          />

          {/* Flow Indicator Label */}
          {isCloudEvent && (
            <text x="315" y="165" fontSize="9" fontWeight="800" fill="#9333EA">
              DISCHARGING →
            </text>
          )}

          {/* Node 1: Solar Substation */}
          <g transform="translate(40, 25)">
            <rect width="85" height="50" rx="6" fill="#FFFBEB" stroke="#FDE68A" strokeWidth="1.5" />
            <text x="42" y="22" textAnchor="middle" fontSize="10" fontWeight="700" fill="#D97706">SOLAR PV</text>
            <text x="42" y="38" textAnchor="middle" fontSize="12" fontWeight="800" fontFamily="monospace" fill="#0F172A">{solarKw} kW</text>
          </g>

          {/* Node 2: Main Grid Infeed */}
          <g transform="translate(40, 140)">
            <rect width="85" height="50" rx="6" fill="#F0F9FF" stroke="#BAE6FD" strokeWidth="1.5" />
            <text x="42" y="22" textAnchor="middle" fontSize="10" fontWeight="700" fill="#0284C7">DISCOM GRID</text>
            <text x="42" y="38" textAnchor="middle" fontSize="12" fontWeight="800" fontFamily="monospace" fill="#0F172A">{gridImportKw} kW</text>
          </g>

          {/* Node 3: Central Feeder Bus F01 */}
          <g transform="translate(245, 85)">
            <circle cx="25" cy="25" r="22" fill="#0F172A" />
            <text x="25" y="28" textAnchor="middle" fontSize="10" fontWeight="800" fill="#38BDF8">F01</text>
          </g>

          {/* Node 4: Community Load */}
          <g transform="translate(425, 25)">
            <rect width="95" height="50" rx="6" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
            <text x="47" y="22" textAnchor="middle" fontSize="10" fontWeight="700" fill="#334155">COMMUNITY</text>
            <text x="47" y="38" textAnchor="middle" fontSize="12" fontWeight="800" fontFamily="monospace" fill="#0F172A">{demandKw} kW</text>
          </g>

          {/* Node 5: Battery Storage Asset */}
          <g transform="translate(225, 175)">
            <rect width="90" height="40" rx="6" fill={isCloudEvent ? "#F3E8FF" : "#F8FAFC"} stroke={isCloudEvent ? "#C084FC" : "#CBD5E1"} strokeWidth="1.5" />
            <text x="45" y="18" textAnchor="middle" fontSize="9" fontWeight="700" fill="#9333EA">BATTERY BESS</text>
            <text x="45" y="32" textAnchor="middle" fontSize="11" fontWeight="800" fontFamily="monospace" fill="#0F172A">
              {batteryDispatchKw > 0 ? `+${batteryDispatchKw} kW` : 'Standby'}
            </text>
          </g>
        </svg>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', color: '#64748B', marginTop: '4px', borderTop: '1px solid #F1F5F9', paddingTop: '6px' }}>
          <span>Topology: Radial Feeder</span>
          <span>Bus Limit: 200 kW</span>
          <span>State: {isCloudEvent ? 'Grid Support Active' : 'Balanced'}</span>
        </div>
      </div>
    </div>
  );
}
