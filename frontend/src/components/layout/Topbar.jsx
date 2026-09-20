import React, { useState } from 'react';
import { ChevronDown, Bell, Sliders, Building, Sun, Moon, X, RefreshCw, Settings } from 'lucide-react';
import { useBuildingContext } from '../../context/BuildingContext';
import { useGridState } from '../../context/GridStateContext';
import { useNavigate } from 'react-router-dom';

export function Topbar() {
  const { theme, toggleTheme } = useBuildingContext();
  const { feederState, isCloudEvent, lastUpdated, refreshAll } = useGridState();
  const navigate = useNavigate();
  const isLight = theme === 'light';

  const [notifOpen, setNotifOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Live status label from feeder risk
  const riskLevel = feederState?.risk_level ?? null;
  const statusLabel = isCloudEvent
    ? 'CLOUD EVENT ACTIVE'
    : riskLevel === 'HIGH' || riskLevel === 'CRITICAL'
    ? `${riskLevel} RISK ACTIVE`
    : 'PEAK TELEMETRY ACTIVE';
  const statusColor = isCloudEvent || riskLevel === 'HIGH' || riskLevel === 'CRITICAL'
    ? '#DC2626'
    : isLight ? '#22C55E' : '#E89B3C';

  // Token shorthands
  const bg     = isLight ? '#FFFFFF' : '#1A1A1A';
  const border = isLight ? '#DAE2D2' : '#2A2A2A';
  const textPri = isLight ? '#0D472B' : '#F5F1E8';
  const textDim = isLight ? '#5C6B61' : '#94A3B8';
  const bgPage  = isLight ? '#EEF2E6' : '#0F0F0F';
  const bgPanel = isLight ? '#FFFFFF' : '#1A1A1A';
  const panelBorder = isLight ? '#E2E8DC' : '#242424';

  const lastTime = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--:--:--';

  return (
    <header style={{
      height: '60px',
      backgroundColor: isLight ? '#EEF2E6' : '#0F0F0F',
      borderBottom: isLight ? '1px solid #D8E0D0' : '1px solid #1E1E1E',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 28px', position: 'fixed', top: 0, left: '240px', right: 0,
      zIndex: 90, transition: 'all 200ms ease',
    }}>

      {/* Left: Portfolio + Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* Portfolio selector — navigates to dashboard */}
        <button
          onClick={() => navigate('/dashboard')}
          title="Go to District Portfolio Dashboard"
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '6px 14px', backgroundColor: bg,
            border: `1px solid ${border}`, borderRadius: '4px',
            color: textPri, fontFamily: 'Outfit', fontSize: '0.88rem',
            fontWeight: 600, cursor: 'pointer',
            boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
          }}
        >
          <Building size={15} color={isLight ? '#0D472B' : '#94A3B8'} />
          <span>District Portfolio 01</span>
          <ChevronDown size={14} color={isLight ? '#0D472B' : '#64748B'} />
        </button>

        {/* Live status indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            width: '7px', height: '7px', borderRadius: '50%',
            backgroundColor: statusColor,
            boxShadow: `0 0 8px ${statusColor}88`,
          }} />
          <span style={{
            fontFamily: 'Cinzel', fontSize: '0.68rem', fontWeight: 700,
            color: isLight ? '#2D3E33' : '#D1CCC3',
            letterSpacing: '0.12em', textTransform: 'uppercase',
          }}>
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Right: controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 12px', borderRadius: '20px',
            backgroundColor: isLight ? '#0D472B' : '#1A1A1A',
            border: isLight ? '1px solid #0D472B' : '1px solid #3A3A3A',
            color: isLight ? '#FFFFFF' : '#E89B3C',
            fontFamily: 'Outfit', fontSize: '0.78rem', fontWeight: 600,
            cursor: 'pointer', transition: 'all 200ms ease',
          }}
        >
          {isLight ? <Sun size={15} color="#F5B027" /> : <Moon size={15} color="#E89B3C" />}
          <span>{isLight ? 'Light' : 'Dark'}</span>
        </button>

        {/* Refresh button — triggers live data refresh */}
        <button
          onClick={() => refreshAll()}
          title={`Refresh all data (last: ${lastTime} IST)`}
          style={{
            width: '34px', height: '34px', borderRadius: '4px',
            backgroundColor: bg, border: `1px solid ${border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: textDim, cursor: 'pointer',
          }}
        >
          <RefreshCw size={15} />
        </button>

        {/* Notification Bell — opens notification panel */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setNotifOpen(v => !v); setSettingsOpen(false); }}
            title="Notifications"
            style={{
              width: '34px', height: '34px', borderRadius: '4px',
              backgroundColor: bg, border: `1px solid ${border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: textDim, cursor: 'pointer', position: 'relative',
            }}
          >
            <Bell size={16} />
            {isCloudEvent && (
              <span style={{
                position: 'absolute', top: '6px', right: '6px',
                width: '7px', height: '7px', borderRadius: '50%',
                backgroundColor: '#DC2626',
              }} />
            )}
          </button>

          {notifOpen && (
            <div style={{
              position: 'absolute', top: '42px', right: 0, zIndex: 300,
              width: '320px', backgroundColor: bgPanel,
              border: `1px solid ${panelBorder}`, borderRadius: '8px',
              boxShadow: isLight ? '0 8px 24px rgba(0,0,0,0.12)' : '0 8px 24px rgba(0,0,0,0.6)',
              overflow: 'hidden',
            }}>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${panelBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'Cinzel', fontWeight: 700, fontSize: '0.72rem', color: textPri, letterSpacing: '0.08em' }}>NOTIFICATIONS</span>
                <button onClick={() => setNotifOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textDim }}><X size={14} /></button>
              </div>
              {isCloudEvent ? (
                <div style={{ padding: '14px 16px', borderBottom: `1px solid ${panelBorder}` }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#DC2626', flexShrink: 0, marginTop: '4px' }} />
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#DC2626' }}>Cloud Event Active — Feeder F01</div>
                      <div style={{ fontSize: '0.75rem', color: textDim, marginTop: '2px' }}>Solar generation dropped. Energy gap detected. Review optimization panel.</div>
                      <button onClick={() => { navigate('/operator'); setNotifOpen(false); }} style={{ marginTop: '8px', fontSize: '0.72rem', color: '#0284C7', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        → Open Grid Operator
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: textDim, fontSize: '0.82rem' }}>
                  <div style={{ marginBottom: '4px' }}>✓ No active alerts</div>
                  <div style={{ fontSize: '0.72rem' }}>Last updated: {lastTime} IST</div>
                </div>
              )}
              {feederState?.risk_level && feederState.risk_level !== 'LOW' && !isCloudEvent && (
                <div style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#D97706', flexShrink: 0, marginTop: '4px' }} />
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#D97706' }}>Feeder F01 — {feederState.risk_level} Risk</div>
                      <div style={{ fontSize: '0.75rem', color: textDim, marginTop: '2px' }}>Stress index: {feederState.stress_index}/100</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Settings — opens settings panel */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setSettingsOpen(v => !v); setNotifOpen(false); }}
            title="Settings & Preferences"
            style={{
              width: '34px', height: '34px', borderRadius: '4px',
              backgroundColor: bg, border: `1px solid ${border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: textDim, cursor: 'pointer',
            }}
          >
            <Settings size={16} />
          </button>

          {settingsOpen && (
            <div style={{
              position: 'absolute', top: '42px', right: 0, zIndex: 300,
              width: '260px', backgroundColor: bgPanel,
              border: `1px solid ${panelBorder}`, borderRadius: '8px',
              boxShadow: isLight ? '0 8px 24px rgba(0,0,0,0.12)' : '0 8px 24px rgba(0,0,0,0.6)',
              overflow: 'hidden',
            }}>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${panelBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'Cinzel', fontWeight: 700, fontSize: '0.72rem', color: textPri, letterSpacing: '0.08em' }}>SETTINGS</span>
                <button onClick={() => setSettingsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textDim }}><X size={14} /></button>
              </div>
              {[
                { label: 'Theme', value: isLight ? 'Light Mode' : 'Dark Mode', action: toggleTheme },
                { label: 'Feeder', value: 'F01 — Dharavi North', action: () => { navigate('/dashboard'); setSettingsOpen(false); } },
                { label: 'Polling', value: '30s refresh interval', action: null },
                { label: 'DISCOM', value: 'MSEDCL Mumbai', action: null },
              ].map(({ label, value, action }) => (
                <div key={label} onClick={action || undefined} style={{
                  padding: '10px 16px', borderBottom: `1px solid ${panelBorder}`,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  cursor: action ? 'pointer' : 'default',
                }}>
                  <span style={{ fontSize: '0.8rem', color: textDim }}>{label}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: action ? '#0284C7' : textPri }}>{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Terminal badge */}
        <div style={{
          padding: '6px 12px',
          backgroundColor: isLight ? '#E2E8DA' : '#161616',
          border: `1px solid ${isLight ? '#D4DEC8' : '#262626'}`,
          borderRadius: '4px', fontFamily: 'Cinzel',
          fontSize: '0.7rem', fontWeight: 700,
          color: isLight ? '#2D3E33' : '#94A3B8', letterSpacing: '0.08em',
        }}>
          OPS LEAD <span style={{ color: textDim }}>HQ_TERMINAL</span>
        </div>

        {/* Avatar — opens operator profile page */}
        <button
          onClick={() => navigate('/operator')}
          title="Go to Operator Console"
          style={{
            width: '34px', height: '34px', borderRadius: '50%',
            backgroundColor: '#F5B027', color: '#0F0F0F',
            fontFamily: 'Syne', fontWeight: 800, fontSize: '0.9rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', border: 'none',
            boxShadow: '0 2px 8px rgba(245,176,39,0.4)',
          }}
        >
          O
        </button>
      </div>
    </header>
  );
}
