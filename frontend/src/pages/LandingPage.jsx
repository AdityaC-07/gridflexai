import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useBuildingContext } from '../context/BuildingContext';
import {
  Zap,
  ArrowRight,
  Shield,
  CheckCircle,
  Sliders,
  FileText,
  Lock,
  Sparkles,
} from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();
  const { triggerAIAnalysis } = useBuildingContext();

  return (
    <div style={{ backgroundColor: '#0F0F0F', color: '#F5F1E8', minHeight: '100vh' }}>
      {/* Navigation Header */}
      <header
        style={{
          height: '70px',
          borderBottom: '1px solid #1E1E1E',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 40px',
          backgroundColor: '#0F0F0F',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '4px',
              backgroundColor: '#D4841A',
              color: '#0F0F0F',
              fontFamily: 'Syne',
              fontWeight: 800,
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            GF
          </div>
          <div>
            <span style={{ fontFamily: 'Syne', fontSize: '1.2rem', fontWeight: 800, color: '#F5F1E8' }}>
              GridFlex AI
            </span>
            <span style={{ fontFamily: 'Cinzel', fontSize: '0.62rem', fontWeight: 700, color: '#64748B', display: 'block', letterSpacing: '0.12em' }}>
              ENERGY INTELLIGENCE
            </span>
          </div>
        </div>

        {/* Links */}
        <nav style={{ display: 'flex', gap: '24px', fontFamily: 'Outfit', fontSize: '0.88rem', color: '#94A3B8' }}>
          <a href="#platform" style={{ color: '#F5F1E8', textDecoration: 'none' }}>Platform</a>
          <a href="#solutions" style={{ color: '#94A3B8', textDecoration: 'none' }}>Solutions</a>
          <a href="#optimization" style={{ color: '#94A3B8', textDecoration: 'none' }}>Grid Optimization</a>
          <a href="#telemetry" style={{ color: '#94A3B8', textDecoration: 'none' }}>Live Telemetry</a>
          <a href="#pricing" style={{ color: '#94A3B8', textDecoration: 'none' }}>Pricing</a>
          <a href="#docs" style={{ color: '#94A3B8', textDecoration: 'none' }}>Documentation</a>
        </nav>

        {/* Right CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span
            style={{
              fontFamily: 'Cinzel',
              fontSize: '0.68rem',
              fontWeight: 700,
              color: '#34D399',
              padding: '4px 10px',
              backgroundColor: 'rgba(52, 211, 153, 0.1)',
              borderRadius: '3px',
              border: '1px solid rgba(52, 211, 153, 0.2)',
              letterSpacing: '0.08em',
            }}
          >
            • LIVE GRID: 99.98% Eff
          </span>

          <button
            onClick={() => navigate('/dashboard')}
            style={{
              background: 'none',
              border: 'none',
              color: '#F5F1E8',
              fontFamily: 'Outfit',
              fontSize: '0.88rem',
              cursor: 'pointer',
            }}
          >
            Sign In
          </button>

          <button onClick={() => navigate('/dashboard')} className="btn-primary">
            <span>Launch App</span>
          </button>
        </div>
      </header>

      {/* Hero Section with Building Photo #1 Background */}
      <section
        style={{
          padding: '100px 40px 80px 40px',
          textAlign: 'center',
          position: 'relative',
          backgroundImage: `linear-gradient(180deg, rgba(15,15,15,0.72) 0%, rgba(15,15,15,0.96) 100%), url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1800&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ marginBottom: '24px' }}>
            <span
              style={{
                fontFamily: 'Cinzel',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '6px 16px',
                borderRadius: '20px',
                backgroundColor: 'rgba(212, 132, 26, 0.15)',
                color: '#E89B3C',
                border: '1px solid rgba(212, 132, 26, 0.4)',
                letterSpacing: '0.12em',
                boxShadow: '0 0 15px rgba(212, 132, 26, 0.2)',
              }}
            >
              • AI ENGINE V4.2 • ACTIVE IN 1,420+ ASSETS
            </span>
          </div>

          <h1
            style={{
              fontFamily: 'Syne',
              fontSize: '4.6rem',
              fontWeight: 800,
              color: '#F5F1E8',
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              marginBottom: '20px',
              textShadow: '0 4px 20px rgba(0,0,0,0.8)',
            }}
          >
            Transform How Buildings <br />
            <span style={{ color: '#D4841A' }}>Consume Energy</span>
          </h1>

          <p
            style={{
              fontFamily: 'Outfit',
              fontSize: '1.25rem',
              fontWeight: 400,
              color: '#D1CCC3',
              maxWidth: '680px',
              margin: '0 auto 36px auto',
              lineHeight: 1.6,
            }}
          >
            AI-powered intelligence for smarter buildings. Cut waste. Improve comfort. Integrate with grids.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '60px' }}>
            <button
              onClick={() => {
                triggerAIAnalysis();
                navigate('/dashboard');
              }}
              className="btn-primary"
              style={{ padding: '14px 28px', fontSize: '1rem' }}
            >
              <span>Start Analysis</span>
              <ArrowRight size={18} />
            </button>

            <button
              onClick={() => navigate('/dashboard')}
              style={{
                padding: '14px 28px',
                backgroundColor: 'rgba(26, 26, 26, 0.8)',
                backdropFilter: 'blur(4px)',
                border: '1px solid #3A3A3A',
                borderRadius: '4px',
                color: '#F5F1E8',
                fontFamily: 'Space Grotesk',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Watch Demo
            </button>
          </div>

          {/* 3 KPI Summary Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '20px',
              maxWidth: '900px',
              margin: '0 auto 40px auto',
            }}
          >
            <div style={{ backgroundColor: 'rgba(22, 22, 22, 0.9)', backdropFilter: 'blur(8px)', border: '1px solid #242424', borderRadius: '6px', padding: '20px', textAlign: 'left' }}>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: '#64748B', letterSpacing: '0.08em', marginBottom: '6px' }}>
                AVG. DEMAND SHAVED
              </div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '2.2rem', fontWeight: 700, color: '#E89B3C' }}>
                28.4%
              </div>
              <div style={{ fontFamily: 'DM Sans', fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
                PEAK REDUCTION
              </div>
            </div>

            <div style={{ backgroundColor: 'rgba(22, 22, 22, 0.9)', backdropFilter: 'blur(8px)', border: '1px solid #242424', borderRadius: '6px', padding: '20px', textAlign: 'left' }}>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: '#64748B', letterSpacing: '0.08em', marginBottom: '6px' }}>
                REAL-TIME PORTFOLIO ROI
              </div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '2.2rem', fontWeight: 700, color: '#F5F1E8' }}>
                $4.2M
              </div>
              <div style={{ fontFamily: 'DM Sans', fontSize: '0.75rem', color: '#34D399', marginTop: '4px' }}>
                SAVINGS IDENTIFIED
              </div>
            </div>

            <div style={{ backgroundColor: 'rgba(22, 22, 22, 0.9)', backdropFilter: 'blur(8px)', border: '1px solid #242424', borderRadius: '6px', padding: '20px', textAlign: 'left' }}>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: '#64748B', letterSpacing: '0.08em', marginBottom: '6px' }}>
                AUTOMATED DEMAND RESP.
              </div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '2.2rem', fontWeight: 700, color: '#34D399' }}>
                99.98%
              </div>
              <div style={{ fontFamily: 'DM Sans', fontSize: '0.75rem', color: '#7CB899', marginTop: '4px' }}>
                GRID RELIABILITY
              </div>
            </div>
          </div>

          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: '#64748B', letterSpacing: '0.12em' }}>
            EXPLORE PLATFORM ∨
          </div>
        </div>
      </section>

      {/* Operators Logo Ticker Band */}
      <section style={{ backgroundColor: '#121212', borderTop: '1px solid #1E1E1E', borderBottom: '1px solid #1E1E1E', padding: '16px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Cinzel', fontSize: '0.72rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.1em' }}>
          <span style={{ color: '#E89B3C', fontWeight: 800 }}>VALIDATED BY MAJOR OPERATORS & ISO UTILITIES:</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Sparkles size={11} color="#E89B3C" /> VERTEX REIT</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Sparkles size={11} color="#E89B3C" /> NY-ISO GRID</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Sparkles size={11} color="#E89B3C" /> HYPERSCALE IV</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Sparkles size={11} color="#E89B3C" /> CROWNE REALTY</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Sparkles size={11} color="#E89B3C" /> PJM ENERGY</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Sparkles size={11} color="#E89B3C" /> MERIDIAN TOWERS</span>
        </div>
      </section>

      {/* Operational Console Showcase Section */}
      <section style={{ padding: '80px 40px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ fontFamily: 'Cinzel', fontSize: '0.72rem', fontWeight: 700, color: '#E89B3C', letterSpacing: '0.14em', marginBottom: '8px' }}>
          • OPERATIONAL CONSOLE LAYER
        </div>

        <h2 style={{ fontFamily: 'Syne', fontSize: '2.8rem', fontWeight: 800, color: '#F5F1E8', marginBottom: '14px' }}>
          Autonomous HVAC & Microgrid Dispatch
        </h2>

        <p style={{ fontFamily: 'Outfit', fontSize: '1.05rem', color: '#94A3B8', maxWidth: '750px', marginBottom: '32px' }}>
          GridFlex Engine continuously models thermodynamic lag, dynamic tariff schedules, and on-site BESS discharge to shave peaks without human intervention.
        </p>

        {/* View Mode Tabs & Mock Console Box */}
        <div style={{ backgroundColor: '#161616', border: '1px solid #242424', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#121212', padding: '12px 24px', borderBottom: '1px solid #202020' }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.72rem', color: '#E89B3C' }}>
              NODE // NY-MIDTOWN-TOWER-01
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <span className="badge badge-copper">Real-time Telemetry</span>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: '#64748B', padding: '4px 8px' }}>Peak Shaving</span>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: '#64748B', padding: '4px 8px' }}>Carbon Arbitrage</span>
            </div>
          </div>

          <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '7fr 3fr', gap: '24px' }}>
            {/* Left Graph Showcase */}
            <div style={{ backgroundColor: '#121212', border: '1px solid #222', borderRadius: '6px', padding: '20px' }}>
              <div style={{ fontFamily: 'Space Grotesk', fontSize: '1rem', fontWeight: 700, color: '#F5F1E8', marginBottom: '4px' }}>
                Dynamic Demand vs. Predictive Ceiling
              </div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.72rem', color: '#E89B3C', marginBottom: '16px' }}>
                Live Dispatch: 1,614 kW (-256 kW below cap)
              </div>
              {/* Live telemetry SVG chart */}
              <div style={{ height: '200px', backgroundColor: '#161616', borderRadius: '4px', border: '1px solid #222', position: 'relative', overflow: 'hidden' }}>
                <svg width="100%" height="100%" viewBox="0 0 600 200" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Grid lines */}
                  {[40,80,120,160].map(y => (
                    <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="#1E2A38" strokeWidth="1" strokeDasharray="4 4" />
                  ))}
                  {[100,200,300,400,500].map(x => (
                    <line key={x} x1={x} y1="0" x2={x} y2="200" stroke="#1A2332" strokeWidth="1" />
                  ))}

                  {/* Predictive ceiling — flat amber dashed line */}
                  <line x1="0" y1="55" x2="600" y2="55" stroke="#D97706" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.7" />
                  <text x="8" y="50" fontFamily="monospace" fontSize="9" fill="#D97706" opacity="0.9">CAP 1,870 kW</text>

                  {/* Demand area fill */}
                  <defs>
                    <linearGradient id="demandGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0284C7" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#0284C7" stopOpacity="0.02" />
                    </linearGradient>
                    <linearGradient id="solarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D97706" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#D97706" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>

                  {/* Demand area */}
                  <path
                    d="M0,130 C30,120 60,110 100,95 C140,80 160,75 200,80 C240,85 260,100 300,88 C340,76 370,68 410,72 C450,76 480,82 520,78 C550,75 575,70 600,68 L600,200 L0,200 Z"
                    fill="url(#demandGrad)"
                  />
                  {/* Demand line */}
                  <path
                    d="M0,130 C30,120 60,110 100,95 C140,80 160,75 200,80 C240,85 260,100 300,88 C340,76 370,68 410,72 C450,76 480,82 520,78 C550,75 575,70 600,68"
                    fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  />

                  {/* Solar area */}
                  <path
                    d="M0,185 C40,175 80,160 120,140 C160,120 190,105 230,92 C270,79 300,78 340,82 C380,86 410,100 450,115 C490,130 530,155 600,170 L600,200 L0,200 Z"
                    fill="url(#solarGrad)"
                  />
                  {/* Solar line */}
                  <path
                    d="M0,185 C40,175 80,160 120,140 C160,120 190,105 230,92 C270,79 300,78 340,82 C380,86 410,100 450,115 C490,130 530,155 600,170"
                    fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  />

                  {/* Live cursor dot on demand line */}
                  <circle cx="520" cy="78" r="4" fill="#38BDF8" />
                  <circle cx="520" cy="78" r="8" fill="none" stroke="#38BDF8" strokeWidth="1" opacity="0.4">
                    <animate attributeName="r" values="6;14;6" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
                  </circle>

                  {/* Tick labels — x axis */}
                  {[
                    [0,'14:00'],[100,'15:00'],[200,'16:00'],[300,'17:00'],[400,'18:00'],[500,'19:00'],
                  ].map(([x, t]) => (
                    <text key={t} x={x+4} y="196" fontFamily="monospace" fontSize="8" fill="#475569">{t}</text>
                  ))}

                  {/* Y-axis labels */}
                  {[
                    [55,'1,870'],[88,'1,614'],[130,'1,200'],[160,'900'],
                  ].map(([y, v]) => (
                    <text key={v} x="4" y={y-3} fontFamily="monospace" fontSize="8" fill="#334155">{v}</text>
                  ))}

                  {/* Legend */}
                  <rect x="420" y="8" width="10" height="3" fill="#38BDF8" rx="1" />
                  <text x="434" y="14" fontFamily="monospace" fontSize="8" fill="#94A3B8">Demand (kW)</text>
                  <rect x="420" y="20" width="10" height="3" fill="#D97706" rx="1" />
                  <text x="434" y="26" fontFamily="monospace" fontSize="8" fill="#94A3B8">Solar (kW)</text>
                </svg>
              </div>
            </div>

            {/* Right Advisories Side Box */}
            <div style={{ backgroundColor: '#121212', border: '1px solid #222', borderRadius: '6px', padding: '18px' }}>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.68rem', color: '#64748B', marginBottom: '12px' }}>
                DIAGNOSTIC FEED
              </div>

              <div style={{ backgroundColor: '#1E1818', borderLeft: '3px solid #FF6B5B', padding: '10px 12px', borderRadius: '3px', marginBottom: '12px' }}>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: '#FF6B5B', fontWeight: 700 }}>DELTA-T ANOMALY</div>
                <div style={{ fontFamily: 'Space Grotesk', fontSize: '0.82rem', color: '#F5F1E8', fontWeight: 600, marginTop: '2px' }}>CHILLER 04 DELTA-T ANOMALY</div>
                <p style={{ fontFamily: 'DM Sans', fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>Low delta-T syndrome in Loop C. Auto-balancing primary bypass valve.</p>
              </div>

              <div style={{ backgroundColor: '#1E1B14', borderLeft: '3px solid #E8A035', padding: '10px 12px', borderRadius: '3px' }}>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: '#E8A035', fontWeight: 700 }}>TARIFF SURGE INBOUND</div>
                <div style={{ fontFamily: 'Space Grotesk', fontSize: '0.82rem', color: '#F5F1E8', fontWeight: 600, marginTop: '2px' }}>PEAK TARIFF WINDOW IN 42 MIN</div>
                <p style={{ fontFamily: 'DM Sans', fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>Pre-cooling thermal mass by 1.5°F starting now.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Modules Section */}
      <section style={{ backgroundColor: '#121212', borderTop: '1px solid #1E1E1E', padding: '80px 40px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: '#E89B3C', letterSpacing: '0.12em', marginBottom: '8px' }}>
              BUILT FOR HYPERSCALE PORTFOLIOS
            </div>
            <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '2.5rem', fontWeight: 700, color: '#F5F1E8' }}>
              Surgical Grid Intelligence Across Every Conduit
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {/* Module 1 */}
            <div style={{ backgroundColor: '#161616', border: '1px solid #242424', borderRadius: '8px', padding: '28px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '6px', backgroundColor: 'rgba(212, 132, 26, 0.15)', color: '#D4841A', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Sliders size={20} />
              </div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.68rem', color: '#64748B', marginBottom: '4px' }}>MODULE // 01</div>
              <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.25rem', fontWeight: 700, color: '#F5F1E8', marginBottom: '10px' }}>
                Dynamic Load Modulation
              </h3>
              <p style={{ fontFamily: 'DM Sans', fontSize: '0.88rem', color: '#94A3B8', lineHeight: '1.5', marginBottom: '16px' }}>
                Autonomous thermodynamic modeling senses chilled water delta-T, ambient wet-bulb, and occupant density to adjust fan curves with sub-second accuracy.
              </p>
              <span className="badge badge-copper">CHILLER PLANT VFD 42.8 Hz (-14% kWh)</span>
            </div>

            {/* Module 2 */}
            <div style={{ backgroundColor: '#161616', border: '1px solid #242424', borderRadius: '8px', padding: '28px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '6px', backgroundColor: 'rgba(52, 211, 153, 0.15)', color: '#34D399', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Zap size={20} />
              </div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.68rem', color: '#64748B', marginBottom: '4px' }}>MODULE // 02</div>
              <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.25rem', fontWeight: 700, color: '#F5F1E8', marginBottom: '10px' }}>
                Grid Arbitrage & Storage
              </h3>
              <p style={{ fontFamily: 'DM Sans', fontSize: '0.88rem', color: '#94A3B8', lineHeight: '1.5', marginBottom: '16px' }}>
                Charge BESS arrays during negative pricing intervals. Automatically inject power or reduce facility draw during high-spread 4CP tariff events without risking tenant comfort.
              </p>
              <span className="badge badge-good">SPREAD CAPTURE +$1,840/day Margin</span>
            </div>

            {/* Module 3 */}
            <div style={{ backgroundColor: '#161616', border: '1px solid #242424', borderRadius: '8px', padding: '28px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '6px', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Shield size={20} />
              </div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.68rem', color: '#64748B', marginBottom: '4px' }}>MODULE // 03</div>
              <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.25rem', fontWeight: 700, color: '#F5F1E8', marginBottom: '10px' }}>
                Automated ESG & LEED
              </h3>
              <p style={{ fontFamily: 'DM Sans', fontSize: '0.88rem', color: '#94A3B8', lineHeight: '1.5', marginBottom: '16px' }}>
                Direct export to ENERGY STAR Portfolio Manager, Arc Skyscraper LEED scoring, and GRESB real estate standards with cryptographic telemetry checksums.
              </p>
              <span className="badge badge-live">LEED ARC SCORE 94/100 (Platinum)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Spatial Building Intelligence Section with Building Photo #2 Showcase Card */}
      <section style={{ padding: '80px 40px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: '#E89B3C', letterSpacing: '0.12em', marginBottom: '8px' }}>
          • SPATIAL BUILDING INTELLIGENCE
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center' }}>
          {/* Left Column Text & Feature List */}
          <div>
            <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '2.8rem', fontWeight: 700, color: '#F5F1E8', marginBottom: '16px', lineHeight: 1.15 }}>
              Engineered for the Modern Skylines
            </h2>

            <p style={{ fontFamily: 'DM Sans', fontSize: '1.05rem', color: '#94A3B8', lineHeight: '1.6', marginBottom: '28px' }}>
              Commercial skyscrapers are thermal batteries waiting for intelligent choreography. By treating structural concrete and chilled water loops as active storage, GridFlex AI transforms energy liabilities into grid stabilization assets.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '36px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <CheckCircle size={22} color="#E89B3C" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontFamily: 'Space Grotesk', fontSize: '1rem', fontWeight: 700, color: '#F5F1E8' }}>
                    Plug-and-play BACnet/IP gateway
                  </div>
                  <div style={{ fontFamily: 'DM Sans', fontSize: '0.85rem', color: '#94A3B8', marginTop: '2px' }}>
                    Zero hardware rip-and-replace. Integrates directly with Siemens Desigo, Johnson Controls Metasys, and Honeywell EBI.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <CheckCircle size={22} color="#E89B3C" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontFamily: 'Space Grotesk', fontSize: '1rem', fontWeight: 700, color: '#F5F1E8' }}>
                    Autonomous Micro-Dispatch
                  </div>
                  <div style={{ fontFamily: 'DM Sans', fontSize: '0.85rem', color: '#94A3B8', marginTop: '2px' }}>
                    Local edge nodes run inference without latency or cloud round-trips for safety-critical shedding.
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button className="btn-primary" style={{ padding: '12px 24px', fontSize: '0.95rem' }}>
                <span>Schedule Substation Audit</span>
              </button>
              <span style={{ fontFamily: 'DM Sans', fontSize: '0.85rem', color: '#64748B' }}>
                Deploy in &lt; 48 hours
              </span>
            </div>
          </div>

          {/* Right Column: Building Photo #2 Showcase Card */}
          <div
            style={{
              position: 'relative',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1px solid #282828',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(212, 132, 26, 0.1)',
            }}
          >
            <img
              src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80"
              alt="One Hudson Rise Skyscraper"
              style={{ width: '100%', height: '440px', objectFit: 'cover', display: 'block' }}
            />

            {/* Overlaid Bottom Telemetry Overlay Box */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '20px',
                backgroundColor: 'rgba(15, 15, 15, 0.92)',
                backdropFilter: 'blur(8px)',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.6rem', color: '#64748B', letterSpacing: '0.05em' }}>
                  FACILITY TOWER
                </div>
                <div style={{ fontFamily: 'Space Grotesk', fontSize: '0.85rem', fontWeight: 700, color: '#F5F1E8' }}>
                  One Hudson Rise
                </div>
              </div>

              <div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.6rem', color: '#64748B', letterSpacing: '0.05em' }}>
                  SOLAR PV INTEGRATION
                </div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.85rem', fontWeight: 700, color: '#38BDF8' }}>
                  410 kW Array
                </div>
              </div>

              <div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.6rem', color: '#64748B', letterSpacing: '0.05em' }}>
                  SAVINGS YTD
                </div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.85rem', fontWeight: 700, color: '#34D399' }}>
                  $384,120
                </div>
              </div>

              <div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.6rem', color: '#64748B', letterSpacing: '0.05em' }}>
                  GRID RESP. STATUS
                </div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.78rem', fontWeight: 700, color: '#34D399' }}>
                  • OPTIMIZED
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Gateway Access Banner CTA */}
      <section style={{ padding: '80px 40px', maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
        <div
          style={{
            backgroundColor: '#161616',
            border: '1px solid #D4841A',
            borderRadius: '8px',
            padding: '48px 36px',
            boxShadow: '0 0 40px rgba(212, 132, 26, 0.15)',
          }}
        >
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: '#E89B3C', letterSpacing: '0.1em', marginBottom: '12px' }}>
            ENTERPRISE GATEWAY ACCESS
          </div>

          <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '2.5rem', fontWeight: 700, color: '#F5F1E8', marginBottom: '16px' }}>
            Connect Your Facility In Minutes. Calculate Exact Energy Yields.
          </h2>

          <p style={{ fontFamily: 'DM Sans', fontSize: '1.05rem', color: '#94A3B8', maxWidth: '680px', margin: '0 auto 32px auto' }}>
            Upload 12 months of utility intervals or connect via API. Our neural network immediately isolates peak demand drivers and verifies automated demand savings.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '24px' }}>
            <button onClick={() => navigate('/dashboard')} className="btn-primary" style={{ padding: '12px 24px', fontSize: '0.95rem' }}>
              <span>Launch Immediate Analysis</span>
            </button>

            <button
              onClick={() => navigate('/dashboard')}
              style={{
                padding: '12px 24px',
                backgroundColor: '#1E1E1E',
                border: '1px solid #3A3A3A',
                borderRadius: '4px',
                color: '#F5F1E8',
                fontFamily: 'Space Grotesk',
                fontSize: '0.95rem',
                cursor: 'pointer',
              }}
            >
              Read Technical Docs
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', fontFamily: 'JetBrains Mono', fontSize: '0.72rem', color: '#64748B' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Lock size={12} color="#34D399" /> TLS 1.3 End-to-End</span>
            <span>• SOC 2 Type II</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Zap size={12} color="#E89B3C" /> Zero Latency Shaving</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: '#0B0B0B', borderTop: '1px solid #1E1E1E', padding: '60px 40px 30px 40px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '40px', marginBottom: '40px' }}>
          <div>
            <div style={{ fontFamily: 'Space Grotesk', fontSize: '1.1rem', fontWeight: 700, color: '#F5F1E8', marginBottom: '8px' }}>
              GridFlex AI
            </div>
            <p style={{ fontFamily: 'DM Sans', fontSize: '0.85rem', color: '#64748B', maxWidth: '280px' }}>
              High-performance spatial grid analytics and autonomous telemetry intelligence engineered for commercial operations.
            </p>
          </div>

          <div>
            <h4 style={{ fontFamily: 'Space Grotesk', fontSize: '0.88rem', fontWeight: 700, color: '#F5F1E8', marginBottom: '12px' }}>PLATFORM</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: 'DM Sans', fontSize: '0.82rem', color: '#94A3B8' }}>
              <span>Substation Telemetry</span>
              <span>Predictive Shedding</span>
              <span>Carbon Displacement</span>
            </div>
          </div>

          <div>
            <h4 style={{ fontFamily: 'Space Grotesk', fontSize: '0.88rem', fontWeight: 700, color: '#F5F1E8', marginBottom: '12px' }}>ENGINEERS & APIS</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: 'DM Sans', fontSize: '0.82rem', color: '#94A3B8' }}>
              <span>API Documentation</span>
              <span>SCADA Integrations</span>
              <span>Modbus & BACnet</span>
            </div>
          </div>

          <div>
            <h4 style={{ fontFamily: 'Space Grotesk', fontSize: '0.88rem', fontWeight: 700, color: '#F5F1E8', marginBottom: '12px' }}>COMPLIANCE</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: 'DM Sans', fontSize: '0.82rem', color: '#94A3B8' }}>
              <span>ISO 50001 Verified</span>
              <span>LEED Arc Analytics</span>
              <span>SOC 2 Type II</span>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #1A1A1A', paddingTop: '20px', maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: '#64748B' }}>
          <span>© 2026 GridFlex AI Systems Inc. Telemetry architecture engineered for mission-critical infrastructure.</span>
          <span>ISO 50001 CERTIFIED • NERC CIP VALIDATED</span>
        </div>
      </footer>
    </div>
  );
}
