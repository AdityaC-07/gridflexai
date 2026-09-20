import React, { useState } from 'react';
import { useBuildingContext } from '../context/BuildingContext';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Zap, AlertTriangle, CheckCircle, Building, Upload, MoreVertical,
  Activity, Wrench, FileText, ArrowRight, TrendingUp, MapPin,
  CheckCircle2, ChevronDown,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Per-feeder details — each zone has independent energy data, equipment, anomalies
const FEEDER_DETAILS = {
  'dharavi-north-f01': {
    gfa: '4,200 m² GFA', conditionedSpace: '1,050 m²', zone: 'TROPICAL WET',
    ecbcStatus: 'ECBC COMPLIANT', typology: 'Community Residential Feeder',
    microClimate: 'Tropical Wet · Mumbai 19.08°N 72.88°E',
    commissioningYear: '2018', occupancyBaseline: '340 households / ~1,200 pax',
    tariffPeakWindow: '22:00–06:00 IST (ToD Off-Peak)', efficiencyScore: 72,
    efficiencyLabel: 'GOOD', regionalQuartile: '72nd Percentile',
    todaysUsage: '162', peakExcursion: '-12.3%', peakStatus: 'Solar Offset',
    peakColor: '#059669',
    energyData: [
      { date: 'Sep 14', community_load: 142, solar_gen: 98,  bess: 18, ev: 22 },
      { date: 'Sep 15', community_load: 156, solar_gen: 112, bess: 22, ev: 28 },
      { date: 'Sep 16', community_load: 148, solar_gen: 105, bess: 15, ev: 24 },
      { date: 'Sep 17', community_load: 162, solar_gen: 118, bess: 20, ev: 32 },
      { date: 'Sep 18', community_load: 170, solar_gen: 110, bess: 28, ev: 30 },
      { date: 'Sep 19', community_load: 158, solar_gen: 122, bess: 16, ev: 26 },
      { date: 'Sep 20 (Today)', community_load: 162, solar_gen: 118, bess: 24, ev: 28 },
    ],
    subsystems: [
      { name: 'Community Battery BESS-F01', health: '80% SoC (160 kWh avail)', status: 'optimal' },
      { name: 'Rooftop Solar Array (150 kW peak)', health: 'Healthy (118 kW live)', status: 'optimal' },
      { name: 'Distribution Transformer 500 kVA', health: '27% Loading — Normal', status: 'optimal' },
      { name: 'EV Charging Hub (Sector B)', health: '3 active / 10 enrolled', status: 'caution' },
    ],
    equipment: [
      { id: 'EQ-F01-BAT', assetName: 'BESS-F01 Community Battery (200 kWh)', subsystem: 'Energy Storage', healthScore: 96, ageSpecs: '2 yrs (LFP 200 kWh / 80 kW BYD)', actionProtocol: 'View Feed', status: 'optimal' },
      { id: 'EQ-F01-SOL', assetName: 'Rooftop Solar PV Inverter (150 kW)', subsystem: 'Renewable Generation', healthScore: 99, ageSpecs: '3 yrs (SMA Sunny Tripower 150 kW)', actionProtocol: 'View Feed', status: 'optimal' },
      { id: 'EQ-F01-TRF', assetName: 'Distribution Transformer (500 kVA)', subsystem: 'Grid Infrastructure', healthScore: 88, ageSpecs: '6 yrs (Crompton 33/0.4 kV)', actionProtocol: 'Run Diagnostics', status: 'caution' },
      { id: 'EQ-F01-EV',  assetName: 'EV Charging Hub — Sector B (10-port)', subsystem: 'Flexible Demand', healthScore: 91, ageSpecs: '1 yr (Tata Power EZ Charge)', actionProtocol: 'Telemetry', status: 'optimal' },
    ],
    anomalies: [
      { id: 'AN-F01-01', title: 'Distribution Transformer Thermal Excursion', timestamp: 'Sep 20, 14:00 IST', observedLoad: '82.4 kW', deviation: '+26.8%', groqDiagnosis: '74% probability: elevated ambient temp (42°C) + EV charging surge in Sector B causing overtemperature. GridFlex battery dispatch reduced peak by 14 kW.', suggestedActions: ['Deploy shade canopy over Transformer Bay 1', 'Throttle EV charging to 50% during 14:00–18:00 IST', 'Monitor winding temp F01-TRF-T1'] },
    ],
  },
  'kurla-west-f02': {
    gfa: '3,800 m² GFA', conditionedSpace: '940 m²', zone: 'TROPICAL WET',
    ecbcStatus: 'ECBC COMPLIANT', typology: 'Mixed-Use Suburban Feeder',
    microClimate: 'Tropical Wet · Kurla West, Eastern Suburbs',
    commissioningYear: '2019', occupancyBaseline: '280 households / ~850 pax',
    tariffPeakWindow: '22:00–06:00 IST (ToD Off-Peak)', efficiencyScore: 81,
    efficiencyLabel: 'OPTIMAL', regionalQuartile: '81st Percentile',
    todaysUsage: '248', peakExcursion: '-18.4%', peakStatus: 'BESS Arbitrage',
    peakColor: '#059669',
    energyData: [
      { date: 'Sep 14', community_load: 210, solar_gen: 68,  bess: 42, ev: 18 },
      { date: 'Sep 15', community_load: 228, solar_gen: 74,  bess: 38, ev: 22 },
      { date: 'Sep 16', community_load: 220, solar_gen: 70,  bess: 35, ev: 20 },
      { date: 'Sep 17', community_load: 242, solar_gen: 80,  bess: 44, ev: 26 },
      { date: 'Sep 18', community_load: 256, solar_gen: 76,  bess: 50, ev: 24 },
      { date: 'Sep 19', community_load: 234, solar_gen: 82,  bess: 36, ev: 22 },
      { date: 'Sep 20 (Today)', community_load: 248, solar_gen: 78, bess: 46, ev: 24 },
    ],
    subsystems: [
      { name: 'BESS-F02 Mixed-Use Battery (120 kWh)', health: '85% SoC (102 kWh avail)', status: 'optimal' },
      { name: 'Commercial Rooftop Solar (90 kW)', health: 'Healthy (78 kW live)', status: 'optimal' },
      { name: 'Distribution Transformer 400 kVA', health: '42% Loading — Normal', status: 'optimal' },
      { name: 'Smart Meter Cluster (280 units)', health: '98% Reporting', status: 'optimal' },
    ],
    equipment: [
      { id: 'EQ-F02-BAT', assetName: 'BESS-F02 Community Battery (120 kWh)', subsystem: 'Energy Storage', healthScore: 94, ageSpecs: '2 yrs (LFP 120 kWh / 50 kW)', actionProtocol: 'View Feed', status: 'optimal' },
      { id: 'EQ-F02-SOL', assetName: 'Commercial Rooftop Solar (90 kW)', subsystem: 'Renewable Generation', healthScore: 97, ageSpecs: '2 yrs (Waaree 90 kW)', actionProtocol: 'View Feed', status: 'optimal' },
      { id: 'EQ-F02-TRF', assetName: 'Distribution Transformer (400 kVA)', subsystem: 'Grid Infrastructure', healthScore: 92, ageSpecs: '4 yrs (Siemens 33/0.4 kV)', actionProtocol: 'Telemetry', status: 'optimal' },
      { id: 'EQ-F02-MTR', assetName: 'Smart Meter Cluster (280 units)', subsystem: 'Metering & Billing', healthScore: 98, ageSpecs: '1 yr (Landis+Gyr E650)', actionProtocol: 'View Reports', status: 'optimal' },
    ],
    anomalies: [],
  },
  'bandra-east-f03': {
    gfa: '8,500 m² GFA', conditionedSpace: '2,800 m²', zone: 'TROPICAL WET',
    ecbcStatus: 'ECBC COMPLIANT', typology: 'Commercial BKC Feeder',
    microClimate: 'Tropical Wet · BKC Financial District, Bandra East',
    commissioningYear: '2016', occupancyBaseline: '4,200 daily occupants',
    tariffPeakWindow: '14:00–18:00 IST (HT ToD Peak)', efficiencyScore: 68,
    efficiencyLabel: 'CAUTION', regionalQuartile: '68th Percentile',
    todaysUsage: '410', peakExcursion: '+14.6%', peakStatus: 'Chiller Load',
    peakColor: '#DC2626',
    energyData: [
      { date: 'Sep 14', community_load: 360, solar_gen: 42, bess: 0,  ev: 8 },
      { date: 'Sep 15', community_load: 380, solar_gen: 45, bess: 0,  ev: 10 },
      { date: 'Sep 16', community_load: 370, solar_gen: 40, bess: 12, ev: 9 },
      { date: 'Sep 17', community_load: 395, solar_gen: 44, bess: 18, ev: 12 },
      { date: 'Sep 18', community_load: 420, solar_gen: 38, bess: 24, ev: 14 },
      { date: 'Sep 19', community_load: 385, solar_gen: 46, bess: 10, ev: 11 },
      { date: 'Sep 20 (Today)', community_load: 410, solar_gen: 42, bess: 20, ev: 12 },
    ],
    subsystems: [
      { name: 'Chiller Plant A (Basement)', health: '72% Health — Caution', status: 'caution' },
      { name: 'Chiller Plant B (Basement)', health: '88% Health', status: 'optimal' },
      { name: 'AHU Array (18 units)', health: 'Healthy (95%)', status: 'optimal' },
      { name: 'Distribution Transformer 1 MVA', health: '78% Loading — High', status: 'caution' },
    ],
    equipment: [
      { id: 'EQ-F03-CH1', assetName: 'Chiller Plant A (500T Centrifugal)', subsystem: 'HVAC Central Plant', healthScore: 72, ageSpecs: '9 yrs (Trane RTAF 500T)', actionProtocol: 'Run Diagnostics', status: 'caution' },
      { id: 'EQ-F03-CH2', assetName: 'Chiller Plant B (400T Centrifugal)', subsystem: 'HVAC Central Plant', healthScore: 88, ageSpecs: '5 yrs (Carrier 30HXC 400T)', actionProtocol: 'Telemetry', status: 'optimal' },
      { id: 'EQ-F03-TRF', assetName: 'Distribution Transformer (1 MVA)', subsystem: 'Grid Infrastructure', healthScore: 82, ageSpecs: '8 yrs (ABB 33/0.415 kV)', actionProtocol: 'Schedule Service', status: 'caution' },
      { id: 'EQ-F03-AHU', assetName: 'AHU Array — Tower Floors 1–18', subsystem: 'HVAC Air Distribution', healthScore: 95, ageSpecs: '4 yrs (Daikin VAV 18-unit)', actionProtocol: 'Telemetry', status: 'optimal' },
    ],
    anomalies: [
      { id: 'AN-F03-01', title: 'Chiller A Delta-T Anomaly — Low COP Detected', timestamp: 'Sep 20, 13:30 IST', observedLoad: '340 kW', deviation: '+28.3%', groqDiagnosis: '81% probability: fouled condenser tubes reducing heat exchange efficiency. COP dropped from 5.2 to 3.8. Estimated +22% chiller energy overconsumption.', suggestedActions: ['Schedule condenser tube brushing within 48h', 'Activate Chiller B as primary during service', 'Raise chilled water setpoint +1.5°C'] },
    ],
  },
  'sion-south-f04': {
    gfa: '6,200 m² GFA', conditionedSpace: '1,600 m²', zone: 'TROPICAL WET',
    ecbcStatus: 'ECBC COMPLIANT', typology: 'Industrial Suburban Feeder',
    microClimate: 'Tropical Wet · Sion, Central Line Corridor',
    commissioningYear: '2014', occupancyBaseline: '180 industrial units',
    tariffPeakWindow: '06:00–10:00 IST (Industrial Peak)', efficiencyScore: 70,
    efficiencyLabel: 'GOOD', regionalQuartile: '70th Percentile',
    todaysUsage: '312', peakExcursion: '+2.1%', peakStatus: 'Target Buffer',
    peakColor: '#D97706',
    energyData: [
      { date: 'Sep 14', community_load: 288, solar_gen: 22, bess: 0,  ev: 4 },
      { date: 'Sep 15', community_load: 295, solar_gen: 24, bess: 8,  ev: 4 },
      { date: 'Sep 16', community_load: 280, solar_gen: 20, bess: 0,  ev: 3 },
      { date: 'Sep 17', community_load: 305, solar_gen: 25, bess: 10, ev: 5 },
      { date: 'Sep 18', community_load: 318, solar_gen: 22, bess: 14, ev: 5 },
      { date: 'Sep 19', community_load: 298, solar_gen: 26, bess: 6,  ev: 4 },
      { date: 'Sep 20 (Today)', community_load: 312, solar_gen: 23, bess: 8, ev: 4 },
    ],
    subsystems: [
      { name: 'Industrial Load Bank #1', health: '78% Health — Monitoring', status: 'caution' },
      { name: 'Distribution Transformer 630 kVA', health: '62% Loading — Moderate', status: 'caution' },
      { name: 'Capacitor Bank (Power Factor)', health: 'Healthy (0.94 PF)', status: 'optimal' },
      { name: 'Smart Meters (180 units)', health: '94% Reporting', status: 'optimal' },
    ],
    equipment: [
      { id: 'EQ-F04-ILB', assetName: 'Industrial Load Bank #1', subsystem: 'Industrial Process', healthScore: 78, ageSpecs: '11 yrs (Siemens 200 kVA)', actionProtocol: 'Run Diagnostics', status: 'caution' },
      { id: 'EQ-F04-TRF', assetName: 'Distribution Transformer (630 kVA)', subsystem: 'Grid Infrastructure', healthScore: 85, ageSpecs: '10 yrs (Voltamp 33/0.4 kV)', actionProtocol: 'Schedule Service', status: 'caution' },
      { id: 'EQ-F04-CAP', assetName: 'Capacitor Bank (PF Correction)', subsystem: 'Power Quality', healthScore: 92, ageSpecs: '3 yrs (L&T 200 kVAr bank)', actionProtocol: 'Telemetry', status: 'optimal' },
      { id: 'EQ-F04-MTR', assetName: 'Smart Meter Cluster (180 units)', subsystem: 'Metering & Billing', healthScore: 94, ageSpecs: '2 yrs (Secure Meters)', actionProtocol: 'View Reports', status: 'optimal' },
    ],
    anomalies: [],
  },
  'andheri-east-f05': {
    gfa: '5,400 m² GFA', conditionedSpace: '1,400 m²', zone: 'TROPICAL WET',
    ecbcStatus: 'ECBC COMPLIANT', typology: 'Tech Campus Hub Feeder',
    microClimate: 'Tropical Wet · MIDC, Andheri East',
    commissioningYear: '2020', occupancyBaseline: '1,800 daily tech workers',
    tariffPeakWindow: '14:00–18:00 IST (HT ToD Peak)', efficiencyScore: 75,
    efficiencyLabel: 'GOOD', regionalQuartile: '75th Percentile',
    todaysUsage: '185', peakExcursion: '+3.8%', peakStatus: 'Stable Load',
    peakColor: '#D97706',
    energyData: [
      { date: 'Sep 14', community_load: 162, solar_gen: 55, bess: 15, ev: 30 },
      { date: 'Sep 15', community_load: 172, solar_gen: 60, bess: 18, ev: 34 },
      { date: 'Sep 16', community_load: 168, solar_gen: 57, bess: 14, ev: 32 },
      { date: 'Sep 17', community_load: 178, solar_gen: 62, bess: 16, ev: 36 },
      { date: 'Sep 18', community_load: 188, solar_gen: 58, bess: 20, ev: 38 },
      { date: 'Sep 19', community_load: 175, solar_gen: 64, bess: 12, ev: 34 },
      { date: 'Sep 20 (Today)', community_load: 185, solar_gen: 60, bess: 16, ev: 36 },
    ],
    subsystems: [
      { name: 'Tech Campus Solar Array (80 kW)', health: 'Healthy (60 kW live)', status: 'optimal' },
      { name: 'EV Fleet Hub (36 ports)', health: '28 active / 36 enrolled', status: 'optimal' },
      { name: 'Distribution Transformer 500 kVA', health: '37% Loading — Normal', status: 'optimal' },
      { name: 'Data Centre UPS (200 kVA)', health: '96% Health', status: 'optimal' },
    ],
    equipment: [
      { id: 'EQ-F05-SOL', assetName: 'Campus Solar Array (80 kW)', subsystem: 'Renewable Generation', healthScore: 98, ageSpecs: '3 yrs (Adani 80 kW panels)', actionProtocol: 'View Feed', status: 'optimal' },
      { id: 'EQ-F05-EV',  assetName: 'EV Fleet Charging Hub (36 ports)', subsystem: 'EV Infrastructure', healthScore: 96, ageSpecs: '2 yrs (Tata Power 36-port AC)', actionProtocol: 'Telemetry', status: 'optimal' },
      { id: 'EQ-F05-TRF', assetName: 'Distribution Transformer (500 kVA)', subsystem: 'Grid Infrastructure', healthScore: 91, ageSpecs: '4 yrs (Siemens)', actionProtocol: 'Telemetry', status: 'optimal' },
      { id: 'EQ-F05-UPS', assetName: 'Data Centre UPS (200 kVA)', subsystem: 'Critical Power', healthScore: 96, ageSpecs: '2 yrs (Eaton 9PX 200)', actionProtocol: 'View Feed', status: 'optimal' },
    ],
    anomalies: [],
  },
  'worli-north-f06': {
    gfa: '4,800 m² GFA', conditionedSpace: '1,200 m²', zone: 'TROPICAL WET',
    ecbcStatus: 'ECBC COMPLIANT', typology: 'Transit + Commercial Feeder',
    microClimate: 'Tropical Wet · Worli Sea Face, South Mumbai',
    commissioningYear: '2017', occupancyBaseline: '2,400 daily commuters + retail',
    tariffPeakWindow: '08:00–10:00 IST & 18:00–21:00 IST', efficiencyScore: 84,
    efficiencyLabel: 'EXCELLENT', regionalQuartile: '84th Percentile',
    todaysUsage: '138', peakExcursion: '-16.2%', peakStatus: 'Automated Curb',
    peakColor: '#059669',
    energyData: [
      { date: 'Sep 14', community_load: 125, solar_gen: 35, bess: 18, ev: 15 },
      { date: 'Sep 15', community_load: 132, solar_gen: 38, bess: 20, ev: 16 },
      { date: 'Sep 16', community_load: 128, solar_gen: 36, bess: 16, ev: 14 },
      { date: 'Sep 17', community_load: 135, solar_gen: 40, bess: 22, ev: 18 },
      { date: 'Sep 18', community_load: 142, solar_gen: 37, bess: 24, ev: 17 },
      { date: 'Sep 19', community_load: 130, solar_gen: 42, bess: 14, ev: 16 },
      { date: 'Sep 20 (Today)', community_load: 138, solar_gen: 39, bess: 20, ev: 16 },
    ],
    subsystems: [
      { name: 'Sea-Link View Solar Array (50 kW)', health: 'Healthy (39 kW live)', status: 'optimal' },
      { name: 'BMS Automated Controls', health: 'Active — 94% Efficiency', status: 'optimal' },
      { name: 'Distribution Transformer 315 kVA', health: '28% Loading — Normal', status: 'optimal' },
      { name: 'Retail HVAC Grid (12 units)', health: 'Healthy (92%)', status: 'optimal' },
    ],
    equipment: [
      { id: 'EQ-F06-SOL', assetName: 'Sea-Link View Solar Array (50 kW)', subsystem: 'Renewable Generation', healthScore: 99, ageSpecs: '2 yrs (Waaree 50 kW)', actionProtocol: 'View Feed', status: 'optimal' },
      { id: 'EQ-F06-BMS', assetName: 'BMS Automated Controls', subsystem: 'Building Automation', healthScore: 94, ageSpecs: '3 yrs (Honeywell EBI v5)', actionProtocol: 'Telemetry', status: 'optimal' },
      { id: 'EQ-F06-TRF', assetName: 'Distribution Transformer (315 kVA)', subsystem: 'Grid Infrastructure', healthScore: 93, ageSpecs: '7 yrs (Crompton 33/0.4 kV)', actionProtocol: 'Telemetry', status: 'optimal' },
      { id: 'EQ-F06-HVAC', assetName: 'Retail HVAC Grid (12 units)', subsystem: 'HVAC Distribution', healthScore: 92, ageSpecs: '4 yrs (Daikin VRV IV)', actionProtocol: 'View Feed', status: 'optimal' },
    ],
    anomalies: [],
  },
};

