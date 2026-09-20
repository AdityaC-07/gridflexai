import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, Zap, ShieldCheck, CheckCircle, Play, Pause } from 'lucide-react';
import axios from 'axios';
import { CONFIG } from '../../config';
import { useBuildingContext } from '../../context/BuildingContext';

export function ReliabilityEventCard({ feederId = 'F01' }) {
  const { theme } = useBuildingContext();
  const isLight = theme === 'light';
  const [activeEvent, setActiveEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);

  useEffect(() => {
    loadActiveEvent();
    const interval = setInterval(loadActiveEvent, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [feederId]);

  const loadActiveEvent = async () => {
    try {
      const response = await axios.get(`${CONFIG.API_BASE_URL}/api/v1/events?feeder_id=${feederId}&active_only=true`);
      const events = response.data.events || [];
      setActiveEvent(events.length > 0 ? events[0] : null);
    } catch (error) {
      console.error('Failed to load reliability events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = async () => {
    if (!activeEvent) return;
    setOptimizing(true);
    try {
      await axios.post(`${CONFIG.API_BASE_URL}/api/v1/events/${activeEvent.event_id}/optimize`, { feeder_id: feederId });
      await loadActiveEvent();
    } catch (error) {
      console.error('Failed to optimize event:', error);
      alert('Optimization failed. Please try again.');
    } finally {
      setOptimizing(false);
    }
  };

  const handleApprove = async () => {
    if (!activeEvent) return;
    try {
      await axios.post(`${CONFIG.API_BASE_URL}/api/v1/events/${activeEvent.event_id}/approve`, { approved_by: 'operator' });
      await loadActiveEvent();
    } catch (error) {
      console.error('Failed to approve event:', error);
      alert('Approval failed. Please try again.');
    }
  };

  // Theme tokens
  const bgCard = isLight ? '#F8FAFC' : '#1A1A1A';
  const border = isLight ? '#E2E8F0' : '#242424';
  const valCol = isLight ? '#0F172A' : '#F5F1E8';
  const dimCol = '#64748B';

  const getRiskColor = (level) => {
    const m = {
      LOW:      { bg: isLight ? '#ECFDF5' : 'rgba(5,150,105,0.12)',  text: '#059669', border: isLight ? '#A7F3D0' : 'rgba(5,150,105,0.3)' },
      MEDIUM:   { bg: isLight ? '#FEF3C7' : 'rgba(217,119,6,0.12)',  text: '#D97706', border: isLight ? '#FDE68A' : 'rgba(217,119,6,0.3)' },
      HIGH:     { bg: isLight ? '#FEF2F2' : 'rgba(220,38,38,0.12)',  text: '#DC2626', border: isLight ? '#FCA5A5' : 'rgba(220,38,38,0.3)' },
      CRITICAL: { bg: '#7F1D1D',                                      text: '#FFFFFF', border: '#991B1B' },
    };
    return m[level] || { bg: isLight ? '#F1F5F9' : '#1A1A1A', text: isLight ? '#475569' : '#94A3B8', border: isLight ? '#CBD5E1' : '#2A2A2A' };
  };

  const getStatusColor = (status) => {
    const m = {
      PREDICTED:        { bg: isLight ? '#FEF3C7' : 'rgba(217,119,6,0.15)',  text: '#D97706' },
      OPERATOR_APPROVED:{ bg: isLight ? '#DBEAFE' : 'rgba(37,99,235,0.15)',  text: '#2563EB' },
      DISPATCHED:       { bg: isLight ? '#D1FAE5' : 'rgba(5,150,105,0.15)',  text: '#059669' },
      VERIFIED:         { bg: isLight ? '#D1FAE5' : 'rgba(5,150,105,0.15)',  text: '#059669' },
    };
    return m[status] || { bg: isLight ? '#F1F5F9' : '#1A1A1A', text: dimCol };
  };

  if (loading) {
    return (
      <div className="ops-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="ops-panel-header">
          <div className="ops-panel-title">
            <AlertTriangle size={16} color="#0284C7" />
            <span>Reliability Events</span>
          </div>
        </div>
        <div className="ops-panel-body" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: '#64748B', fontSize: '0.875rem' }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!activeEvent) {
    return (
      <div className="ops-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="ops-panel-header">
          <div className="ops-panel-title">
            <AlertTriangle size={16} color="#0284C7" />
            <span>Reliability Events</span>
          </div>
          <span className="tech-tag">NO ACTIVE EVENTS</span>
        </div>
        <div className="ops-panel-body" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: '#64748B' }}>
            <CheckCircle size={32} color="#10B981" style={{ marginBottom: '8px' }} />
            <div style={{ fontSize: '0.875rem' }}>No active reliability events</div>
            <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>System operating normally</div>
          </div>
        </div>
      </div>
    );
  }

  const riskStyle = getRiskColor(activeEvent.risk_level);
  const statusStyle = getStatusColor(activeEvent.status);
  const dispatchPlan = activeEvent.dispatch_plan;
  const resources = dispatchPlan?.resources || [];

  return (
    <div className="ops-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="ops-panel-header">
        <div className="ops-panel-title">
          <AlertTriangle size={16} color="#DC2626" />
          <span>Reliability Event</span>
        </div>
        <span className="tech-tag" style={{ backgroundColor: riskStyle.bg, color: riskStyle.text, border: `1px solid ${riskStyle.border}` }}>
          {activeEvent.risk_level}
        </span>
      </div>

      <div className="ops-panel-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
        {/* Event Header */}
        <div style={{
          backgroundColor: riskStyle.bg,
          border: `1px solid ${riskStyle.border}`,
          borderRadius: '6px',
          padding: '12px'
        }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: riskStyle.text, letterSpacing: '0.05em' }}>
            {activeEvent.event_id}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: riskStyle.text }}>
              {activeEvent.predicted_gap_kw} kW Gap
            </div>
            <div style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              padding: '4px 8px',
              borderRadius: '4px',
              backgroundColor: statusStyle.bg,
              color: statusStyle.text
            }}>
              {activeEvent.status.replace(/_/g, ' ')}
            </div>
          </div>
        </div>

        {/* Event Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem' }}>
          {[
            ['Duration', `${activeEvent.duration_minutes} min`, valCol],
            ['Time to Event', `${activeEvent.time_to_event_minutes || 45} min`, valCol],
            ['Forecast Confidence', `${(activeEvent.forecast_confidence * 100).toFixed(0)}%`, valCol],
            ['Critical Load', `${activeEvent.critical_load_kw} kW`, '#059669'],
          ].map(([label, val, color]) => (
            <div key={label} style={{ backgroundColor: bgCard, padding: '8px', borderRadius: '4px', border: `1px solid ${border}` }}>
              <div style={{ color: dimCol, fontWeight: 600 }}>{label}</div>
              <div style={{ fontWeight: 700, fontFamily: 'monospace', color }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Flexibility Pool */}
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: dimCol, marginBottom: '6px' }}>FLEXIBILITY POOL</div>
          <div style={{ backgroundColor: bgCard, padding: '8px', borderRadius: '4px', border: `1px solid ${border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.75rem', color: dimCol }}>Available:</span>
              <span style={{ fontWeight: 700, fontFamily: 'monospace', color: valCol }}>{activeEvent.flexibility_available_kw} kW</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', color: dimCol }}>Needed:</span>
              <span style={{ fontWeight: 700, fontFamily: 'monospace', color: valCol }}>{activeEvent.predicted_gap_kw} kW</span>
            </div>
          </div>
        </div>

        {/* Dispatch Plan */}
        {dispatchPlan && resources.length > 0 && (
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: dimCol, marginBottom: '6px' }}>DISPATCH PLAN</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '120px', overflowY: 'auto' }}>
              {resources.map((resource) => (
                <div key={resource.resource_id} style={{ backgroundColor: bgCard, padding: '6px 8px', borderRadius: '4px', border: `1px solid ${border}`, fontSize: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {getResourceIcon(resource.resource_type)}
                      <span style={{ fontWeight: 600, color: valCol }}>{resource.resource_name}</span>
                    </div>
                    <div style={{ fontWeight: 700, fontFamily: 'monospace', color: valCol }}>{resource.dispatch_kw} kW</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px', fontSize: '0.7rem', color: dimCol }}>
                    <span>Priority {resource.priority}</span>
                    <span>{resource.duration_minutes} min</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Battery Reserve */}
        {activeEvent.battery_reserve_after_pct && (
          <div style={{ backgroundColor: isLight ? '#F0FDF4' : 'rgba(5,150,105,0.1)', padding: '8px', borderRadius: '4px', border: isLight ? '1px solid #BBF7D0' : '1px solid rgba(5,150,105,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={14} color="#059669" />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#059669' }}>Battery Reserve After</span>
              </div>
              <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#059669' }}>{activeEvent.battery_reserve_after_pct}%</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ marginTop: 'auto', display: 'flex', gap: '8px' }}>
          {activeEvent.status === 'PREDICTED' && !dispatchPlan && (
            <button
              onClick={handleOptimize}
              disabled={optimizing}
              style={{
                flex: 1,
                padding: '8px 12px',
                backgroundColor: '#0284C7',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: optimizing ? 'not-allowed' : 'pointer',
                opacity: optimizing ? 0.6 : 1
              }}
            >
              {optimizing ? 'Optimizing...' : 'Generate Plan'}
            </button>
          )}
          {activeEvent.status === 'PREDICTED' && dispatchPlan && (
            <>
              <button
                onClick={handleApprove}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  backgroundColor: '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Approve
              </button>
              <button
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  backgroundColor: '#DC2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Reject
              </button>
            </>
          )}
          {activeEvent.status === 'OPERATOR_APPROVED' && (
            <div style={{ flex: 1, padding: '8px 12px', backgroundColor: isLight ? '#DBEAFE' : 'rgba(37,99,235,0.15)', color: '#2563EB', borderRadius: '4px', fontWeight: 600, fontSize: '0.8rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Play size={14} />Dispatching...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getResourceIcon(type) {
  switch (type) {
    case 'battery': return <Zap size={14} color="#0284C7" />;
    case 'ev_charging': return <Clock size={14} color="#D97706" />;
    case 'hvac': return <Pause size={14} color="#6366F1" />;
    case 'water_pump': return <Zap size={14} color="#0891B2" />;
    case 'water_heater': return <Zap size={14} color="#EA580C" />;
    default: return <Zap size={14} color="#64748B" />;
  }
}
