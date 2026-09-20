import React, { createContext, useContext, useEffect, useState } from 'react';
import { getFeederState, getFeederTelemetryCurrent } from '../api/feeder';
import { getForecast, refreshForecast } from '../api/forecast';
import { CONFIG } from '../config';

const BuildingContext = createContext();

export function BuildingProvider({ children }) {
  const [theme, setTheme] = useState('dark');
  const [activeCityFilter, setActiveCityFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [liveGridFlex, setLiveGridFlex] = useState(null);

  useEffect(() => {
    let isCurrent = true;

    async function loadLiveGridFlex() {
      // Step 1: seed the backend if it has no data yet (cold start).
      // refreshForecast triggers the backend forecast cycle (POST /refresh),
      // which also populates feeder state via the grid intelligence cycle.
      // If the backend is unreachable this is a silent no-op.
      try {
        await refreshForecast(CONFIG.DEFAULT_FEEDER_ID);
      } catch {
        // Backend unreachable — fall through to mock data below.
      }

      // Step 2: fetch live data (now guaranteed to have results after seed).
      const [state, telemetry, forecast] = await Promise.all([
        getFeederState(CONFIG.DEFAULT_FEEDER_ID),
        getFeederTelemetryCurrent(CONFIG.DEFAULT_FEEDER_ID),
        getForecast(CONFIG.DEFAULT_FEEDER_ID),
      ]);

      if (!isCurrent || (state.isMock && telemetry.isMock && forecast.isMock)) return;

      setLiveGridFlex({
        state: state.isMock ? null : state.data,
        telemetry: telemetry.isMock ? null : telemetry.data,
        forecast: forecast.isMock ? null : forecast.data,
      });
    }

    loadLiveGridFlex().catch(() => {
      // The existing static building data remains the fallback.
    });

    return () => {
      isCurrent = false;
    };
  }, []);

  // Sync data-theme attribute on <html> so CSS variables flip globally.
  // This means EVERY component using var(--color-bg-charcoal) etc. reacts
  // automatically — no per-component isLight checks needed for base colours.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme === 'light' ? 'light' : '');
    document.documentElement.style.backgroundColor = theme === 'light' ? '#F4F7EF' : '#0F0F0F';
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };
  
  // Modals state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalysisComplete, setIsAnalysisComplete] = useState(false);
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [isAutoDREnabled, setIsAutoDREnabled] = useState(true);

  // ── Buildings dataset — Mumbai feeder topology (matches backend config) ──
  // Backend: lat 19.0760, lon 72.8777 (Mumbai), feeder F01 = Dharavi North
  // Feeders F01-F04: Dharavi North, Kurla West, Bandra East, Sion South (MSEDCL)
  const buildings = [
    {
      id: 'dharavi-north-f01',
      feederId: 'F01',
      name: 'Dharavi North',
      code: 'F01',
      category: 'RESIDENTIAL FEEDER',
      status: 'TELEMETRY LIVE',
      statusType: 'live',
      city: 'Mumbai',
      location: 'Dharavi, Central Mumbai',
      todaysUsage: '162',
      usageUnit: 'kW',
      usageSubtext: 'Live feeder F01 reading',
      vsBaseline: '-12.3%',
      vsBaselineLabel: 'Solar offset',
      efficiency: 'GOOD',
      efficiencySubtext: 'Within 10%',
      gridThreshold: 68,
      // Dharavi North — Mumbai dense residential, colourful buildings, community
      image: 'https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'kurla-west-f02',
      feederId: 'F02',
      name: 'Kurla West',
      code: 'F02',
      category: 'MIXED USE FEEDER',
      status: 'ONLINE (6ms)',
      statusType: 'optimal',
      city: 'Mumbai',
      location: 'Kurla West, Eastern Suburbs',
      todaysUsage: '248',
      usageUnit: 'kW',
      usageSubtext: 'Peak shaved',
      vsBaseline: '-18.4%',
      vsBaselineLabel: 'BESS arbitrage',
      efficiency: 'OPTIMAL',
      efficiencySubtext: '>15% Below',
      gridThreshold: 42,
      // Kurla West — Mumbai suburban street, local trains, mixed-use density
      image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'bandra-east-f03',
      feederId: 'F03',
      name: 'Bandra East',
      code: 'F03',
      category: 'COMMERCIAL FEEDER',
      status: 'HIGH LOAD (12ms)',
      statusType: 'caution',
      city: 'Mumbai',
      location: 'BKC Financial District',
      todaysUsage: '410',
      usageUnit: 'kW',
      usageSubtext: 'HVAC surge',
      vsBaseline: '+14.6%',
      vsBaselineLabel: 'Chiller load',
      efficiency: 'CAUTION',
      efficiencySubtext: '+10-25% Peak',
      gridThreshold: 82,
      // Bandra East / BKC — glass curtain-wall commercial highrise towers
      image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'sion-south-f04',
      feederId: 'F04',
      name: 'Sion South',
      code: 'F04',
      category: 'INDUSTRIAL FEEDER',
      status: 'MONITORING',
      statusType: 'caution',
      city: 'Mumbai',
      location: 'Sion, Central Line Corridor',
      todaysUsage: '312',
      usageUnit: 'kW',
      usageSubtext: 'Stable industrial draw',
      vsBaseline: '+2.1%',
      vsBaselineLabel: 'Target buffer',
      efficiency: 'GOOD',
      efficiencySubtext: 'Within 10%',
      gridThreshold: 62,
      // Sion — Mumbai Central Line, suburban railway infrastructure
      image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'andheri-east-f05',
      feederId: 'F05',
      name: 'Andheri East',
      code: 'F05',
      category: 'TECH CAMPUS HUB',
      status: 'TELEMETRY LIVE',
      statusType: 'live',
      city: 'Mumbai',
      location: 'MIDC, Andheri East',
      todaysUsage: '185',
      usageUnit: 'kW',
      usageSubtext: 'Normative draw',
      vsBaseline: '+3.8%',
      vsBaselineLabel: 'Stable load',
      efficiency: 'GOOD',
      efficiencySubtext: 'Within 10%',
      gridThreshold: 58,
      // Andheri East MIDC — modern IT campus & tech park buildings
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'worli-north-f06',
      feederId: 'F06',
      name: 'Worli North',
      code: 'F06',
      category: 'TRANSIT + COMMERCIAL',
      status: 'ONLINE (4ms)',
      statusType: 'optimal',
      city: 'Mumbai',
      location: 'Worli Sea Face, South Mumbai',
      todaysUsage: '138',
      usageUnit: 'kW',
      usageSubtext: 'BMS optimized',
      vsBaseline: '-16.2%',
      vsBaselineLabel: 'Automated curb',
      efficiency: 'EXCELLENT',
      efficiencySubtext: '>15% Below',
      gridThreshold: 48,
      // Worli — Bandra–Worli Sea Link, South Mumbai waterfront skyline
      image: 'https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?auto=format&fit=crop&w=800&q=80',
    },
  ];

  // ── Active Building / Feeder detail — F01 Dharavi North ─────────────────
  // Matches backend feeder F01: Mumbai composite zone, MSEDCL tariff structure
  const activeBuilding = {
    ...buildings[0],
    gfa: '4,200 m² GFA',
    conditionedSpace: '1,050 m²',
    zone: 'TROPICAL WET',
    ecbcStatus: 'ECBC COMPLIANT',
    typology: 'Community Residential Feeder',
    microClimate: 'Tropical Wet (Mumbai — 19.08°N, 72.88°E)',
    commissioningYear: '2018',
    occupancyBaseline: '340 households / ~1,200 pax',
    tariffPeakWindow: '22:00 - 06:00 IST (ToD Off-Peak)',
    discom: 'MSEDCL (Maharashtra State Electricity Distribution)',
    peakSolarKw: 150,
    batteryCapacityKwh: 200,
    batteryReservePct: 20,
    gridImportLimitKw: 80,
    efficiencyScore: 72,
    regionalQuartile: '72nd Percentile',
    targetRating: 'Top 20% (A-Class Mumbai)',
    subsystems: [
      { name: 'Community Battery BESS-F01', health: '80% SoC (160 kWh avail)', status: 'optimal' },
      { name: 'Rooftop Solar Array (150 kW peak)', health: 'Healthy (118 kW live)', status: 'optimal' },
      { name: 'Distribution Transformer 500 kVA', health: '27% Loading — Normal', status: 'optimal' },
      { name: 'EV Charging Hub (Sector B)', health: '3 active / 10 enrolled', status: 'caution' },
    ],
    equipment: [
      {
        id: 'EQ-F01-BAT',
        assetName: 'BESS-F01 Community Battery (200 kWh)',
        subsystem: 'Energy Storage',
        healthScore: 96,
        ageSpecs: '2 yrs (LFP 200 kWh / 80 kW BYD)',
        actionProtocol: 'View Feed',
        status: 'optimal',
      },
      {
        id: 'EQ-F01-SOL',
        assetName: 'Rooftop Solar PV Inverter (150 kW)',
        subsystem: 'Renewable Generation',
        healthScore: 99,
        ageSpecs: '3 yrs (SMA Sunny Tripower 150 kW)',
        actionProtocol: 'View Feed',
        status: 'optimal',
      },
      {
        id: 'EQ-F01-TRF',
        assetName: 'Distribution Transformer (500 kVA)',
        subsystem: 'Grid Infrastructure',
        healthScore: 88,
        ageSpecs: '6 yrs (Crompton 33/0.4 kV)',
        actionProtocol: 'Run Diagnostics',
        status: 'caution',
      },
      {
        id: 'EQ-F01-EV',
        assetName: 'EV Charging Hub — Sector B',
        subsystem: 'Flexible Demand',
        healthScore: 91,
        ageSpecs: '1 yr (Tata Power EZ Charge 10-port)',
        actionProtocol: 'Telemetry',
        status: 'optimal',
      },
    ],
    anomalies: [
      {
        id: 'ANOMALY-F01-A1',
        title: 'Distribution Transformer Thermal Excursion',
        severity: 'HIGH SEVERITY',
        timestamp: 'Sep 20, 14:00 IST',
        observedLoad: '82.4 kW',
        baselineLoad: '65.0 kW',
        deviation: '+26.8%',
        confidence: 87,
        groqDiagnosis:
          '74% probability of elevated ambient temperature (42°C at transformer housing) combined with EV charging surge in Sector B causing overtemperature. GridFlex battery dispatch reduced peak by 14 kW. Recommend shade installation and thermal monitoring.',
        suggestedActions: [
          'Deploy shade canopy over Transformer Bay 1',
          'Throttle EV charging to 50% during 14:00–18:00 IST peak',
          'Monitor winding temperature via sensor F01-TRF-T1',
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
        'Optimize feeder-connected HVAC setpoints and water heater schedules based on live occupancy and solar generation data. Defers non-critical loads during MSEDCL ToD peak window (14:00–18:00 IST) to reduce community peak demand charges.',
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
        'Expand BESS-F01 from 200 kWh to 400 kWh LFP capacity. Enables 4-hour overnight arbitrage charging at Mumbai off-peak rate (₹3.80/kWh) with full 80 kW peak discharge during MSEDCL ToD peak, targeting net daily savings of ₹3,200.',
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
      description: 'Expand rooftop solar PV from 150 kW to 300 kW peak capacity on Dharavi North community rooftops. Integrates with BESS-F01 for zero-export grid configuration — additional 130 kWh daily generation offsets 80% of morning community load.',
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
        'Deploy 10 additional smart EV charging ports across Dharavi North Sector B with V2G capability. Enrolled EVs contribute up to 30 kW of dispatchable flexibility during MSEDCL reliability events, earning residents RC credits per kWh contributed.',
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

  // Merge live backend data into the F01 Dharavi North card when available.
  const liveBuilding = liveGridFlex
    ? {
        ...buildings[0],
        status: liveGridFlex.state?.status === 'OK' ? 'TELEMETRY LIVE' : (liveGridFlex.state?.status || 'TELEMETRY LIVE'),
        statusType: 'live',
        todaysUsage: String(Math.round(liveGridFlex.telemetry?.demand_kw ?? liveGridFlex.state?.demand_kw ?? 162)),
        usageUnit: 'kW',
        usageSubtext: liveGridFlex.telemetry?.timestamp ? 'Live feeder F01 reading' : 'Live feeder reading',
        forecastConfidence: liveGridFlex.forecast?.forecast_confidence_pct,
        gridThreshold: Math.round(liveGridFlex.state?.stress_index ?? 68),
        gridMetricLabel: liveGridFlex.state?.stress_index != null ? 'Grid stress index' : 'Grid demand threshold',
        vsBaseline: liveGridFlex.state?.net_gap_kw > 0
          ? `+${liveGridFlex.state.net_gap_kw.toFixed(1)} kW gap`
          : '-12.3%',
        vsBaselineLabel: liveGridFlex.state?.net_gap_kw > 0 ? 'Energy gap' : 'Solar offset',
      }
    : buildings[0];
  const displayBuildings = liveGridFlex ? [liveBuilding, ...buildings.slice(1)] : buildings;

  return (
    <BuildingContext.Provider
      value={{
        theme,
        toggleTheme,
        buildings: displayBuildings,
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
