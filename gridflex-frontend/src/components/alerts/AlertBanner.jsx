import React from 'react';
import { AlertTriangle, ArrowRight, ShieldAlert } from 'lucide-react';
import { useGridState } from '../../context/GridStateContext';

export function AlertBanner({ onReviewClick }) {
  const { isCloudEvent, feederState, scenarioFeeder, alerts } = useGridState();

  // alerts is a normalized array (see api/alerts.js). INFO entries are status
  // notes, not actionable problems — only non-INFO severities raise the banner.
  const list = Array.isArray(alerts) ? alerts : [];
  const actionable = list.filter((a) => a?.severity && a.severity !== 'INFO');
  const infoNote = list.find((a) => a?.severity === 'INFO' && a?.message)?.message;

  if (!isCloudEvent && actionable.length === 0) {
    return (
      <div style={{
        backgroundColor: '#ECFDF5',
        border: '1px solid #A7F3D0',
        borderRadius: '6px',
        padding: '12px 18px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#059669' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#065F46' }}>
            {infoNote || 'SYSTEM BALANCED — All telemetry operating within normal parameters. No grid intervention required.'}
          </span>
        </div>
        <span className="tech-tag tech-tag-ok">
          NORMAL OPERATING STATE
        </span>
      </div>
    );
  }

  // Scenario fallback: while the frontend-local scenario is active, describe
  // the scenario condition from the shared scenario definition (the live API
  // knows nothing about the scenario). Otherwise use live feeder values.
  const S = scenarioFeeder || null;
  const activeAlert = actionable[0] || {
    title: 'Cloud Event Detected',
    message: `Solar generation collapsed to ${S?.solar_kw ?? feederState?.solar_kw ?? 25} kW. Projected energy gap: ${S?.net_gap_kw ?? feederState?.net_gap_kw ?? 80} kW. Optimization ready.`,
    severity: 'HIGH'
  };

  return (
    <div style={{
      backgroundColor: '#FFFBEB',
      border: '1px solid #FDE68A',
      borderLeft: '4px solid #D97706',
      borderRadius: '6px',
      padding: '14px 20px',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 2px 4px rgba(217, 119, 6, 0.08)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '6px',
          backgroundColor: '#FEF3C7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#D97706'
        }}>
          <AlertTriangle size={20} />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              color: '#92400E',
              backgroundColor: '#FDE68A',
              padding: '1px 6px',
              borderRadius: '3px'
            }}>
              AMBER ALERT
            </span>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#78350F' }}>
              {activeAlert.title}
            </h4>
          </div>
          <p style={{ fontSize: '0.825rem', color: '#92400E' }}>
            {activeAlert.message}
          </p>
        </div>
      </div>

      <button
        onClick={onReviewClick}
        className="ops-btn ops-btn-warning"
        style={{ fontSize: '0.8rem', padding: '8px 14px' }}
      >
        <span>Review Recommendation</span>
        <ArrowRight size={14} />
      </button>
    </div>
  );
}
