import React, { useState, useEffect } from 'react';
import { Zap, Clock, Thermometer, Droplets, Plug, Building, Users, Sun, Layers } from 'lucide-react';
import axios from 'axios';
import { CONFIG } from '../../config';
import { useBuildingContext } from '../../context/BuildingContext';

export function FlexibilityPoolPanel({ feederId = 'F01' }) {
  const { theme } = useBuildingContext();
  const isLight = theme === 'light';
  const [poolData, setPoolData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPoolData();
    const interval = setInterval(loadPoolData, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, [feederId]);

  const loadPoolData = async () => {
    try {
      const response = await axios.get(`${CONFIG.API_BASE_URL}/api/v1/pool?feeder_id=${feederId}`);
      setPoolData(response.data);
    } catch (error) {
      console.error('Failed to load flexibility pool:', error);
    } finally {
      setLoading(false);
    }
  };

  const getResourceIcon = (type) => {
    switch (type) {
      case 'battery': return <Zap size={16} color="#0284C7" />;
      case 'ev_charging': return <Clock size={16} color="#D97706" />;
      case 'hvac': return <Thermometer size={16} color="#6366F1" />;
      case 'water_pump': return <Droplets size={16} color="#0891B2" />;
      case 'water_heater': return <Thermometer size={16} color="#EA580C" />;
      case 'commercial_load': return <Building size={16} color="#7C3AED" />;
      case 'rooftop_solar': return <Sun size={16} color="#F59E0B" />;
      default: return <Plug size={16} color="#64748B" />;
    }
  };

  const getOwnerIcon = (type) => {
    switch (type) {
      case 'community': return <Users size={14} color="#059669" />;
      case 'resident': return <Users size={14} color="#0284C7" />;
      case 'commercial': return <Building size={14} color="#7C3AED" />;
      case 'municipal': return <Building size={14} color="#DC2626" />;
      default: return <Users size={14} color="#64748B" />;
    }
  };

  // Theme tokens
  const bgCard = isLight ? '#F8FAFC' : '#1A1A1A';
  const border = isLight ? '#E2E8F0' : '#242424';
  const valCol = isLight ? '#0F172A' : '#F5F1E8';
  const dimCol = '#64748B';
  const divCol = isLight ? '#E2E8F0' : '#242424';

  const getDisruptionColor = (weight) => {
    if (weight <= 0.3) return { bg: isLight ? '#ECFDF5' : 'rgba(5,150,105,0.12)', text: '#059669' };
    if (weight <= 0.6) return { bg: isLight ? '#FEF3C7' : 'rgba(217,119,6,0.12)', text: '#D97706' };
    return { bg: isLight ? '#FEF2F2' : 'rgba(220,38,38,0.12)', text: '#DC2626' };
  };

  const getRBSDisplay = (rbs) => {
    if (!rbs) return 'N/A';
    const score = rbs.toFixed(1);
    const bars = Math.min(5, Math.ceil(rbs / 2));
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{ width: '8px', height: '12px', backgroundColor: i < bars ? '#0284C7' : (isLight ? '#E2E8F0' : '#2A2A2A'), borderRadius: '1px' }} />
        ))}
        <span style={{ marginLeft: '4px', fontFamily: 'monospace', fontSize: '0.75rem' }}>{score}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="ops-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="ops-panel-header">
          <div className="ops-panel-title">
            <Layers size={16} color="#0284C7" />
            <span>Flexibility Pool</span>
          </div>
        </div>
        <div className="ops-panel-body" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: '#64748B', fontSize: '0.875rem' }}>Loading...</div>
        </div>
      </div>
    );
  }

  const resources = poolData?.resources || [];
  const totalAvailable = poolData?.total_available_kw || 0;
  const totalNeeded = poolData?.total_needed_kw || 0;
  const coverageRatio = poolData?.coverage_ratio || 0;
  const hasSufficientCoverage = poolData?.has_sufficient_coverage || false;

  return (
    <div className="ops-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="ops-panel-header">
        <div className="ops-panel-title">
          <Layers size={16} color="#0284C7" />
          <span>Flexibility Pool</span>
        </div>
        <span className="tech-tag">
          {resources.length} Resources
        </span>
      </div>

      <div className="ops-panel-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Pool Summary */}
        <div style={{ backgroundColor: hasSufficientCoverage ? (isLight ? '#ECFDF5' : 'rgba(5,150,105,0.12)') : (isLight ? '#FEF2F2' : 'rgba(220,38,38,0.12)'), border: `1px solid ${hasSufficientCoverage ? (isLight ? '#A7F3D0' : 'rgba(5,150,105,0.3)') : (isLight ? '#FCA5A5' : 'rgba(220,38,38,0.3)')}`, borderRadius: '6px', padding: '12px' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: hasSufficientCoverage ? '#059669' : '#DC2626', marginBottom: '4px' }}>POOL COVERAGE</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'monospace', color: hasSufficientCoverage ? '#059669' : '#DC2626' }}>{totalAvailable} kW</div>
              <div style={{ fontSize: '0.7rem', color: dimCol }}>Available</div>
            </div>
            <div style={{ fontSize: '1.5rem', color: dimCol }}>→</div>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'monospace', color: valCol }}>{totalNeeded} kW</div>
              <div style={{ fontSize: '0.7rem', color: dimCol }}>Needed</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'monospace', color: coverageRatio >= 1 ? '#059669' : '#D97706' }}>{(coverageRatio * 100).toFixed(0)}%</div>
              <div style={{ fontSize: '0.7rem', color: dimCol }}>Coverage</div>
            </div>
          </div>
        </div>

        {/* Resource List */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: dimCol, letterSpacing: '0.04em' }}>COMMUNITY RESOURCES (Ranked by RBS)</div>
          {resources.map((resource) => {
            const disruptionStyle = getDisruptionColor(resource.disruption_weight);
            return (
              <div key={resource.resource_id} style={{ backgroundColor: bgCard, padding: '10px', borderRadius: '4px', border: `1px solid ${border}`, fontSize: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getResourceIcon(resource.resource_type)}
                    <div>
                      <div style={{ fontWeight: 600, color: valCol }}>{resource.resource_name}</div>
                      <div style={{ fontSize: '0.7rem', color: dimCol, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {getOwnerIcon(resource.owner_type)}<span>{resource.owner_type}</span>
                        {resource.location_section && <span>· {resource.location_section}</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontFamily: 'monospace', color: valCol }}>{resource.available_kw} kW</div>
                    <div style={{ fontSize: '0.7rem', color: dimCol }}>{resource.max_duration_minutes} min</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '6px' }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: dimCol, marginBottom: '2px' }}>Response Time</div>
                    <div style={{ fontWeight: 600, fontFamily: 'monospace', color: valCol }}>{resource.response_time_minutes} min</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: dimCol, marginBottom: '2px' }}>Disruption</div>
                    <div style={{ fontWeight: 600, padding: '2px 6px', borderRadius: '3px', backgroundColor: disruptionStyle.bg, color: disruptionStyle.text, fontSize: '0.7rem' }}>{resource.disruption_weight}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: dimCol, marginBottom: '2px' }}>RBS Score</div>
                    {getRBSDisplay(resource.reliability_budget_score)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pool Stats */}
        <div style={{ borderTop: `1px solid ${divCol}`, paddingTop: '10px', fontSize: '0.7rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: dimCol }}>
            <span>Total Resources:</span><strong style={{ color: valCol }}>{resources.length}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: dimCol, marginTop: '4px' }}>
            <span>Avg Response Time:</span>
            <strong style={{ color: valCol }}>{resources.length > 0 ? (resources.reduce((s, r) => s + r.response_time_minutes, 0) / resources.length).toFixed(1) : 0} min</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
