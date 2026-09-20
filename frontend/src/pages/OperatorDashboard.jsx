import React, { useRef } from 'react';
import { KeyMetricsStrip } from '../components/cards/KeyMetricsStrip';
import { ForecastChart } from '../components/charts/ForecastChart';
import { GridIntelligencePanel } from '../components/cards/GridIntelligencePanel';
import { OptimizationActionPanel } from '../components/optimization/OptimizationActionPanel';
import { BatteryGauge } from '../components/cards/BatteryGauge';
import { EnergyFlowDiagram } from '../components/cards/EnergyFlowDiagram';
import { AlertBanner } from '../components/alerts/AlertBanner';
import { ReliabilityEventCard } from '../components/cards/ReliabilityEventCard';
import { FlexibilityPoolPanel } from '../components/cards/FlexibilityPoolPanel';
import { FeederDigitalTwin } from '../components/cards/FeederDigitalTwin';
import { useGridState } from '../context/GridStateContext';
import { useBuildingContext } from '../context/BuildingContext';

export function OperatorDashboard() {
  const { isCloudEvent, feederState, forecastData, optimizationData, approvalStatus, lastUpdated } = useGridState();
  const { theme } = useBuildingContext();
  const isLight = theme === 'light';
  const optRef = useRef(null);

  const scrollToOptimization = () => {
    if (optRef.current) {
      optRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const formattedTime = lastUpdated ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--';

  return (
    <div>
      {/* 1. Header Alert Banner */}
      <AlertBanner onReviewClick={scrollToOptimization} />

      {/* Scenario truthfulness banner */}
      {isCloudEvent && (
        <div style={{
          backgroundColor: isLight ? '#FFFBEB' : '#1C1608',
          border: isLight ? '1px solid #FDE68A' : '1px solid #78350F',
          borderRadius: '6px',
          padding: '10px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="tech-tag tech-tag-warning">SCENARIO MODE · Local Scenario Injection</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: isLight ? '#92400E' : '#FCD34D' }}>
              Demand / solar / gap / stress shown as scenario values. AWS live feed unaffected; optimization response below is live.
            </span>
          </div>
          <span className="tech-tag tech-tag-blue">LIVE TELEMETRY + ACTIVE SCENARIO</span>
        </div>
      )}

      {/* 2. Key Metrics Information Strip */}
      <KeyMetricsStrip />

      {/* Priority 1: Dynamic Layout Composition */}
      {isCloudEvent ? (
        /* CLOUD EVENT STATE: Promotes Optimization Action Panel directly into the top primary viewport */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
          {/* Row 1: Forecast Chart + Optimization Action Panel (Top Priority) */}
          <div ref={optRef} style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 1.3fr',
            gap: '20px'
          }}>
            <div style={{ height: '460px' }}>
              <ForecastChart />
            </div>
            <div style={{ height: '460px', boxShadow: '0 0 0 2px #FDE68A, 0 4px 12px rgba(217, 119, 6, 0.12)', borderRadius: '6px' }}>
              <OptimizationActionPanel />
            </div>
          </div>

          {/* Row 2: Grid Intelligence + Battery Asset + Feeder Digital Twin */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '20px'
          }}>
            <div style={{ height: '360px' }}>
              <GridIntelligencePanel />
            </div>
            <div style={{ height: '360px' }}>
              <BatteryGauge />
            </div>
            <div style={{ height: '360px' }}>
              <FeederDigitalTwin />
            </div>
          </div>

          {/* Row 3: Reliability Event + Flexibility Pool */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px'
          }}>
            <div style={{ height: '400px' }}>
              <ReliabilityEventCard feederId="F01" />
            </div>
            <div style={{ height: '400px' }}>
              <FlexibilityPoolPanel feederId="F01" />
            </div>
          </div>
        </div>
      ) : (
        /* NORMAL STATE: Calm operational layout */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
          {/* Row 1: Forecast Chart + Grid Intelligence */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2.1fr 1fr',
            gap: '20px'
          }}>
            <div style={{ height: '380px' }}>
              <ForecastChart />
            </div>
            <div style={{ height: '380px' }}>
              <GridIntelligencePanel />
            </div>
          </div>

          {/* Row 2: Optimization Panel + Battery Gauge + Feeder Digital Twin */}
          <div ref={optRef} style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr 1fr',
            gap: '20px'
          }}>
            <div style={{ height: '420px' }}>
              <OptimizationActionPanel />
            </div>
            <div style={{ height: '420px' }}>
              <BatteryGauge />
            </div>
            <div style={{ height: '420px' }}>
              <FeederDigitalTwin />
            </div>
          </div>

          {/* Row 3: Reliability Event + Flexibility Pool */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px'
          }}>
            <div style={{ height: '400px' }}>
              <ReliabilityEventCard feederId="F01" />
            </div>
            <div style={{ height: '400px' }}>
              <FlexibilityPoolPanel feederId="F01" />
            </div>
          </div>
        </div>
      )}

      {/* Operational Metadata Strip */}
      <div style={{
        backgroundColor: isLight ? '#FFFFFF' : '#111111',
        border: isLight ? '1px solid #E2E8DC' : '1px solid #1E1E1E',
        borderRadius: '6px',
        padding: '14px 20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: isLight ? '#475569' : '#64748B', letterSpacing: '0.04em' }}>
            OPERATIONAL INTELLIGENCE & TELEMETRY AUDIT
          </div>
          <span className="tech-tag tech-tag-blue">FEEDER F01 MONITOR</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', fontSize: '0.75rem' }}>
          <div style={{ borderLeft: `2px solid ${isLight ? '#0284C7' : '#D4841A'}`, paddingLeft: '8px' }}>
            <div style={{ color: '#94A3B8', fontSize: '0.65rem' }}>FORECAST CONFIDENCE</div>
            <div style={{ fontFamily: 'monospace', fontWeight: 700, color: isLight ? '#0F172A' : '#F5F1E8' }}>
              {forecastData?.forecast_confidence_pct || 89}%
            </div>
          </div>
          <div style={{ borderLeft: `2px solid ${isLight ? '#0284C7' : '#D4841A'}`, paddingLeft: '8px' }}>
            <div style={{ color: '#94A3B8', fontSize: '0.65rem' }}>ACTIVE DECISION ID</div>
            <div style={{ fontFamily: 'monospace', fontWeight: 700, color: isLight ? '#0284C7' : '#E89B3C' }}>
              {optimizationData?.decision_id || 'D-F01-NORMAL-001'}
            </div>
          </div>
          <div style={{ borderLeft: `2px solid ${isLight ? '#0284C7' : '#D4841A'}`, paddingLeft: '8px' }}>
            <div style={{ color: '#94A3B8', fontSize: '0.65rem' }}>DECISION STATUS</div>
            <div style={{ fontFamily: 'monospace', fontWeight: 700, color: isCloudEvent ? '#D97706' : '#059669' }}>
              {optimizationData?.status || (isCloudEvent ? 'PENDING_APPROVAL' : 'STABLE')}
            </div>
          </div>
          <div style={{ borderLeft: `2px solid ${isLight ? '#0284C7' : '#D4841A'}`, paddingLeft: '8px' }}>
            <div style={{ color: '#94A3B8', fontSize: '0.65rem' }}>OPERATOR APPROVAL</div>
            <div style={{ fontFamily: 'monospace', fontWeight: 700, color: approvalStatus === 'APPROVED' ? '#059669' : (isCloudEvent ? '#D97706' : '#059669') }}>
              {approvalStatus === 'APPROVED' ? 'APPROVED' : (isCloudEvent ? 'AWAITING SIGN-OFF' : 'NOT REQUIRED')}
            </div>
          </div>
          <div style={{ borderLeft: `2px solid ${isLight ? '#0284C7' : '#D4841A'}`, paddingLeft: '8px' }}>
            <div style={{ color: '#94A3B8', fontSize: '0.65rem' }}>LAST TELEMETRY UPDATE</div>
            <div style={{ fontFamily: 'monospace', fontWeight: 700, color: isLight ? '#0F172A' : '#F5F1E8' }}>
              {formattedTime} IST
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
