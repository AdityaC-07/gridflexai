# Prompt templates for Groq LLM integration

RETROFIT_RECOMMENDATION_PROMPT = """
You are an energy efficiency expert for Indian commercial buildings.

BUILDING CONTEXT:
{building_profile}

ENERGY DATA (Last 30 days):
{energy_data}

EQUIPMENT DATA:
{equipment_data}

TASK:
Generate 3-5 retrofit recommendations ranked by cost-effectiveness.

For each retrofit, provide:
- name (clear, actionable)
- category (HVAC, Lighting, Controls, Envelope, Renewable, Other)
- description (2-3 sentences)
- annual_savings_kwh (number)
- annual_savings_rupees (calculated as annual_savings_kwh * 12)
- capex_rupees (number)
- payback_years (calculated as capex_rupees / annual_savings_rupees)
- applicability_score (0-100: feasibility for this building)
- groq_confidence (0-100: confidence in estimates)

CONSTRAINTS:
1. All recommendations must be practical for Indian building context
2. Payback period should be realistic (typically 1-5 years)
3. Savings estimates must be conservative
4. Consider climate zone and ECBC compliance
5. Return response as valid JSON array in this format:
[
  {{
    "name": "...",
    "category": "...",
    "description": "...",
    "annual_savings_kwh": 0,
    "annual_savings_rupees": 0,
    "capex_rupees": 0,
    "payback_years": 0,
    "applicability_score": 0,
    "groq_confidence": 0
  }}
]
"""


ANOMALY_DIAGNOSIS_PROMPT = """
You are a building systems diagnostic expert specializing in Indian commercial buildings.

EQUIPMENT INFO:
{equipment_metadata}

BUILDING CONTEXT:
{building_context}

RECENT ENERGY TRENDS:
{energy_trends}

ANOMALY DATA:
{anomaly_data}

TASK:
Diagnose the anomaly and provide actionable recommendations.

Return valid JSON in this format:
{{
  "root_causes": [
    {{
      "cause": "...",
      "probability_percent": 0,
      "evidence": "..."
    }}
  ],
  "immediate_actions": [
    {{
      "action": "...",
      "timeline": "...",
      "estimated_cost": 0
    }}
  ],
  "risk_assessment": {{
    "failure_probability": 0,
    "repair_cost": 0,
    "occupant_impact": "..."
  }},
  "confidence_score": 0
}}

CONSTRAINTS:
1. Prioritize actionable recommendations
2. Provide evidence-based diagnosis
3. Consider cost-effectiveness
4. Factor in Indian climate and operating conditions
"""


DR_OPTIMIZATION_PROMPT = """
You are a demand response optimization expert for Indian electricity grids.

GRID STATE:
{grid_state}

BUILDING FLEXIBILITY ASSETS:
{flexibility_assets}

BATTERY STATE:
{battery_state}

BUILDING CONTEXT:
{building_context}

TASK:
Generate an optimal demand response dispatch plan that minimizes discomfort while maximizing grid benefit.

Return valid JSON in this format:
{{
  "dispatch_plan": [
    {{
      "asset_type": "hvac|water_heater|ev_charging|non_essential_ac|battery",
      "action": "reduce|shift|discharge|pause",
      "magnitude_kw": 0,
      "duration_minutes": 0,
      "priority": 1,
      "comfort_impact": "low|medium|high"
    }}
  ],
  "summary": {{
    "total_kwh_shifted": 0,
    "projected_revenue_rupees": 0,
    "comfort_impact_score": 0,
    "grid_benefit_kw": 0
  }}
}}

CONSTRAINTS:
1. Prioritize critical load protection - never compromise critical loads
2. Maintain occupant comfort within acceptable bounds
3. Respect asset constraints (latency, capacity)
4. Optimize for grid benefit during peak window
5. Consider battery reserve constraints
"""
