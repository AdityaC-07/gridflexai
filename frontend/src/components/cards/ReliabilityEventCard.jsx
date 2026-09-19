import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, Zap, ShieldCheck, CheckCircle, XCircle, Play, Pause } from 'lucide-react';
import axios from 'axios';
import { CONFIG } from '../../config';

export function ReliabilityEventCard({ feederId = 'F01' }) {
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

  const getRiskColor = (level) => {
    switch (level) {
      case 'LOW': return { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' };
      case 'MEDIUM': return { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' };
      case 'HIGH': return { bg: '#FEF2F2', text: '#DC2626', border: '#FCA5A5' };
      case 'CRITICAL': return { bg: '#7F1D1D', text: '#FFFFFF', border: '#991B1B' };
      default: return { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' };
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PREDICTED': return { bg: '#FEF3C7', text: '#D97706' };
      case 'OPERATOR_APPROVED': return { bg: '#DBEAFE', text: '#2563EB' };
      case 'DISPATCHED': return { bg: '#D1FAE5', text: '#059669' };
      case 'VERIFIED': return { bg: '#D1FAE5', text: '#059669' };
      default: return { bg: '#F1F5F9', text: '#64748B' };
    }
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
          <div style={{ backgroundColor: '#F8FAFC', padding: '8px', borderRadius: '4px' }}>
            <div style={{ color: '#64748B', fontWeight: 600 }}>Duration</div>
            <div style={{ fontWeight: 700, fontFamily: 'monospace' }}>{activeEvent.duration_minutes} min</div>
          </div>
          <div style={{ backgroundColor: '#F8FAFC', padding: '8px', borderRadius: '4px' }}>
            <div style={{ color: '#64748B', fontWeight: 600 }}>Time to Event</div>
            <div style={{ fontWeight: 700, fontFamily: 'monospace' }}>{activeEvent.time_to_event_minutes || 45} min</div>
          </div>
          <div style={{ backgroundColor: '#F8FAFC', padding: '8px', borderRadius: '4px' }}>
            <div style={{ color: '#64748B', fontWeight: 600 }}>Forecast Confidence</div>
            <div style={{ fontWeight: 700, fontFamily: 'monospace' }}>{(activeEvent.forecast_confidence * 100).toFixed(0)}%</div>
          </div>
          <div style={{ backgroundColor: '#F8FAFC', padding: '8px', borderRadius: '4px' }}>
            <div style={{ color: '#64748B', fontWeight: 600 }}>Critical Load</div>
            <div style={{ fontWeight: 700, fontFamily: 'monospace', color: '#059669' }}>{activeEvent.critical_load_kw} kW</div>
          </div>
        </div>

        {/* Flexibility Pool */}
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', marginBottom: '6px' }}>
            FLEXIBILITY POOL
          </div>
          <div style={{ backgroundColor: '#F8FAFC', padding: '8px', borderRadius: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.75rem', color: '#475569' }}>Available:</span>
              <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{activeEvent.flexibility_available_kw} kW</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', color: '#475569' }}>Needed:</span>
              <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{activeEvent.predicted_gap_kw} kW</span>
            </div>
          </div>
        </div>

        {/* Dispatch Plan */}
        {dispatchPlan && resources.length > 0 && (
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', marginBottom: '6px' }}>
              DISPATCH PLAN
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '120px', overflowY: 'auto' }}>
              {resources.map((resource, idx) => (
                <div key={resource.resource_id} style={{
                  backgroundColor: '#F8FAFC',
                  padding: '6px 8px',
                  borderRadius: '4px',
                  border: '1px solid #E2E8F0',
                  fontSize: '0.75rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {getResourceIcon(resource.resource_type)}
                      <span style={{ fontWeight: 600 }}>{resource.resource_name}</span>
                    </div>
                    <div style={{ fontWeight: 700, fontFamily: 'monospace' }}>{resource.dispatch_kw} kW</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px', fontSize: '0.7rem', color: '#64748B' }}>
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
          <div style={{ backgroundColor: '#F0FDF4', padding: '8px', borderRadius: '4px', border: '1px solid #BBF7D0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={14} color="#059669" />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#059669' }}>Battery Reserve After</span>
              </div>
              <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#059669' }}>
                {activeEvent.battery_reserve_after_pct}%
              </span>
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
            <div style={{
              flex: 1,
              padding: '8px 12px',
              backgroundColor: '#DBEAFE',
              color: '#1E40AF',
              borderRadius: '4px',
              fontWeight: 600,
              fontSize: '0.8rem',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}>
              <Play size={14} />
              Dispatching...
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
