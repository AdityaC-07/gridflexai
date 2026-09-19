import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Building2, LineChart, Wrench, Cpu, LogOut } from 'lucide-react';
import { useBuildingContext } from '../../context/BuildingContext';

export function Sidebar() {
  const location = useLocation();
  const { theme } = useBuildingContext();
  const isLight = theme === 'light';

  const navItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: 'LIVE',
    },
    {
      path: '/buildings/delhi-tech-park',
      label: 'Buildings',
      icon: Building2,
      badge: '8',
    },
    {
      path: '/analytics',
      label: 'Analytics',
      icon: LineChart,
    },
    {
      path: '/retrofits',
      label: 'Retrofits',
      icon: Wrench,
    },
    {
      path: '/equipment',
      label: 'Equipment',
      icon: Cpu,
    },
  ];

  return (
    <aside
      style={{
        width: '240px',
        height: '100vh',
        backgroundColor: isLight ? '#ECEFE6' : '#0F0F0F',
        borderRight: isLight ? '1px solid #D8E0D0' : '1px solid #1E1E1E',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 100,
        transition: 'all 200ms ease',
      }}
    >
      {/* Brand Header */}
      <div style={{ padding: '24px 20px 20px 20px', borderBottom: isLight ? '1px solid #D8E0D0' : '1px solid #1A1A1A' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '4px',
              backgroundColor: '#F5B027',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0F0F0F',
              fontWeight: 800,
              fontFamily: 'Syne',
              fontSize: '0.95rem',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            }}
          >
            AG
          </div>
          <div>
            <h1
              style={{
                fontFamily: 'Syne',
                fontSize: '1.2rem',
                fontWeight: 800,
                color: isLight ? '#0D472B' : '#D4841A',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
              }}
            >
              GridFlex AI
            </h1>
            <p
              style={{
                fontFamily: 'Cinzel',
                fontSize: '0.62rem',
                fontWeight: 700,
                color: isLight ? '#5C6B61' : '#64748B',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                marginTop: '3px',
              }}
            >
              GRIDFLEX AI TELEMETRY
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ padding: '20px 12px', flex: 1, position: 'relative' }}>
        <div
          style={{
            fontFamily: 'Cinzel',
            fontSize: '0.65rem',
            fontWeight: 700,
            color: isLight ? '#5C6B61' : '#64748B',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            padding: '0 12px 12px 12px',
          }}
        >
          INFRASTRUCTURE CORE
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path ||
            (item.path === '/buildings/delhi-tech-park' && location.pathname.startsWith('/buildings'));

          let bg = 'transparent';
          let textColor = isLight ? '#5C6B61' : '#94A3B8';
          let borderLeft = '3px solid transparent';
          let iconColor = isLight ? '#5C6B61' : '#64748B';

          if (isActive) {
            bg = isLight ? '#CBE2D3' : '#1A1A1A';
            textColor = isLight ? '#0D472B' : '#F5F1E8';
            borderLeft = isLight ? '3px solid #0D472B' : '3px solid #D4841A';
            iconColor = isLight ? '#0D472B' : '#D4841A';
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '11px 14px',
                borderRadius: '4px',
                marginBottom: '4px',
                textDecoration: 'none',
                fontFamily: 'Outfit',
                fontSize: '0.9rem',
                fontWeight: isActive ? 700 : 400,
                color: textColor,
                backgroundColor: bg,
                borderLeft: borderLeft,
                transition: 'all 150ms ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Icon size={17} color={iconColor} strokeWidth={2} />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  style={{
                    fontFamily: 'JetBrains Mono',
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '3px',
                    backgroundColor: isActive
                      ? isLight
                        ? '#22C55E'
                        : 'rgba(212, 132, 26, 0.15)'
                      : isLight
                      ? '#DBE5D8'
                      : '#1E1E1E',
                    color: isActive ? (isLight ? '#FFFFFF' : '#E89B3C') : isLight ? '#3A4A3E' : '#64748B',
                    border: isActive ? (isLight ? 'none' : '1px solid rgba(212, 132, 26, 0.3)') : 'none',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}

        {/* Eco Leaf Illustration Banner at Bottom of Sidebar in Light Mode */}
        {isLight && (
          <div
            style={{
              position: 'absolute',
              bottom: '10px',
              left: '12px',
              right: '12px',
              height: '90px',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 100' opacity='0.35'%3E%3Cpath fill='%236BA587' d='M20 90 Q 50 20 80 90 Q 60 40 20 90 Z'/%3E%3Cpath fill='%230D472B' d='M70 90 Q 110 30 150 90 Q 120 50 70 90 Z'/%3E%3Cpath fill='%23A8D4BB' d='M130 90 Q 160 40 190 90 Z'/%3E%3C/svg%3E")`,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'bottom center',
              pointerEvents: 'none',
            }}
          />
        )}
      </nav>

      {/* Grid Stable Status Footer */}
      <div style={{ borderTop: isLight ? '1px solid #D8E0D0' : '1px solid #1A1A1A', padding: '16px 14px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            backgroundColor: isLight ? '#DFE6D6' : '#141414',
            borderRadius: '4px',
            border: isLight ? '1px solid #D4DEC8' : '1px solid #222222',
            marginBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#22C55E',
                boxShadow: '0 0 8px rgba(34, 197, 94, 0.6)',
              }}
            />
            <span
              style={{
                fontFamily: 'Cinzel',
                fontSize: '0.68rem',
                fontWeight: 700,
                color: isLight ? '#0D472B' : '#CBD5E1',
                letterSpacing: '0.08em',
              }}
            >
              GRID STABLE
            </span>
          </div>
          <span
            style={{
              fontFamily: 'JetBrains Mono',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: isLight ? '#0D472B' : '#34D399',
            }}
          >
            99.8%
          </span>
        </div>

        <NavLink
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 12px',
            color: isLight ? '#5C6B61' : '#94A3B8',
            textDecoration: 'none',
            fontFamily: 'Outfit',
            fontSize: '0.85rem',
            transition: 'color 150ms ease',
          }}
        >
          <LogOut size={16} />
          <span>Logout</span>
        </NavLink>
      </div>
    </aside>
  );
}
