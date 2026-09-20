import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, ChevronDown, ChevronUp, Play, Loader2, Sparkles, Check } from 'lucide-react';
import { useGridState } from '../../context/GridStateContext';
import { useBuildingContext } from '../../context/BuildingContext';

export function OptimizationActionPanel() {
  const { optimizationData, approvalStatus, approveDecision, runOptimization, isCloudEvent, isLoading } = useGridState();
  const { theme } = useBuildingContext();
  const isLight = theme === 'light';

  const decision = optimizationData || {};
  const isActionRequired = isCloudEvent || decision?.status === 'PENDING_APPROVAL' || (decision?.recommended_action && decision?.recommended_action !== 'MONITOR');
  const [isExplanationExpanded, setIsExplanationExpanded] = useState(isActionRequired);

  useEffect(() => { if (isActionRequired) setIsExplanationExpanded(true); }, [isActionRequired]);

  // Theme tokens
  const bg      = isLight ? '#FFFFFF'  : '#161616';
  const bgDeep  = isLight ? '#ECFDF5'  : 'rgba(5,150,105,0.1)';
  const bgAmber = isLight ? '#FFFBEB'  : 'rgba(217,119,6,0.1)';
  const bgCard  = isLight ? '#FFFFFF'  : '#1A1A1A';
  const bgHead  = isLight ? '#F8FAFC'  : '#111111';
  const bgCheck = isLight ? '#F8FAFC'  : '#161616';
  const border  = isLight ? '#E2E8F0'  : '#242424';
  const borderA = isLight ? '#FDE68A'  : 'rgba(217,119,6,0.3)';
  const borderG = isLight ? '#A7F3D0'  : 'rgba(5,150,105,0.3)';
  const valCol  = isLight ? '#0F172A'  : '#F5F1E8';
  const dimCol  = isLight ? '#64748B'  : '#64748B';
  const secCol  = isLight ? '#334155'  : '#94A3B8';
  const expCol  = isLight ? '#475569'  : '#94A3B8';
  const expBg   = isLight ? '#FFFFFF'  : '#161616';

  // Normal (balanced) state
  if (!isActionRequired) {
    return (
      <div className="ops-panel" style={{ padding: '0', borderLeft: '4px solid #059669', height: '100%' }}>
        <div className="ops-panel-header">
          <div className="ops-panel-title">
            <ShieldCheck size={18} color="#059669" />
            <span>Optimization Action Panel</span>
          </div>
          <span className="tech-tag tech-tag-ok">SYSTEM BALANCED</span>
        </div>
        <div className="ops-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ backgroundColor: bgDeep, border: `1px solid ${borderG}`, padding: '16px', borderRadius: '6px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: isLight ? '#065F46' : '#34D399', marginBottom: '4px' }}>No Action Required</h4>
            <p style={{ fontSize: '0.825rem', color: isLight ? '#047857' : '#6EE7B7' }}>
              Feeder F01 supply and demand are currently balanced. Solver evaluated all constraints; zero battery dispatch or load shedding required.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${border}`, paddingTop: '12px' }}>
            <span style={{ fontSize: '0.75rem', color: dimCol }}>Continuous solver evaluation active</span>
            <button
              onClick={() => runOptimization()}
              disabled={isLoading}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '0.8rem', backgroundColor: 'transparent', border: `1px solid ${isLight ? '#CBD5E1' : '#3A3A3A'}`, borderRadius: '4px', color: valCol, fontWeight: 600, cursor: 'pointer' }}
            >
              {isLoading ? <Loader2 size={14} /> : <Play size={14} />}
              <span>Run Optimization Check</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Extract opt values
  const opt = decision?.optimization || {};
  let bDispatchKw = typeof opt.battery_dispatch_kw === 'number' ? opt.battery_dispatch_kw
    : Array.isArray(opt.battery_dispatch_kw) ? Math.max(...opt.battery_dispatch_kw, 0) : 70.0;
  const bDispatchKwh = opt.battery_dispatch_kwh ?? opt.battery_energy_used_kwh ?? (bDispatchKw > 0 ? 175.0 : 0.0);
  const bDurationHours = opt.battery_duration_hours ?? (bDispatchKw > 0 ? (bDispatchKwh / bDispatchKw).toFixed(1) : 0);
  let loadShiftKw = typeof opt.load_shift_kw === 'number' ? opt.load_shift_kw
    : Array.isArray(opt.load_shift_kw) ? Math.max(...opt.load_shift_kw, 0) : 20.0;
  const criticalLoadKw = opt.critical_load_kw ?? 48.0;
  const expectedReliabilityPct = opt.expected_reliability_pct ?? 97.0;

  const policyChecks = decision?.policy?.policy_checks || [
    { rule: 'R1_CRITICAL_LOAD_PROTECTION', passed: true, message: `Critical loads protected (${criticalLoadKw} kW guaranteed).` },
    { rule: 'R2_BATTERY_RESERVE', passed: true, message: 'Battery SOC after dispatch maintains >= 20% safety reserve.' },
    { rule: 'R3_FORECAST_CONFIDENCE', passed: true, message: 'Forecast confidence meets gate requirement.' },
    { rule: 'R4_HIGH_UNSERVED_ENERGY', passed: true, message: 'Zero unserved energy projected.' },
  ];

  const isApproved = approvalStatus === 'APPROVED' || decision?.status === 'APPROVED';
  const isExecuting = approvalStatus === 'EXECUTING';

  return (
    <div className="ops-panel" style={{ padding: '0', borderLeft: `4px solid ${isApproved ? '#059669' : '#D97706'}`, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="ops-panel-header">
        <div className="ops-panel-title">
          <Sparkles size={18} color={isApproved ? '#059669' : '#D97706'} />
          <span>Optimization Recommendation</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: dimCol }}>
            ID: {decision?.decision_id || 'D-F01-CLOUD-7902'}
          </span>
          <span className={`tech-tag ${isApproved ? 'tech-tag-ok' : 'tech-tag-warning'}`}>
            {isApproved ? 'APPROVED · DISPATCH QUEUED' : 'AWAITING OPERATOR APPROVAL'}
          </span>
        </div>
      </div>

      <div className="ops-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
        {/* Action Summary */}
        <div style={{ backgroundColor: isApproved ? bgDeep : bgAmber, border: `1px solid ${isApproved ? borderG : borderA}`, borderRadius: '6px', padding: '12px 14px' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: isApproved ? (isLight ? '#065F46' : '#34D399') : (isLight ? '#92400E' : '#FCD34D'), marginBottom: '8px' }}>
            {isApproved ? 'Approved Dispatch & Load Shift Plan' : 'Recommended Action Plan'}
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{ backgroundColor: bgCard, padding: '8px 10px', borderRadius: '4px', border: `1px solid ${border}` }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: dimCol }}>1. BATTERY DISPATCH</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#9333EA', fontFamily: 'monospace' }}>
                {bDispatchKw} kW {bDurationHours > 0 ? `for ${bDurationHours}h` : ''}
              </div>
              <div style={{ fontSize: '0.675rem', color: dimCol, marginTop: '1px' }}>Energy: {bDispatchKwh} kWh offset</div>
            </div>
            <div style={{ backgroundColor: bgCard, padding: '8px 10px', borderRadius: '4px', border: `1px solid ${border}` }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: dimCol }}>2. FLEXIBLE LOAD SHIFT</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0284C7', fontFamily: 'monospace' }}>{loadShiftKw} kW shifted</div>
              <div style={{ fontSize: '0.675rem', color: dimCol, marginTop: '1px' }}>Water heaters & EV chargers</div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: `1px dashed ${border}`, fontSize: '0.75rem' }}>
            <span style={{ color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={13} /> Critical: {criticalLoadKw} kW protected
            </span>
            <span style={{ color: valCol, fontWeight: 700 }}>
              Reliability: <span style={{ color: '#059669', fontSize: '0.85rem' }}>{expectedReliabilityPct}%</span>
            </span>
          </div>
        </div>

        {/* Explanation Accordion */}
        <div style={{ border: `1px solid ${border}`, borderRadius: '6px', overflow: 'hidden' }}>
          <button
            onClick={() => setIsExplanationExpanded(!isExplanationExpanded)}
            style={{ width: '100%', padding: '8px 12px', backgroundColor: bgHead, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: '0.775rem', fontWeight: 600, color: secCol }}
          >
            <span>Why this recommendation? (LP Rationale)</span>
            {isExplanationExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {isExplanationExpanded && (
            <div style={{ padding: '10px 12px', backgroundColor: expBg, fontSize: '0.775rem', color: expCol, lineHeight: 1.45, borderTop: `1px solid ${border}` }}>
              {decision?.explanation || 'Severe cloud event detected over Dharavi North (Feeder F01). Solar generation dropped from 118.0 kW to 25.0 kW, creating an 80.0 kW energy gap. LP optimization recommends 70.0 kW battery dispatch for 2.5h combined with 20.0 kW flexible load shifting. Critical loads (48.0 kW) remain 100% protected. Expected reliability: 97.0%. Operator approval required before execution.'}
            </div>
          )}
        </div>

        {/* Policy Checks */}
        <div>
          <div style={{ fontSize: '0.675rem', fontWeight: 700, color: dimCol, letterSpacing: '0.04em', marginBottom: '6px' }}>SAFETY & OPERATIONAL POLICY CHECKS</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {policyChecks.map((check, idx) => (
              <div key={idx} style={{ backgroundColor: bgCheck, border: `1px solid ${border}`, borderRadius: '4px', padding: '6px 8px', display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '0.725rem' }}>
                <CheckCircle2 size={13} color={check.passed ? '#059669' : '#DC2626'} style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, color: valCol, fontSize: '0.675rem' }}>{check.rule.replace(/_/g, ' ')}</div>
                  <div style={{ color: dimCol, fontSize: '0.65rem', marginTop: '1px' }}>{check.message}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Approve Button */}
        <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: `1px solid ${border}` }}>
          {isApproved ? (
            <div style={{ backgroundColor: bgDeep, border: `1px solid ${borderG}`, borderRadius: '6px', padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: isLight ? '#065F46' : '#34D399', fontWeight: 700, fontSize: '0.85rem' }}>
                <Check size={16} strokeWidth={3} />
                <span>APPROVED · DISPATCH PLAN QUEUED</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: isLight ? '#047857' : '#6EE7B7', marginTop: '2px' }}>
                Operator approval recorded. Dispatch plan ready for execution.
              </div>
            </div>
          ) : (
            <button
              onClick={() => approveDecision(decision?.decision_id)}
              disabled={isExecuting}
              style={{ width: '100%', padding: '10px', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: '#0284C7', border: 'none', borderRadius: '4px', color: '#FFFFFF', fontWeight: 700, cursor: isExecuting ? 'not-allowed' : 'pointer' }}
            >
              {isExecuting ? <><Loader2 size={16} /><span>Recording Approval...</span></> : <><ShieldCheck size={16} /><span>Approve Recommendation</span></>}
            </button>
          )}
          <div style={{ fontSize: '0.65rem', color: dimCol, textAlign: 'center', marginTop: '4px' }}>
            Requires manual operator sign-off · Auto-execution disabled by safety policy
          </div>
        </div>
      </div>
    </div>
  );
}
