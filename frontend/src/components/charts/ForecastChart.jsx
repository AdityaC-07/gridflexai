import React from 'react';
import {
  ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis,
  Tooltip, Legend, ReferenceArea, CartesianGrid,
} from 'recharts';
import { useGridState } from '../../context/GridStateContext';
import { useBuildingContext } from '../../context/BuildingContext';
import { Zap } from 'lucide-react';

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{
        backgroundColor: '#0F172A',
        color: '#F8FAFC',
        padding: '10px 14px',
        borderRadius: '6px',
        fontSize: '0.775rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        border: '1px solid #334155',
      }}>
        <div style={{ fontWeight: 700, borderBottom: '1px solid #334155', paddingBottom: '4px', marginBottom: '6px', color: '#38BDF8' }}>
          TIME: {label} IST
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <span style={{ color: '#94A3B8' }}>Demand: </span>
            <span style={{ fontWeight: 700, color: '#38BDF8', fontFamily: 'monospace' }}>{data.demand_kw} kW</span>
          </div>
          <div>
            <span style={{ color: '#94A3B8' }}>Solar: </span>
            <span style={{ fontWeight: 700, color: '#F59E0B', fontFamily: 'monospace' }}>{data.solar_kw} kW</span>
          </div>
          {data.gap_kw > 0 && (
            <div style={{ gridColumn: 'span 2', borderTop: '1px solid #334155', paddingTop: '4px', color: '#EF4444' }}>
              <span>Energy Gap: </span>
              <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{data.gap_kw} kW</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
}

export function ForecastChart() {
  const { forecastData, isCloudEvent } = useGridState();
  const { theme } = useBuildingContext();
  const isLight = theme === 'light';

  const data = forecastData?.points || [];

  const gridStroke = isLight ? '#E2E8F0' : '#242424';
  const axisStroke = isLight ? '#64748B' : '#64748B';
  const valCol     = isLight ? '#0F172A'  : '#F5F1E8';
  const dimCol     = '#64748B';

  return (
    <div className="ops-panel" style={{ padding: '0', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="ops-panel-header">
        <div className="ops-panel-title">
          <span>24-Hour Energy Forecast</span>
          <span className="tech-tag tech-tag-blue">FORECAST · NEXT 24 HOURS</span>
        </div>
        <div style={{ fontSize: '0.725rem', color: dimCol }}>
          Model Gate: <strong style={{ color: valCol }}>{forecastData?.forecast_confidence_pct || 89}% Confidence</strong>
        </div>
      </div>

      <div className="ops-panel-body" style={{ flex: 1, minHeight: '320px', position: 'relative' }}>
        {isCloudEvent && (
          <div style={{
            position: 'absolute', top: '14px', right: '24px', zIndex: 10,
            backgroundColor: isLight ? '#FEF3C7' : 'rgba(217,119,6,0.15)',
            border: isLight ? '1px solid #FDE68A' : '1px solid rgba(217,119,6,0.4)',
            borderRadius: '4px', padding: '4px 10px',
            fontSize: '0.725rem', fontWeight: 600, color: '#B45309',
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Zap size={13} color="#B45309" /> Cloud Window Highlighted (15:00 - 17:30)
            </span>
          </div>
        )}

        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
            <XAxis dataKey="time" stroke={axisStroke} fontSize={11} tickLine={false} tick={{ fill: axisStroke }} />
            <YAxis stroke={axisStroke} fontSize={11} tickLine={false} unit=" kW" domain={[0, 200]} tick={{ fill: axisStroke }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
              iconType="circle"
            />

            {/* Cloud Event Window Highlight */}
            {isCloudEvent && (
              <ReferenceArea
                x1="15:00"
                x2="17:00"
                strokeOpacity={0.3}
                fill="#F59E0B"
                fillOpacity={0.12}
                label={{ value: 'CLOUD EVENT WINDOW', position: 'top', fill: '#D97706', fontSize: 10, fontWeight: 700 }}
              />
            )}

            {/* Energy Gap Area */}
            {isCloudEvent && (
              <Area
                type="monotone"
                dataKey="gap_kw"
                stroke="#DC2626"
                fill="#FEF2F2"
                fillOpacity={0.7}
                name="Energy Gap (kW)"
              />
            )}

            {/* Solar Generation Line */}
            <Line
              type="monotone"
              dataKey="solar_kw"
              stroke="#D97706"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#D97706' }}
              activeDot={{ r: 5 }}
              name="Solar Forecast (kW)"
            />

            {/* Demand Forecast Line */}
            <Line
              type="monotone"
              dataKey="demand_kw"
              stroke="#0284C7"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#0284C7' }}
              activeDot={{ r: 5 }}
              name="Demand Forecast (kW)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
