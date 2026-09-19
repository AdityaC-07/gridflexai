import React, { createContext, useContext, useState } from 'react';

const BuildingContext = createContext();

export function BuildingProvider({ children }) {
  const [theme, setTheme] = useState('dark');
  const [activeCityFilter, setActiveCityFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };
  
  // Modals state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalysisComplete, setIsAnalysisComplete] = useState(false);
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [isAutoDREnabled, setIsAutoDREnabled] = useState(true);

  // Buildings dataset matching Screenshot 1
  const buildings = [
    {
      id: 'delhi-tech-park',
      name: 'Delhi Tech Park',
      code: 'DL-04',
      category: 'COMMERCIAL GRADE A',
      status: 'TELEMETRY LIVE',
      statusType: 'live',
      city: 'Delhi NCR',
      location: 'Aerocity Sector',
      todaysUsage: '850',
      usageSubtext: 'Steady draw',
      vsBaseline: '+4.2%',
      vsBaselineLabel: 'Target buffer',
      efficiency: 'GOOD',
      efficiencySubtext: 'Within 10%',
      gridThreshold: 68,
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'one-cyber-city',
      name: 'One Cyber City',
      code: 'GGN-01',
      category: 'CORPORATE HQ',
      status: 'ONLINE (8ms)',
      statusType: 'optimal',
      city: 'Delhi NCR',
      location: 'DLF Cyber Hub',
      todaysUsage: '1,420',
      usageSubtext: 'Peak shaved',
      vsBaseline: '-18.4%',
      vsBaselineLabel: 'Solar offset',
      efficiency: 'OPTIMAL',
      efficiencySubtext: '>15% Below',
      gridThreshold: 42,
      image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'horizon-heights',
      name: 'Horizon Heights',
      code: 'BOM-08',
      category: 'MIXED USE',
      status: 'HIGH LOAD (12ms)',
      statusType: 'caution',
      city: 'Mumbai',
      location: 'BKC Financial District',
      todaysUsage: '2,100',
      usageSubtext: 'HVAC surge',
      vsBaseline: '+14.6%',
      vsBaselineLabel: 'Chiller load',
      efficiency: 'CAUTION',
      efficiencySubtext: '+10-25% Peak',
      gridThreshold: 82,
      image: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'vertex-tower-a',
      name: 'Vertex Tower A',
      code: 'BLR-02',
      category: 'DATA CENTER',
      status: 'EXCURSION ALERT',
      statusType: 'alert',
      city: 'Bengaluru',
      location: 'Whitefield Corridor',
      todaysUsage: '3,850',
      usageSubtext: 'Critical load',
      vsBaseline: '+27.8%',
      vsBaselineLabel: 'Cooling loss',
      efficiency: 'PEAK ALERT',
      efficiencySubtext: '>25% Surge',
      gridThreshold: 96,
      image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'aerocity-gateway',
      name: 'Aerocity Gateway',
      code: 'DL-09',
      category: 'TRANSIT HUB',
      status: 'ONLINE (6ms)',
      statusType: 'optimal',
      city: 'Delhi NCR',
      location: 'IGI Terminal Link',
      todaysUsage: '620',
      usageSubtext: 'BMS optimized',
      vsBaseline: '-16.2%',
      vsBaselineLabel: 'Automated curb',
      efficiency: 'EXCELLENT',
      efficiencySubtext: '>15% Below',
      gridThreshold: 48,
      image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'mindspace-hub-4',
      name: 'Mindspace Hub 4',
      code: 'HYD-04',
      category: 'TECH CAMPUS',
      status: 'TELEMETRY LIVE',
      statusType: 'live',
      city: 'Hyderabad',
      location: 'HITEC City Phase 2',
      todaysUsage: '1,180',
      usageSubtext: 'Normative draw',
      vsBaseline: '+2.1%',
      vsBaselineLabel: 'Stable load',
      efficiency: 'GOOD',
      efficiencySubtext: 'Within 10%',
      gridThreshold: 62,
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    },
  ];

  // Active Building detail (Delhi Tech Park)
  const activeBuilding = {
    ...buildings[0],
    gfa: '5,000 m² GFA',
    conditionedSpace: '1,200 m²',
    zone: 'COMPOSITE',
    ecbcStatus: 'ECBC COMPLIANT',
    typology: 'Commercial Headquarters',
    microClimate: 'Composite (New Delhi NCR)',
    commissioningYear: '2012',
    occupancyBaseline: '1,400 pax Max',
    tariffPeakWindow: '14:00 - 18:00 IST',
    efficiencyScore: 65,
    regionalQuartile: '65th Percentile',
    targetRating: 'Top 25% (A-Class)',
    subsystems: [
      { name: 'Chiller #1 Compressor', health: '80% Health', status: 'caution' },
      { name: 'AHU-1 VAV Distribution', health: 'Healthy (96%)', status: 'optimal' },
      { name: 'Hydronic Pump-1', health: '85% Health', status: 'caution' },
    ],
    equipment: [
      {
        id: 'EQ-01',
        assetName: 'Chiller #1 (Basement 01)',
        subsystem: 'HVAC Central Plant',
        healthScore: 80,
        ageSpecs: '8 yrs (Trane Centrifugal 450T)',
        actionProtocol: 'Run Diagnostics',
        status: 'caution',
      },
      {
        id: 'EQ-02',
        assetName: 'AHU-1 (Air Handling Unit)',
        subsystem: 'HVAC Air Distribution',
        healthScore: 96,
        ageSpecs: '5 yrs (VAV Induction Array)',
        actionProtocol: 'Telemetry',
        status: 'optimal',
      },
      {
        id: 'EQ-03',
        assetName: 'Primary Chilled Water Pump-1',
        subsystem: 'Hydronics & Circulation',
        healthScore: 85,
        ageSpecs: '12 yrs (Armstrong VFD Pump)',
        actionProtocol: 'Schedule Service',
        status: 'caution',
      },
      {
        id: 'EQ-04',
        assetName: 'Rooftop Solar PV Inverter',
        subsystem: 'Renewable Generation',
        healthScore: 99,
        ageSpecs: '2 yrs (120 kW Micro-Grid)',
        actionProtocol: 'View Feed',
        status: 'optimal',
      },
    ],
    anomalies: [
      {
        id: 'ANOMALY-DLF-A1',
        title: 'Chiller #1 Energy Spike Excursion',
        severity: 'HIGH SEVERITY',
        timestamp: 'Sep 15, 14:00 IST',
        observedLoad: '520 kWh',
        baselineLoad: '180 kWh',
        deviation: '+189.4%',
        confidence: 87,
        groqDiagnosis:
          '78% probability of centrifugal compressor vane degradation or refrigerant flow bottleneck. Immediate service triage advised within 48 hours to avert an estimated +15% ongoing surcharge.',
        suggestedActions: [
          'Schedule Chiller Field Maintenance',
          'Float AHU setpoint +0.5°C during peak window',
          'Monitor compressor discharge temperature',
        ],
      },
    ],
  };

  // Retrofits Dataset matching Screenshot 7
  const [retrofits, setRetrofits] = useState([
    {
      id: 'R1',
      title: 'HVAC Scheduling Optimization',
      category: 'SMART CONTROLS',
      effort: 'EASY',
      ecbcCompliant: true,
      description:
        'Optimize building automation HVAC setpoints, deadbands, and plant ramp-up routines based on localized sensor occupancy matrices. Prevents pre-cooling vacant zones while ensuring thermal comfort adherence during core office leases.',
      capex: 0,
      capexLabel: 'Software-defined',
      annualYield: 150000,
      yieldLabel: '18.2 MWh/yr delta',
      payback: 'Immediate',
      applicabilityScore: 95,
      selected: true,
    },
    {
      id: 'R2',
      title: 'Chiller Variable Frequency Drive (VFD) Retrofit',
      category: 'HVAC EQUIPMENT',
      subLocation: 'Central Plant Block B',
      effort: 'MEDIUM',
      ecbcCompliant: true,
      description:
        'Install low-harmonic variable frequency drives onto primary centrifugal water-cooled chillers. Dynamically modulates compressor speed in response to wet-bulb temperature variations rather than fixed-rate vane throttling.',
      capex: 500000,
      capexLabel: 'Hardware + Install',
      annualYield: 80000,
      yieldLabel: 'COP improvement +0.8',
      payback: '6.2 Years',
      applicabilityScore: 88,
      selected: true,
    },
    {
      id: 'R3',
      title: 'LED Lighting & Daylight Harvesting Sensors',
      category: 'LIGHTING',
      subLocation: 'Facade Daylight Zone',
      effort: 'EASY',
      ecbcCompliant: true,
      description:
        'Replace legacy recessed fluorescent T5 troffers with 140 lm/W DALI-2 dimmable panels. Connect with continuous daylight harvesting sensors along eastern and southern perimeter facades to auto-trim ambient artificial illumination.',
      capex: 300000,
      capexLabel: 'Fixtures & Bus wiring',
      annualYield: 62000,
      yieldLabel: 'LPD < 5.5 W/m²',
      payback: '4.8 Years',
      applicabilityScore: 91,
      selected: false,
    },
    {
      id: 'R4',
      title: 'Smart Inverter & 100 kWh BESS Storage',
      category: 'SMART CONTROLS',
      subCategory: 'Tariff Arbitrage',
      effort: 'MEDIUM',
      ceaCompliant: true,
      description:
        'Deploy behind-the-meter Lithium Iron Phosphate (LFP) battery energy storage system. Automatically charges during nocturnal low-tariff intervals and discharges during the northern discom 14:00 - 18:00 IST peak grid demand window.',
      capex: 1200000,
      capexLabel: 'Turnkey BESS + Inverter',
      annualYield: 240000,
      yieldLabel: 'Peak charge reduction',
      payback: '5.0 Years',
      applicabilityScore: 92,
      selected: false,
    },
  ]);

  const toggleRetrofitSelection = (id) => {
    setRetrofits((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const triggerAIAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setIsAnalysisComplete(true);
    }, 3000);
  };

  const closeModals = () => {
    setIsAnalyzing(false);
    setIsAnalysisComplete(false);
    setSelectedAnomaly(null);
  };

  return (
    <BuildingContext.Provider
      value={{
        theme,
        toggleTheme,
        buildings,
        activeBuilding,
        activeCityFilter,
        setActiveCityFilter,
        searchQuery,
        setSearchQuery,
        retrofits,
        toggleRetrofitSelection,
        isAnalyzing,
        isAnalysisComplete,
        triggerAIAnalysis,
        selectedAnomaly,
        setSelectedAnomaly,
        closeModals,
        isAutoDREnabled,
        setIsAutoDREnabled,
      }}
    >
      {children}
    </BuildingContext.Provider>
  );
}

export const useBuildingContext = () => useContext(BuildingContext);
