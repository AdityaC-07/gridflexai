import React from 'react';
import { AlertTriangle, ArrowRight, CheckCircle } from 'lucide-react';
import { useGridState } from '../../context/GridStateContext';
import { useBuildingContext } from '../../context/BuildingContext';

export function AlertBanner({ onReviewClick }) {
  const { isCloudEvent, feederState, scenarioFeeder, alerts } = useGridState();
  const { theme } = useBuildingContext();
  const isLight = theme === 'light';

  const list = Array.isArray(alerts) ? alerts : [];
  const actionable = list.filter((a) => a?.severity && a.severity !== 'INFO');
  const infoNote = list.find((a) => a?.severity === 'INFO' && a?.message)?.message;

  if (!isCloudEvent && actionable.length === 0) {
    return (
      <div style={{
        backgroundColor: isLight ? '#ECFDF5' : 'rgba(5,150,105,0.08)',
        border: isLight ? '1px solid #A7F3D0' : '1px solid rgba(5,150,105,0.25)',
        borderRadius: '6px',
        padding: '12px 18px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#059669', boxShadow: '0 0 6px #059669' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isLight ? '#065F46' : '#34D399' }}>
            {infoNote || 'SYSTEM BALANCED — All telemetry operating within normal parameters.'}
          </span>
        </div>
        <span className="tech-tag tech-tag-ok">NORMAL OPERATING STATE</span>
      </div>
    );
  }

  const S = scenarioFeeder || null;
  const activeAlert = actionable[0] || {
    title: 'Cloud Event Detected',
    message: `Solar generation collapsed to ${S?.solar_kw ?? feederState?.solar_kw ?? 25} kW. Projected energy gap: ${S?.net_gap_kw ?? feederState?.net_gap_kw ?? 80} kW. Optimization ready.`,
    severity: 'HIGH',
  };

  return (
    <div style={{
      backgroundColor: isLight ? '#FFFBEB' : 'rgba(217,119,6,0.1)',
      border: isLight ? '1px solid #FDE68A' : '1px solid rgba(217,119,6,0.3)',
      borderLeft: '4px solid #D97706',
      borderRadius: '6px',
      padding: '14px 20px',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '6px',
          backgroundColor: isLight ? '#FEF3C7' : 'rgba(217,119,6,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706',
        }}>
          <AlertTriangle size={20} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', color: isLight ? '#92400E' : '#FCD34D', backgroundColor: isLight ? '#FDE68A' : 'rgba(252,211,77,0.15)', padding: '1px 6px', borderRadius: '3px' }}>
              AMBER ALERT
            </span>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: isLight ? '#78350F' : '#FDE68A' }}>
              {activeAlert.title}
            </h4>
          </div>
          <p style={{ fontSize: '0.825rem', color: isLight ? '#92400E' : '#FCD34D' }}>
            {activeAlert.message}
          </p>
        </div>
      </div>
      <button
        onClick={onReviewClick}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '8px 14px', borderRadius: '4px', fontSize: '0.8rem',
          backgroundColor: '#D97706', border: 'none', color: '#FFFFFF',
          fontWeight: 700, cursor: 'pointer', flexShrink: 0,
        }}
      >
        <span>Review Recommendation</span>
        <ArrowRight size={14} />
      </button>
    </div>
  );
}
