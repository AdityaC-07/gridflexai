import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useBuildingContext } from '../context/BuildingContext';
import {
  Search,
  Plus,
  MapPin,
  Zap,
  AlertTriangle,
  Repeat,
  Shield,
  Sliders,
  BarChart2,
  ArrowDownRight,
  ArrowUpRight,
  ArrowRight,
  Leaf,
  Sparkles,
} from 'lucide-react';

export function DashboardPage() {
  const navigate = useNavigate();
  const {
    theme,
    buildings,
    activeCityFilter,
    setActiveCityFilter,
    searchQuery,
    setSearchQuery,
    triggerAIAnalysis,
  } = useBuildingContext();

  const isLight = theme === 'light';

  const cityTabs = [
    { label: 'All', count: 12 },
    { label: 'Delhi NCR', count: 4 },
    { label: 'Mumbai', count: 3 },
    { label: 'Bengaluru', count: 3 },
    { label: 'Hyderabad', count: 2 },
  ];

  const filteredBuildings = buildings.filter((b) => {
    const matchesCity = activeCityFilter === 'All' || b.city === activeCityFilter;
    const matchesQuery =
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCity && matchesQuery;
  });

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: isLight ? '#5C6B61' : '#64748B' }}>
          <span>Dashboard</span>
          <span>/</span>
          <span style={{ color: isLight ? '#0D472B' : '#D1CCC3', fontWeight: 600 }}>All Buildings</span>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '3px',
              backgroundColor: isLight ? '#CBE2D3' : 'rgba(52, 211, 153, 0.1)',
              color: isLight ? '#0D472B' : '#34D399',
              fontFamily: 'JetBrains Mono',
              fontSize: '0.65rem',
              fontWeight: 700,
              marginLeft: '6px',
            }}
          >
            SYNC: ONLINE (4ms)
          </span>
        </div>
      </div>

      {/* Header Bar with Vector Illustration Background in Light Mode */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '28px',
          position: 'relative',
          padding: isLight ? '20px 24px' : '0',
          backgroundColor: isLight ? 'transparent' : 'transparent',
          borderRadius: '8px',
        }}
      >
        {/* Light Mode Landscape Vector Illustration Background */}
        {isLight && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 0,
              opacity: 0.85,
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 160'%3E%3Cdefs%3E%3ClinearGradient id='sky' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0%25' stop-color='%23EAF2E6'/%3E%3Cstop offset='100%25' stop-color='%23F4F7EF'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='1000' height='160' fill='url(%23sky)' rx='8'/%3E%3Ccircle cx='620' cy='60' r='35' fill='%23FCE8BE' opacity='0.8'/%3E%3Cpath d='M350 160 L380 90 L410 160 Z M480 160 L520 70 L560 160 Z' fill='%23CBE2D3' opacity='0.5'/%3E%3Cpath d='M0 160 Q 200 110 400 160 Q 600 120 800 160 Q 900 130 1000 160 Z' fill='%23D4E4D8' opacity='0.7'/%3E%3Cg fill='%2388B89A' opacity='0.4'%3E%3Crect x='450' y='100' width='14' height='40'/%3E%3Crect x='470' y='85' width='18' height='55'/%3E%3Crect x='500' y='110' width='16' height='30'/%3E%3Crect x='640' y='95' width='22' height='45'/%3E%3Crect x='670' y='80' width='16' height='60'/%3E%3C/g%3E%3Cg stroke='%235A9370' stroke-width='1.5' fill='none' opacity='0.5'%3E%3Cline x1='720' y1='160' x2='720' y2='60'/%3E%3Cline x1='710' y1='90' x2='730' y2='90'/%3E%3Cline x1='705' y1='120' x2='735' y2='120'/%3E%3Cline x1='780' y1='160' x2='780' y2='70'/%3E%3Cline x1='770' y1='100' x2='790' y2='100'/%3E%3C/g%3E%3Cg fill='%2338BDF8' opacity='0.5'%3E%3Cpolygon points='550,130 570,120 580,140 560,150'/%3E%3Cpolygon points='585,125 605,115 615,135 595,145'/%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: '8px',
              border: '1px solid #D8E0D0',
              pointerEvents: 'none',
            }}
          />
        )}

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1
            style={{
              fontFamily: 'Syne',
              fontSize: '2.6rem',
              fontWeight: 800,
              color: isLight ? '#0D472B' : '#F5F1E8',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              marginBottom: '6px',
            }}
          >
            Your Buildings
          </h1>
          <p style={{ fontFamily: 'Outfit', fontSize: '0.95rem', color: isLight ? '#3A4A3E' : '#94A3B8' }}>
            Continuous telemetry and load orchestration across 12 facilities in 4 metropolitan sectors
          </p>
        </div>

        {/* Right side banner status or telemetry card */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          {isLight && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'Cinzel', fontSize: '0.68rem', fontWeight: 700, color: '#0D472B', letterSpacing: '0.1em' }}>
              <Leaf size={14} color="#0D472B" />
              <span>CLEAN ENERGY. RELIABLE TOMORROW.</span>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 16px',
              backgroundColor: isLight ? '#FFFFFF' : '#161616',
              border: isLight ? '1px solid #D8E0D0' : '1px solid #242424',
              borderRadius: '6px',
              boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.04)' : 'none',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#22C55E',
                boxShadow: '0 0 8px #22C55E',
              }}
            />
            <div>
              <div style={{ fontFamily: 'Cinzel', fontSize: '0.62rem', fontWeight: 700, color: isLight ? '#5C6B61' : '#64748B', letterSpacing: '0.08em' }}>
                FLEET TELEMETRY FEED
              </div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.95rem', fontWeight: 700, color: isLight ? '#0D472B' : '#34D399' }}>
                99.98% High-Fidelity
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top 4 Summary KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        {/* Card 1 */}
        <div
          style={{
            backgroundColor: isLight ? '#FFFFFF' : '#161616',
            border: isLight ? '1px solid #E2E8DC' : '1px solid #242424',
            borderRadius: '6px',
            padding: '18px 20px',
            position: 'relative',
            boxShadow: isLight ? '0 2px 10px rgba(0,0,0,0.03)' : 'none',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <span style={{ fontFamily: 'Cinzel', fontSize: '0.68rem', fontWeight: 700, color: isLight ? '#5C6B61' : '#64748B', letterSpacing: '0.08em' }}>
              TOTAL FLEET DEMAND
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: isLight ? '#FDF4E3' : 'rgba(212, 132, 26, 0.15)',
                color: '#D4841A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Zap size={17} />
            </div>
          </div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '2.2rem', fontWeight: 700, color: isLight ? '#0F172A' : '#F5F1E8', lineHeight: 1 }}>
            7.82 <span style={{ fontSize: '1.1rem', fontWeight: 600, color: isLight ? '#5C6B61' : '#94A3B8' }}>MW</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'Outfit', fontSize: '0.8rem', color: '#059669', marginTop: '6px', fontWeight: 600 }}>
            <ArrowDownRight size={14} color="#059669" />
            <span>-14.2% Shaved Today</span>
          </div>
        </div>

        {/* Card 2 */}
        <div
          style={{
            backgroundColor: isLight ? '#FFFFFF' : '#161616',
            border: isLight ? '1px solid #E2E8DC' : '1px solid #242424',
            borderRadius: '6px',
            padding: '18px 20px',
            position: 'relative',
            boxShadow: isLight ? '0 2px 10px rgba(0,0,0,0.03)' : 'none',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <span style={{ fontFamily: 'Cinzel', fontSize: '0.68rem', fontWeight: 700, color: isLight ? '#5C6B61' : '#64748B', letterSpacing: '0.08em' }}>
              ACTIVE DIAGNOSTICS
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: isLight ? '#FDE8E6' : 'rgba(255, 107, 91, 0.15)',
                color: '#E5584A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={17} />
            </div>
          </div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '2.2rem', fontWeight: 700, color: '#E5584A', lineHeight: 1 }}>
            02 <span style={{ fontSize: '1.1rem', fontWeight: 600, color: isLight ? '#0F172A' : '#F5F1E8' }}>Facilities</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'Outfit', fontSize: '0.8rem', color: '#E5584A', marginTop: '6px', fontWeight: 600 }}>
            <AlertTriangle size={13} color="#E5584A" />
            <span>Thermal excursion alert</span>
          </div>
        </div>

        {/* Card 3 */}
        <div
          style={{
            backgroundColor: isLight ? '#FFFFFF' : '#161616',
            border: isLight ? '1px solid #E2E8DC' : '1px solid #242424',
            borderRadius: '6px',
            padding: '18px 20px',
            position: 'relative',
            boxShadow: isLight ? '0 2px 10px rgba(0,0,0,0.03)' : 'none',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <span style={{ fontFamily: 'Cinzel', fontSize: '0.68rem', fontWeight: 700, color: isLight ? '#5C6B61' : '#64748B', letterSpacing: '0.08em' }}>
              DEMAND RESPONSE
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: isLight ? '#E6F5EC' : 'rgba(56, 189, 248, 0.15)',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Repeat size={17} />
            </div>
          </div>
          <div style={{ fontFamily: 'Syne', fontSize: '1.6rem', fontWeight: 700, color: isLight ? '#0D472B' : '#34D399', lineHeight: 1.2 }}>
            Autonomous
          </div>
          <div style={{ fontFamily: 'Outfit', fontSize: '0.8rem', color: isLight ? '#5C6B61' : '#94A3B8', marginTop: '6px' }}>
            GridFlex AI Sync 100%
          </div>
        </div>

        {/* Card 4 */}
        <div
          style={{
            backgroundColor: isLight ? '#FFFFFF' : '#161616',
            border: isLight ? '1px solid #E2E8DC' : '1px solid #242424',
            borderRadius: '6px',
            padding: '18px 20px',
            position: 'relative',
            boxShadow: isLight ? '0 2px 10px rgba(0,0,0,0.03)' : 'none',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <span style={{ fontFamily: 'Cinzel', fontSize: '0.68rem', fontWeight: 700, color: isLight ? '#5C6B61' : '#64748B', letterSpacing: '0.08em' }}>
              FLEET ESG SCORE
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: isLight ? '#E6F5F0' : 'rgba(107, 165, 135, 0.15)',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Shield size={17} />
            </div>
          </div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '2.2rem', fontWeight: 700, color: isLight ? '#0F172A' : '#F5F1E8', lineHeight: 1 }}>
            92 <span style={{ fontSize: '1rem', color: isLight ? '#5C6B61' : '#64748B' }}>/100</span>
          </div>
          <div style={{ fontFamily: 'Outfit', fontSize: '0.8rem', color: isLight ? '#0D472B' : '#7CB899', marginTop: '6px', fontWeight: 600 }}>
            LEED Arc Certified Class
          </div>
        </div>
      </div>

      {/* Control Toolbar: Search, Filters, Create Button */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        {/* Search Input */}
        <div style={{ position: 'relative', width: '340px' }}>
          <Search
            size={16}
            color={isLight ? '#5C6B61' : '#64748B'}
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Search by facility, city, tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              backgroundColor: isLight ? '#FFFFFF' : '#161616',
              border: isLight ? '1px solid #E2E8DC' : '1px solid #2A2A2A',
              borderRadius: '4px',
              color: isLight ? '#0F172A' : '#F5F1E8',
              fontFamily: 'Outfit',
              fontSize: '0.88rem',
              outline: 'none',
              boxShadow: isLight ? '0 1px 4px rgba(0,0,0,0.02)' : 'none',
            }}
          />
        </div>

        {/* View toggles & Create Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: isLight ? '#FFFFFF' : '#161616',
              border: isLight ? '1px solid #DAE2D2' : '1px solid #2A2A2A',
              borderRadius: '4px',
              color: isLight ? '#2D3E33' : '#D1CCC3',
              fontFamily: 'Outfit',
              fontSize: '0.85rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Sliders size={14} />
            <span>Filter Grid</span>
          </button>

          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: isLight ? '#FFFFFF' : '#161616',
              border: isLight ? '1px solid #DAE2D2' : '1px solid #2A2A2A',
              borderRadius: '4px',
              color: isLight ? '#2D3E33' : '#D1CCC3',
              fontFamily: 'Outfit',
              fontSize: '0.85rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <BarChart2 size={14} />
            <span>Metrics (3)</span>
          </button>

          <button
            className="btn-primary"
            style={{
              padding: '9px 18px',
              backgroundColor: isLight ? '#0D472B' : '#D4841A',
              color: '#FFFFFF',
              boxShadow: isLight ? '0 2px 8px rgba(13, 71, 43, 0.25)' : 'none',
            }}
          >
            <Plus size={16} />
            <span>Create Building</span>
          </button>
        </div>
      </div>

      {/* City Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '28px' }}>
        {cityTabs.map((tab) => {
          const isActive = activeCityFilter === tab.label;
          return (
            <button
              key={tab.label}
              onClick={() => setActiveCityFilter(tab.label)}
              style={{
                padding: '6px 14px',
                borderRadius: '4px',
                fontFamily: 'Outfit',
                fontSize: '0.85rem',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#FFFFFF' : isLight ? '#3A4A3E' : '#94A3B8',
                backgroundColor: isActive ? (isLight ? '#0D472B' : '#D4841A') : isLight ? '#EAEFE3' : '#161616',
                border: isActive ? (isLight ? '1px solid #0D472B' : '1px solid #D4841A') : isLight ? '1px solid #DAE2D2' : '1px solid #242424',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              {tab.label} ({tab.count})
            </button>
          );
        })}
      </div>

      {/* Building Cards Grid (2x3) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '24px',
        }}
      >
        {filteredBuildings.map((b) => (
          <div
            key={b.id}
            className="card-hover-effect"
            style={{
              backgroundColor: isLight ? '#FFFFFF' : '#161616',
              border: isLight ? '1px solid #E2E8DC' : '1px solid #242424',
              borderRadius: '8px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: isLight ? '0 2px 12px rgba(0,0,0,0.04)' : '0 4px 16px rgba(0, 0, 0, 0.4)',
            }}
          >
            {/* Top Photo Header with Overlay */}
            <div
              style={{
                height: '150px',
                backgroundImage: `linear-gradient(180deg, rgba(15,15,15,0.15) 0%, rgba(15,15,15,0.85) 100%), url(${b.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: '#FEF3C7', backgroundColor: 'rgba(217, 119, 6, 0.85)', padding: '2px 8px', borderRadius: '3px', fontWeight: 700 }}>
                  {b.category} <span style={{ color: '#FDE68A' }}>{b.code}</span>
                </span>

                {/* Status Badge */}
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '3px',
                    backgroundColor: 'rgba(16, 185, 129, 0.9)',
                    color: '#FFFFFF',
                    fontFamily: 'JetBrains Mono',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                  }}
                >
                  • {b.status}
                </span>
              </div>

              <h3
                style={{
                  fontFamily: 'Syne',
                  fontSize: '1.45rem',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  lineHeight: 1.1,
                  textShadow: '0 2px 8px rgba(0,0,0,0.7)',
                }}
              >
                {b.name}
              </h3>
            </div>

            {/* Card Body Metrics */}
            <div style={{ padding: '18px 20px', flex: 1, backgroundColor: isLight ? '#FFFFFF' : '#161616' }}>
              {/* 3 Metrics Row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '8px',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <div style={{ fontFamily: 'Cinzel', fontSize: '0.62rem', fontWeight: 700, color: isLight ? '#5C6B61' : '#64748B' }}>TODAY'S USAGE</div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: '1.15rem', fontWeight: 700, color: isLight ? '#0F172A' : '#F5F1E8' }}>
                    {b.todaysUsage} <span style={{ fontSize: '0.7rem' }}>{b.usageUnit || 'kWh'}</span>
                  </div>
                  <div style={{ fontFamily: 'Outfit', fontSize: '0.7rem', color: isLight ? '#5C6B61' : '#94A3B8' }}>{b.usageSubtext}</div>
                </div>

                <div>
                  <div style={{ fontFamily: 'Cinzel', fontSize: '0.62rem', fontWeight: 700, color: isLight ? '#5C6B61' : '#64748B' }}>VS BASELINE</div>
                  <div
                    style={{
                      fontFamily: 'JetBrains Mono',
                      fontSize: '1.15rem',
                      fontWeight: 700,
                      color: b.vsBaseline.startsWith('-') ? '#059669' : '#DC2626',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                    }}
                  >
                    {b.vsBaseline.startsWith('-') ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                    <span>{b.vsBaseline}</span>
                  </div>
                  <div style={{ fontFamily: 'Outfit', fontSize: '0.7rem', color: isLight ? '#5C6B61' : '#94A3B8' }}>{b.vsBaselineLabel}</div>
                </div>

                <div>
                  <div style={{ fontFamily: 'Cinzel', fontSize: '0.62rem', fontWeight: 700, color: isLight ? '#5C6B61' : '#64748B' }}>{b.forecastConfidence != null ? 'FORECAST CONFIDENCE' : 'EFFICIENCY'}</div>
                  <div
                    style={{
                      fontFamily: 'JetBrains Mono',
                      fontSize: '1.15rem',
                      fontWeight: 700,
                      color: '#059669',
                    }}
                  >
                    {b.forecastConfidence != null ? `${b.forecastConfidence}%` : (b.efficiency === 'OPTIMAL' ? '94.2%' : b.efficiency === 'GOOD' ? '91.2%' : '85.4%')}
                  </div>
                  <div style={{ fontFamily: 'Outfit', fontSize: '0.7rem', color: isLight ? '#5C6B61' : '#94A3B8' }}>
                    {b.forecastConfidence != null ? 'Live forecast model' : b.efficiencySubtext}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontFamily: 'Cinzel', fontSize: '0.62rem', fontWeight: 700, color: isLight ? '#5C6B61' : '#64748B' }}>
                    {b.gridMetricLabel || 'Grid Demand Threshold'}
                  </span>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.68rem', color: isLight ? '#0F172A' : '#CBD5E1', fontWeight: 600 }}>
                    {b.gridThreshold}% / 100%
                  </span>
                </div>
                <div style={{ height: '5px', width: '100%', backgroundColor: isLight ? '#EAEFE3' : '#242424', borderRadius: '3px' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${b.gridThreshold}%`,
                      backgroundColor: b.gridThreshold > 80 ? '#DC2626' : isLight ? '#0D472B' : '#D4841A',
                      borderRadius: '3px',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div
              style={{
                padding: '12px 20px',
                backgroundColor: isLight ? '#FAFCF7' : '#121212',
                borderTop: isLight ? '1px solid #E2E8DC' : '1px solid #1E1E1E',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isLight ? '#5C6B61' : '#94A3B8', fontSize: '0.8rem' }}>
                <MapPin size={14} color={isLight ? '#0D472B' : '#D4841A'} />
                <span>{b.location}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => navigate(`/buildings/${b.id}`)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: isLight ? '#EAEFE3' : '#1E1E1E',
                    border: isLight ? '1px solid #DAE2D2' : '1px solid #333333',
                    color: isLight ? '#0D472B' : '#F5F1E8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                  title="View Details"
                >
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
