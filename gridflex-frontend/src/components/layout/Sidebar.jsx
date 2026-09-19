import React from 'react';
import { NavLink } from 'react-router-dom';
import { Activity, Sliders, ShieldCheck, Building2, User, Zap, Radio } from 'lucide-react';
import { useGridState } from '../../context/GridStateContext';

export function Sidebar() {
  const { isCloudEvent, feederState } = useGridState();

  const navItems = [
    { path: '/operator', label: 'Overview', icon: Activity, exact: true },
    { path: '/simulation', label: 'Simulation', icon: Sliders },
    { path: '/reliability', label: 'Reliability', icon: ShieldCheck },
    { path: '/discom', label: 'DISCOM', icon: Building2 },
    { path: '/resident', label: 'Resident View', icon: User },
  ];

  return (
    <aside style={{
      width: '240px',
      height: '100vh',
      backgroundColor: '#0F172A',
      color: '#F8FAFC',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 100,
      borderRight: '1px solid #1E293B'
    }}>
      {/* Brand Header */}
      <div style={{ padding: '20px 18px 16px 18px', borderBottom: '1px solid #1E293B' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            backgroundColor: '#0284C7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF'
          }}>
            <Zap size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '0.04em', lineHeight: 1.1, color: '#FFFFFF' }}>
              GRIDFLEX<span style={{ color: '#38BDF8', marginLeft: '4px' }}>AI</span>
            </h1>
            <p style={{ fontSize: '0.65rem', color: '#94A3B8', letterSpacing: '0.03em', marginTop: '2px' }}>
              Forecast. Optimize. Protect.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ padding: '16px 12px', flex: 1 }}>
        <div style={{
          fontSize: '0.65rem',
          fontWeight: 700,
          color: '#64748B',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          padding: '0 8px 8px 8px'
        }}>
          Operations Console
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '6px',
                marginBottom: '4px',
                textDecoration: 'none',
                fontSize: '0.85rem',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#FFFFFF' : '#94A3B8',
                backgroundColor: isActive ? '#1E293B' : 'transparent',
                borderLeft: isActive ? '3px solid #0284C7' : '3px solid transparent',
                transition: 'all 150ms ease'
              })}
            >
              <Icon size={18} strokeWidth={2} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Contextual System Card */}
      <div style={{ padding: '16px 14px', borderTop: '1px solid #1E293B', backgroundColor: '#0A0F1D' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            GRID ASSET CONTEXT
          </span>
          <Radio size={12} color={isCloudEvent ? '#F59E0B' : '#10B981'} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
          <div>
            <div style={{ fontSize: '0.65rem', color: '#64748B' }}>FEEDER</div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 700, color: '#E2E8F0' }}>
              {feederState?.feeder_id || 'F01'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.65rem', color: '#64748B' }}>STATUS</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: isCloudEvent ? '#F59E0B' : '#10B981' }}>
              {isCloudEvent ? 'CLOUD EVENT' : 'BALANCED'}
            </div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.65rem', color: '#64748B' }}>LOCATION</div>
          <div style={{ fontSize: '0.8rem', color: '#CBD5E1', fontWeight: 500 }}>
            {feederState?.feeder_name || 'Dharavi North'}
          </div>
        </div>
      </div>
    </aside>
  );
}
