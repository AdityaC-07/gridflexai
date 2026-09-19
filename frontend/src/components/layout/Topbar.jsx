import React from 'react';
import { ChevronDown, Bell, Sliders, Building, Sun, Moon } from 'lucide-react';
import { useBuildingContext } from '../../context/BuildingContext';

export function Topbar() {
  const { theme, toggleTheme } = useBuildingContext();
  const isLight = theme === 'light';

  return (
    <header
      style={{
        height: '60px',
        backgroundColor: isLight ? '#EEF2E6' : '#0F0F0F',
        borderBottom: isLight ? '1px solid #D8E0D0' : '1px solid #1E1E1E',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        position: 'fixed',
        top: 0,
        left: '240px',
        right: 0,
        zIndex: 90,
        transition: 'all 200ms ease',
      }}
    >
      {/* Left items: Portfolio Selector & Telemetry Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            backgroundColor: isLight ? '#FFFFFF' : '#1A1A1A',
            border: isLight ? '1px solid #DAE2D2' : '1px solid #2A2A2A',
            borderRadius: '4px',
            color: isLight ? '#0D472B' : '#F5F1E8',
            fontFamily: 'Outfit',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
          }}
        >
          <Building size={15} color={isLight ? '#0D472B' : '#94A3B8'} />
          <span>District Portfolio 01</span>
          <ChevronDown size={14} color={isLight ? '#0D472B' : '#64748B'} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: isLight ? '#22C55E' : '#E89B3C',
              boxShadow: isLight ? '0 0 8px #22C55E' : '0 0 8px rgba(232, 155, 60, 0.8)',
            }}
          />
          <span
            style={{
              fontFamily: 'Cinzel',
              fontSize: '0.68rem',
              fontWeight: 700,
              color: isLight ? '#2D3E33' : '#D1CCC3',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            PEAK TELEMETRY ACTIVE
          </span>
        </div>
      </div>

      {/* Right items: Controls, Theme Toggle, Terminal badge, User profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '20px',
            backgroundColor: isLight ? '#0D472B' : '#1A1A1A',
            border: isLight ? '1px solid #0D472B' : '1px solid #3A3A3A',
            color: isLight ? '#FFFFFF' : '#E89B3C',
            fontFamily: 'Outfit',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 200ms ease',
            boxShadow: isLight ? '0 2px 8px rgba(13, 71, 43, 0.25)' : 'none',
          }}
        >
          {isLight ? <Sun size={15} color="#F5B027" /> : <Moon size={15} color="#E89B3C" />}
          <span>{isLight ? 'Light Theme' : 'Dark Theme'}</span>
        </button>

        <button
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '4px',
            backgroundColor: isLight ? '#FFFFFF' : '#1A1A1A',
            border: isLight ? '1px solid #DAE2D2' : '1px solid #2A2A2A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isLight ? '#0D472B' : '#94A3B8',
            cursor: 'pointer',
          }}
        >
          <Bell size={16} />
        </button>

        <button
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '4px',
            backgroundColor: isLight ? '#FFFFFF' : '#1A1A1A',
            border: isLight ? '1px solid #DAE2D2' : '1px solid #2A2A2A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isLight ? '#0D472B' : '#94A3B8',
            cursor: 'pointer',
          }}
        >
          <Sliders size={16} />
        </button>

        <div
          style={{
            padding: '6px 12px',
            backgroundColor: isLight ? '#E2E8DA' : '#161616',
            border: isLight ? '1px solid #D4DEC8' : '1px solid #262626',
            borderRadius: '4px',
            fontFamily: 'Cinzel',
            fontSize: '0.7rem',
            fontWeight: 700,
            color: isLight ? '#2D3E33' : '#94A3B8',
            letterSpacing: '0.08em',
          }}
        >
          OPERATIONS LEAD <span style={{ color: isLight ? '#5C6B61' : '#64748B' }}>HQ_TERMINAL</span>
        </div>

        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            backgroundColor: '#F5B027',
            color: '#0F0F0F',
            fontFamily: 'Syne',
            fontWeight: 800,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(245, 176, 39, 0.4)',
          }}
        >
          O
        </div>
      </div>
    </header>
  );
}