export function BuildingDetailsPage() {
  const navigate = useNavigate();
  const params = useParams();
  const { buildings, triggerAIAnalysis, setSelectedAnomaly, setIsAnalysisComplete, theme } = useBuildingContext();
  const isLight = theme === 'light';

  // Determine initial selected feeder from URL param or default to F01
  const initialId = params.id && FEEDER_DETAILS[params.id] ? params.id : 'dharavi-north-f01';
  const [selectedFeederId, setSelectedFeederId] = useState(initialId);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [chartTimeframe, setChartTimeframe] = useState('7 days');

  const details = FEEDER_DETAILS[selectedFeederId];
  const buildingMeta = buildings.find((b) => b.id === selectedFeederId) || buildings[0];

  // Timeframe slicing — 7d shows 7 rows, 30d shows all (we duplicate for demo), 90d shows monthly averages
  const getChartData = () => {
    const base = details.energyData;
    if (chartTimeframe === '7 days') return base;
    if (chartTimeframe === '30 days') {
      // Simulate 30d by repeating with slight variation
      return Array.from({ length: 30 }, (_, i) => {
        const src = base[i % base.length];
        const jitter = () => Math.round((Math.random() - 0.5) * 20);
        const d = new Date(); d.setDate(d.getDate() - (29 - i));
        return { ...src, date: `${d.toLocaleString('en',{month:'short'})} ${d.getDate()}`,
          community_load: Math.max(0, src.community_load + jitter()),
          solar_gen: Math.max(0, src.solar_gen + jitter()),
          bess: Math.max(0, src.bess + jitter()) };
      });
    }
    // 90 days — 12 weekly aggregates
    return Array.from({ length: 12 }, (_, i) => {
      const src = base[i % base.length];
      return { date: `W${i + 1}`, community_load: src.community_load * 7, solar_gen: src.solar_gen * 7, bess: src.bess * 7 };
    });
  };
  const chartData = getChartData();

  // Theme tokens
  const bg      = isLight ? '#FFFFFF' : '#161616';
  const bgDeep  = isLight ? '#FAFCF7' : '#121212';
  const bgPage  = isLight ? '#F4F7EF' : '#0F0F0F';
  const border  = isLight ? '#E2E8DC' : '#242424';
  const borderM = isLight ? '#E2E8DC' : '#1E1E1E';
  const textPri = isLight ? '#0F172A' : '#F5F1E8';
  const textSec = isLight ? '#3A4A3E' : '#CBD5E1';
  const textDim = isLight ? '#5C6B61' : '#64748B';
  const bgDrop  = isLight ? '#EAEFE3' : '#0A0A0A';

  return (
    <div style={{ color: textPri }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: textDim }}>
          <span>Dashboard</span><span>/</span><span>Buildings</span><span>/</span>
          <span style={{ color: textPri, fontWeight: 600 }}>{buildingMeta?.name || details?.typology}</span>
        </div>
      </div>

      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          {/* Feeder Selector Dropdown */}
          <div style={{ position: 'relative', marginBottom: '10px' }}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}
            >
              <h1 style={{
                fontFamily: 'Syne', fontSize: '2.4rem', fontWeight: 800,
                color: textPri, letterSpacing: '-0.02em', lineHeight: 1.1,
              }}>
                {buildingMeta?.name || 'Dharavi North'}
              </h1>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: '6px 12px', borderRadius: '4px',
                backgroundColor: isLight ? '#EAEFE3' : '#1A1A1A',
                border: `1px solid ${border}`,
                marginTop: '4px',
              }}>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.68rem', color: textDim }}>
                  Switch Feeder
                </span>
                <ChevronDown size={14} color={textDim} style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: '150ms' }} />
              </div>
            </button>

            {dropdownOpen && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, zIndex: 200,
                backgroundColor: isLight ? '#FFFFFF' : '#1A1A1A',
                border: `1px solid ${border}`,
                borderRadius: '6px',
                boxShadow: isLight ? '0 8px 24px rgba(0,0,0,0.12)' : '0 8px 24px rgba(0,0,0,0.6)',
                minWidth: '340px', overflow: 'hidden',
                marginTop: '4px',
              }}>
                {buildings.map((b) => {
                  const isActive = b.id === selectedFeederId;
                  return (
                    <button
                      key={b.id}
                      onClick={() => { setSelectedFeederId(b.id); setDropdownOpen(false); }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center',
                        gap: '12px', padding: '12px 16px',
                        backgroundColor: isActive ? (isLight ? '#EAEFE3' : '#242424') : 'transparent',
                        border: 'none', borderBottom: `1px solid ${isLight ? '#F0F4EC' : '#242424'}`,
                        cursor: 'pointer', textAlign: 'left',
                        transition: 'background 150ms',
                      }}
                    >
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0,
                        backgroundImage: `url(${b.image})`,
                        backgroundSize: 'cover', backgroundPosition: 'center',
                      }} />
                      <div>
                        <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.9rem', color: isActive ? (isLight ? '#0D472B' : '#D4841A') : textPri }}>
                          {b.name}
                        </div>
                        <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.62rem', color: textDim }}>
                          {b.code} · {b.location}
                        </div>
                      </div>
                      {isActive && (
                        <span style={{ marginLeft: 'auto', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22C55E', boxShadow: '0 0 6px #22C55E' }} />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.82rem', color: textDim, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={13} color="#D4841A" /> {details.microClimate}
            </span>
            <span>•</span><span>{details.gfa}</span>
            <span>•</span><span>{details.typology}</span>
            <span>•</span><span style={{ color: '#059669' }}>{details.ecbcStatus}</span>
            <span>•</span>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: '#E89B3C', backgroundColor: isLight ? '#FDF4E3' : '#1E1B18', padding: '2px 6px', borderRadius: '3px' }}>
              ZONE: {details.zone}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={triggerAIAnalysis} className="btn-primary" style={{ padding: '10px 20px' }}>
            <TrendingUp size={16} /><span>Run AI Analysis</span>
          </button>
          <button
            onClick={() => { const a = document.createElement('a'); a.href = `#feeder-${selectedFeederId}`; alert(`Telemetry ingest for ${details.typology} would open an upload dialog. Connect to POST /api/v1/telemetry/${selectedFeederId}/ingest in production.`); }}
            title="Upload telemetry data for this feeder"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: bg, border: `1px solid ${border}`, borderRadius: '4px', color: textPri, fontFamily: 'Space Grotesk', fontSize: '0.85rem', cursor: 'pointer' }}>
            <Upload size={15} /><span>Upload Data</span>
          </button>
          <button
            onClick={() => navigate('/operator')}
            title="Open Grid Operator Console for this feeder"
            style={{ width: '36px', height: '36px', borderRadius: '4px', backgroundColor: bg, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: textDim, cursor: 'pointer' }}>
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'BUILDING AREA', sub: 'Conditioned Space', value: details.conditionedSpace, unit: '', icon: <Building size={18} color="#D4841A" />, color: textPri },
          { label: "TODAY'S USAGE", sub: 'Live Demand', value: details.todaysUsage, unit: 'kW', icon: <Zap size={18} color="#E89B3C" />, color: '#E89B3C' },
          { label: 'VS BASELINE', sub: 'Peak Status', value: details.peakExcursion, unit: '', icon: <AlertTriangle size={18} color={details.peakColor} />, color: details.peakColor, sub2: details.peakStatus },
          { label: 'EFFICIENCY BENCHMARK', sub: 'Zone Rating', value: details.efficiencyLabel, unit: '', icon: <CheckCircle size={18} color="#6BA587" />, color: '#059669', badge: true },
        ].map(({ label, sub, value, unit, icon, color, sub2, badge }) => (
          <div key={label} style={{ backgroundColor: bg, border: `1px solid ${border}`, borderRadius: '6px', padding: '18px 20px', boxShadow: isLight ? '0 2px 10px rgba(0,0,0,0.03)' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: textDim, letterSpacing: '0.08em' }}>{label}</div>
                <div style={{ fontFamily: 'Space Grotesk', fontSize: '0.95rem', fontWeight: 600, color: textPri }}>{sub}</div>
              </div>
              {icon}
            </div>
            {badge ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.82rem', fontWeight: 700, color: isLight ? '#FFFFFF' : '#0F0F0F', backgroundColor: isLight ? '#0D472B' : '#6BA587', padding: '4px 10px', borderRadius: '4px' }}>{value}</span>
                <span style={{ fontFamily: 'DM Sans', fontSize: '0.78rem', color: textDim }}>{details.regionalQuartile}</span>
              </div>
            ) : (
              <>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '2.2rem', fontWeight: 700, color, lineHeight: 1 }}>
                  {value} {unit && <span style={{ fontSize: '1rem', fontWeight: 500, color: textDim }}>{unit}</span>}
                </div>
                {sub2 && <div style={{ fontFamily: 'DM Sans', fontSize: '0.75rem', color, marginTop: '6px', fontWeight: 600 }}>{sub2}</div>}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Main Grid: 7fr / 3fr */}
      <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: '28px' }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

          {/* Energy Consumption Chart */}
          <div style={{ backgroundColor: bg, border: `1px solid ${border}`, borderRadius: '8px', padding: '24px', boxShadow: isLight ? '0 2px 10px rgba(0,0,0,0.03)' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#E89B3C' }} />
                <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.2rem', fontWeight: 700, color: textPri }}>Energy Consumption</h3>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.68rem', color: textDim }}>7-DAY INTERVALS</span>
              </div>
              <div style={{ display: 'flex', gap: '4px', backgroundColor: bgDrop, padding: '3px', borderRadius: '4px' }}>
                {['7 days', '30 days', '90 days'].map((tf) => (
                  <button key={tf} onClick={() => setChartTimeframe(tf)} style={{ padding: '4px 10px', borderRadius: '3px', fontFamily: 'Space Grotesk', fontSize: '0.75rem', fontWeight: chartTimeframe === tf ? 600 : 400, color: chartTimeframe === tf ? (isLight ? '#FFFFFF' : '#F5F1E8') : textDim, backgroundColor: chartTimeframe === tf ? (isLight ? '#0D472B' : '#242424') : 'transparent', border: 'none', cursor: 'pointer' }}>
                    {tf}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ width: '100%', height: '240px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="date" stroke={isLight ? '#CBD5E1' : '#3A3A3A'} tick={{ fill: textDim, fontSize: 11 }} />
                  <YAxis stroke={isLight ? '#CBD5E1' : '#3A3A3A'} tick={{ fill: textDim, fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: isLight ? '#FFFFFF' : '#0F0F0F', borderColor: '#D4841A', borderRadius: '4px', color: textPri }} labelStyle={{ color: textPri, fontWeight: 'bold' }} />
                  <Line type="monotone" dataKey="community_load" stroke="#0284C7" strokeWidth={2.5} dot={{ r: 3 }} name="Community Load" />
                  <Line type="monotone" dataKey="solar_gen" stroke="#E89B3C" strokeWidth={2} dot={{ r: 3 }} name="Solar Generation" />
                  <Line type="monotone" dataKey="bess" stroke="#9333EA" strokeWidth={2} dot={{ r: 3 }} name="BESS Dispatch" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${borderM}` }}>
              {[['#0284C7','Community Load (kWh)'],['#E89B3C','Solar Generation (kWh)'],['#9333EA','BESS Dispatch (kWh)']].map(([c,l]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: c }} />
                  <span style={{ fontFamily: 'DM Sans', fontSize: '0.82rem', color: textSec }}>{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Anomalies */}
          <div style={{ backgroundColor: bg, border: `1px solid ${details.anomalies.length ? '#FF6B5B' : border}`, borderRadius: '8px', padding: '24px', boxShadow: details.anomalies.length ? (isLight ? '0 4px 16px rgba(255,107,91,0.08)' : '0 4px 20px rgba(255,107,91,0.12)') : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertTriangle size={20} color={details.anomalies.length ? '#FF6B5B' : '#64748B'} />
                <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.2rem', fontWeight: 700, color: textPri }}>Recent Anomalies</h3>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', backgroundColor: details.anomalies.length ? 'rgba(255,107,91,0.15)' : (isLight ? '#EAEFE3' : '#1A1A1A'), color: details.anomalies.length ? '#FF6B5B' : textDim }}>
                  {details.anomalies.length} Active
                </span>
              </div>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.68rem', color: textDim }}>Real-time Sentry Log</span>
            </div>
            {details.anomalies.length === 0 ? (
              <div style={{ padding: '20px', backgroundColor: bgDeep, borderRadius: '6px', border: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CheckCircle size={20} color="#059669" />
                <span style={{ fontFamily: 'DM Sans', fontSize: '0.88rem', color: '#059669', fontWeight: 600 }}>No active anomalies — {buildingMeta?.name} operating normally.</span>
              </div>
            ) : (
              details.anomalies.map((anom) => (
                <div key={anom.id} style={{ backgroundColor: bgDeep, border: `1px solid ${border}`, borderRadius: '6px', padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h4 style={{ fontFamily: 'Space Grotesk', fontSize: '1rem', fontWeight: 700, color: textPri }}>{anom.title}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ padding: '2px 8px', backgroundColor: '#FF6B5B', color: '#FFFFFF', fontFamily: 'JetBrains Mono', fontSize: '0.62rem', fontWeight: 800, borderRadius: '3px' }}>HIGH SEVERITY</span>
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.72rem', color: textDim }}>{anom.timestamp}</span>
                    </div>
                  </div>
                  <p style={{ fontFamily: 'DM Sans', fontSize: '0.85rem', color: textSec, marginBottom: '14px' }}>
                    Observed telemetry: <strong style={{ color: '#D4841A' }}>{anom.observedLoad}</strong> — <strong style={{ color: '#FF6B5B' }}>{anom.deviation} deviation</strong>
                  </p>
                  <div style={{ backgroundColor: isLight ? '#FDF8F0' : 'rgba(212,132,26,0.08)', borderLeft: '3px solid #D4841A', padding: '12px 14px', borderRadius: '4px', marginBottom: '16px' }}>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', fontWeight: 700, color: '#D4841A', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Zap size={13} color="#D4841A" /> GROQ AI AUTOMATED DIAGNOSTICS
                    </div>
                    <p style={{ fontFamily: 'DM Sans', fontSize: '0.82rem', color: textSec }}>{anom.groqDiagnosis}</p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button onClick={() => setSelectedAnomaly(anom)} style={{ background: 'none', border: 'none', color: isLight ? '#0D472B' : '#E89B3C', fontFamily: 'Space Grotesk', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>Inspect Raw Phase Telemetry</span><ArrowRight size={14} />
                    </button>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => { /* Remove from view — in production would call POST /api/v1/anomalies/{id}/dismiss */ }}
                        title="Acknowledge and dismiss this anomaly"
                        style={{ padding: '6px 12px', backgroundColor: bg, border: `1px solid ${border}`, borderRadius: '4px', color: textDim, fontFamily: 'Space Grotesk', fontSize: '0.78rem', cursor: 'pointer' }}>
                        Acknowledge
                      </button>
                      <button onClick={() => setSelectedAnomaly(anom)} className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.78rem', backgroundColor: isLight ? '#0D472B' : '#D4841A', color: '#FFFFFF' }}>
                        Dispatch Field Tech
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Equipment Inventory */}
          <div style={{ backgroundColor: bg, border: `1px solid ${border}`, borderRadius: '8px', padding: '24px', boxShadow: isLight ? '0 2px 10px rgba(0,0,0,0.03)' : 'none' }}>
            <div style={{ marginBottom: '18px' }}>
              <span style={{ fontFamily: 'Space Grotesk', fontSize: '0.95rem', fontWeight: 700, color: textPri, borderBottom: `2px solid ${isLight ? '#0D472B' : '#D4841A'}`, paddingBottom: '6px' }}>
                EQUIPMENT INVENTORY
              </span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${border}`, fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: textDim, textTransform: 'uppercase' }}>
                  {['ASSET IDENTIFIER', 'SUBSYSTEM GROUP', 'HEALTH STATUS', 'AGE / TECH SPECS', 'ACTION'].map((h) => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: h === 'ACTION' ? 'right' : 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {details.equipment.map((eq) => (
                  <tr key={eq.id} style={{ borderBottom: `1px solid ${isLight ? '#F0F4EC' : '#1E1E1E'}`, fontSize: '0.85rem' }}>
                    <td style={{ padding: '14px 12px', fontFamily: 'Space Grotesk', fontWeight: 600, color: textPri }}>{eq.assetName}</td>
                    <td style={{ padding: '14px 12px', color: textDim }}>{eq.subsystem}</td>
                    <td style={{ padding: '14px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '60px', height: '6px', backgroundColor: isLight ? '#EAEFE3' : '#242424', borderRadius: '3px' }}>
                          <div style={{ width: `${eq.healthScore}%`, height: '100%', backgroundColor: eq.healthScore > 90 ? '#059669' : eq.healthScore > 80 ? '#D4841A' : '#DC2626', borderRadius: '3px' }} />
                        </div>
                        <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: textSec }}>{eq.healthScore}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 12px', color: textDim, fontFamily: 'DM Sans', fontSize: '0.8rem' }}>{eq.ageSpecs}</td>
                    <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                      <button
                        onClick={() => {
                          if (eq.actionProtocol === 'View Feed') navigate('/operator');
                          else if (eq.actionProtocol === 'Telemetry') navigate('/operator');
                          else if (eq.actionProtocol === 'Run Diagnostics') triggerAIAnalysis();
                          else if (eq.actionProtocol === 'Schedule Service') navigate('/retrofits');
                          else if (eq.actionProtocol === 'View Reports') navigate('/reliability');
                          else navigate('/operator');
                        }}
                        title={`${eq.actionProtocol} for ${eq.assetName}`}
                        style={{ padding: '4px 10px', backgroundColor: isLight ? '#FDF4E3' : '#1E1E1E', border: `1px solid ${isLight ? '#FCD34D' : '#333333'}`, borderRadius: '4px', color: isLight ? '#B45309' : '#E89B3C', fontFamily: 'Space Grotesk', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                        {eq.actionProtocol}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Building Profile */}
          <div style={{ backgroundColor: bg, border: `1px solid ${border}`, borderRadius: '8px', padding: '20px', boxShadow: isLight ? '0 2px 10px rgba(0,0,0,0.03)' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.05rem', fontWeight: 700, color: textPri }}>Feeder Profile</h3>
              <Building size={16} color={textDim} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.82rem' }}>
              {[
                ['Typology', details.typology],
                ['Micro-Climate', details.microClimate.split('·')[0].trim()],
                ['DISCOM', 'MSEDCL'],
                ['Commissioning', details.commissioningYear],
                ['Occupancy', details.occupancyBaseline],
                ['Tariff Peak', details.tariffPeakWindow],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{ color: textDim, flexShrink: 0 }}>{k}</span>
                  <span style={{ color: textPri, fontWeight: 500, textAlign: 'right', fontSize: '0.78rem' }}>{v}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: textDim }}>ECBC Status</span>
                <span style={{ color: '#059669', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>Compliant <CheckCircle2 size={13} color="#059669" /></span>
              </div>
            </div>

            {/* Subsystem Health */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: `1px solid ${isLight ? '#E2E8DC' : '#222222'}` }}>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: textDim, letterSpacing: '0.08em', marginBottom: '10px' }}>SUBSYSTEM HEALTH MATRIX</div>
              {details.subsystems.map((sub, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '6px' }}>
                  <span style={{ color: textSec }}>{sub.name}</span>
                  <span style={{ color: sub.status === 'optimal' ? '#059669' : '#D4841A', fontWeight: 600, fontSize: '0.74rem' }}>{sub.health}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Efficiency Ring */}
          <div style={{ backgroundColor: bg, border: `1px solid ${border}`, borderRadius: '8px', padding: '24px', textAlign: 'center', boxShadow: isLight ? '0 2px 10px rgba(0,0,0,0.03)' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.05rem', fontWeight: 700, color: textPri }}>Efficiency Rating</h3>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: textDim }}>BEE EQUIVALENT</span>
            </div>
            <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 16px auto' }}>
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke={isLight ? '#EAEFE3' : '#242424'} strokeWidth="10" />
                <circle cx="60" cy="60" r="50" fill="none" stroke={isLight ? '#0D472B' : '#34D399'} strokeWidth="10"
                  strokeDasharray="314"
                  strokeDashoffset={Math.round(314 * (1 - details.efficiencyScore / 100))}
                  strokeLinecap="round" transform="rotate(-90 60 60)" />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'Space Grotesk', fontSize: '0.9rem', fontWeight: 700, color: isLight ? '#0D472B' : '#34D399' }}>{details.efficiencyLabel}</span>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.9rem', fontWeight: 700, color: textPri }}>{details.efficiencyScore}%</span>
              </div>
            </div>
            <p style={{ fontFamily: 'DM Sans', fontSize: '0.8rem', color: textDim, marginBottom: '16px' }}>
              Exceeds <strong>{details.efficiencyScore}%</strong> of peer feeders — Mumbai MSEDCL zone.
            </p>
            <div style={{ backgroundColor: bgDeep, padding: '12px', borderRadius: '4px', textAlign: 'left', fontSize: '0.78rem', border: `1px solid ${border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: textDim }}>Regional Quartile</span>
                <span style={{ color: textPri, fontWeight: 600 }}>{details.regionalQuartile}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: textDim }}>Target</span>
                <span style={{ color: isLight ? '#B45309' : '#E89B3C', fontWeight: 600 }}>Top 20% (A-Class)</span>
              </div>
            </div>
          </div>

          {/* Facility Actions */}
          <div style={{ backgroundColor: bg, border: `1px solid ${border}`, borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: isLight ? '0 2px 10px rgba(0,0,0,0.03)' : 'none' }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: textDim, letterSpacing: '0.08em' }}>FACILITY ACTIONS</div>
            <button onClick={() => setIsAnalysisComplete(true)} className="btn-primary" style={{ width: '100%', padding: '11px', fontSize: '0.88rem', backgroundColor: isLight ? '#0D472B' : '#D4841A', color: '#FFFFFF' }}>
              <Activity size={16} /><span>View Full Analysis</span>
            </button>
            <button onClick={() => navigate('/retrofits')} style={{ width: '100%', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.85rem', backgroundColor: isLight ? '#EAEFE3' : '#242424', border: `1px solid ${isLight ? '#DAE2D2' : '#3A3A3A'}`, borderRadius: '4px', color: isLight ? '#0D472B' : '#F5F1E8', fontFamily: 'Space Grotesk', cursor: 'pointer' }}>
              <Wrench size={15} color={isLight ? '#0D472B' : '#D4841A'} /><span>See Retrofit Plan</span>
            </button>
            <button
              onClick={() => {
                // Export the current feeder's energy data as CSV
                const rows = [['Date','Community Load (kWh)','Solar Gen (kWh)','BESS Dispatch (kWh)'],...chartData.map(r=>[r.date,r.community_load,r.solar_gen,r.bess])];
                const csv = rows.map(r=>r.join(',')).join('\n');
                const blob = new Blob([csv],{type:'text/csv'});
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `gridflex_telemetry_${selectedFeederId}_${chartTimeframe.replace(' ','_')}.csv`;
                a.click();
              }}
              title="Download telemetry report as CSV"
              style={{ width: '100%', padding: '9px', backgroundColor: 'transparent', border: `1px solid ${isLight ? '#DAE2D2' : '#262626'}`, borderRadius: '4px', color: textDim, fontFamily: 'Space Grotesk', fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <FileText size={14} /><span>Download Report (CSV)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
