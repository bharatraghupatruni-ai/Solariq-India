import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { fetchNasaWeatherData } from "@/lib/api/nasa-v2";
import { calculateSolarGeneration, selectOptimalPanelType } from "@/lib/calculations/solar-engine";
import { calculateFinancials } from "@/lib/calculations/financial-engine";
import { calculateSuitabilityScore } from "@/lib/calculations/suitability-scorer";
import { INDIAN_STATES } from "@/lib/constants/states";
import { PANEL_SPECS } from "@/lib/constants/panels";
import { validateCity, validateBounds, applySecurityHeaders } from "@/lib/validation";
import { checkRateLimit, recordRequest } from "@/lib/rate-limiter";

const schema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().max(500),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  pincode: z.string().max(6).optional(),
  propertyName: z.string().min(1).max(200),
  propertyType: z.enum(["residential", "commercial", "industrial", "agricultural"]),
  roofAreaSqm: z.number().positive(),
  monthlyBillInr: z.number().positive(),
  monthlyConsumptionKwh: z.number().positive(),
  electricityRatePerUnit: z.number().positive(),
  budgetInr: z.number().positive(),
  gridConnected: z.boolean().optional(),
  batteryInterest: z.boolean().optional(),
  panelPreference: z.enum(["mono_perc", "topcon", "hjt", "bifacial", "auto"]).optional(),
});

export async function POST(request: NextRequest) {
  // Rate limiting
  const clientId = request.ip ?? "anonymous";
  const rateResult = checkRateLimit(clientId);
  if (!rateResult.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      { status: 429, headers: { "Retry-After": String(rateResult.retryAfter ?? 0) } },
    );
  }
  recordRequest(clientId);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const input = parsed.data;

  // City validation — reject SQL injection, XSS, HTML, JS payloads → 422
  const cityValidation = validateCity(input.city);
  if (!cityValidation.valid) {
    return NextResponse.json({ error: cityValidation.error }, { status: 422 });
  }

  // Upper limits: Area 50–50000, Bill 100–100000
  const areaValidation = validateBounds(input.roofAreaSqm, 50, 50000, "Roof area (sqm)");
  if (!areaValidation.valid) {
    return NextResponse.json({ error: areaValidation.error }, { status: 422 });
  }

  const billValidation = validateBounds(input.monthlyBillInr, 100, 100000, "Monthly bill (INR)");
  if (!billValidation.valid) {
    return NextResponse.json({ error: billValidation.error }, { status: 422 });
  }

  const budgetValidation = validateBounds(input.budgetInr, 10000, 10000000, "Budget (INR)");
  if (!budgetValidation.valid) {
    return NextResponse.json({ error: budgetValidation.error }, { status: 422 });
  }

  const stateInfo = INDIAN_STATES[input.state];
  const sanitizedCity = cityValidation.sanitized;

  try {
    // 1. Create property
    const { data: property, error: propErr } = await supabase
      .from("properties")
      .insert({
        user_id: user.id,
        name: input.propertyName,
        address: input.address,
        city: sanitizedCity,
        state: input.state,
        pincode: input.pincode,
        property_type: input.propertyType,
        latitude: input.latitude,
        longitude: input.longitude,
      })
      .select()
      .single();

    if (propErr) throw propErr;

    // 2. Create roof analysis record
    const USABLE_RATIO = 0.70;
    const { data: roofAnalysis, error: roofErr } = await supabase
      .from("roof_analyses")
      .insert({
        property_id: property.id,
        user_id: user.id,
        status: "processing",
        total_roof_area_sqm: input.roofAreaSqm,
        usable_roof_area_sqm: input.roofAreaSqm * USABLE_RATIO,
        shading_factor: 0.05,
        tilt_angle: 15,
        azimuth_angle: 180,
        detected_obstacles: [],
        max_panel_count: Math.floor((input.roofAreaSqm * USABLE_RATIO) / 1.96),
        ai_confidence_score: null,
        model_version: "manual_v1",
      })
      .select()
      .single();

    if (roofErr) throw roofErr;

    // 3. Store user inputs
    const { data: userInputRecord, error: inputErr } = await supabase
      .from("user_inputs")
      .insert({
        roof_analysis_id: roofAnalysis.id,
        user_id: user.id,
        monthly_bill_inr: input.monthlyBillInr,
        monthly_consumption_kwh: input.monthlyConsumptionKwh,
        budget_inr: input.budgetInr,
        property_type: input.propertyType,
        electricity_rate_per_unit: input.electricityRatePerUnit,
        discom_name: stateInfo?.discom ?? null,
        grid_connected: input.gridConnected ?? true,
        battery_storage_interest: input.batteryInterest ?? false,
      })
      .select()
      .single();

    if (inputErr) throw inputErr;

    // 4. Fetch weather data (with timeout + retry from nasa-v2)
    const weatherRaw = await fetchNasaWeatherData(input.latitude, input.longitude);

    // Cache weather in weather_cache table (migration 002 schema)
    const { data: weatherRecord } = await supabase
      .from("weather_cache")
      .insert({
        latitude: input.latitude,
        longitude: input.longitude,
        current_temp: weatherRaw.avgTemperatureC,
        current_humidity: weatherRaw.avgHumidityPct,
        current_clouds: weatherRaw.avgCloudCoverPct,
        current_conditions: "NASA_POWER",
        forecast_data: {
          annual_ghi: weatherRaw.annualGhi,
          peak_sun_hours_daily: weatherRaw.peakSunHoursDaily,
          monthly_ghi: weatherRaw.monthlyGhi,
          monthly_temperature: weatherRaw.monthlyTemperature,
          monthly_cloud_cover: weatherRaw.monthlyCloudCover,
          seasonal_patterns: {
            best_months: [],
            worst_months: [],
            monsoon_months: ["Jun", "Jul", "Aug", "Sep"],
          },
        },
      })
      .select()
      .single();

    // 5. Calculate solar generation
    const panelType =
      input.panelPreference && input.panelPreference !== "auto"
        ? input.panelPreference
        : selectOptimalPanelType(input.roofAreaSqm, input.budgetInr, input.latitude);

    const solarResult = calculateSolarGeneration({
      roofAreaSqm: input.roofAreaSqm,
      usableAreaRatio: USABLE_RATIO,
      peakSunHoursDaily: weatherRaw.peakSunHoursDaily,
      systemEfficiency: 0.80,
      panelType,
      latitude: input.latitude,
      shadingFactor: 0.05,
      tiltAngle: 15,
      azimuthAngle: 180,
      monthlyGhi: weatherRaw.monthlyGhi,
    });

    const { data: solarRecord } = await supabase
      .from("solar_predictions")
      .insert({
        roof_analysis_id: roofAnalysis.id,
        weather_data_id: weatherRecord?.id ?? null,
        user_input_id: userInputRecord.id,
        recommended_panel_type: panelType,
        recommended_panel_count: solarResult.panelCount,
        system_capacity_kwp: solarResult.systemCapacityKwp,
        daily_generation_kwh: solarResult.dailyGenerationKwh,
        monthly_generation_kwh: solarResult.monthlyGenerationKwh,
        annual_generation_kwh: solarResult.annualGenerationKwh,
        lifetime_generation_kwh: solarResult.lifetimeGenerationKwh,
        system_efficiency_pct: solarResult.systemEfficiencyPct,
        performance_ratio: solarResult.performanceRatio,
        monthly_generation_breakdown: solarResult.monthlyBreakdown,
        year1_generation_kwh: solarResult.year1Kwh,
        year5_generation_kwh: solarResult.year5Kwh,
        year10_generation_kwh: solarResult.year10Kwh,
        year25_generation_kwh: solarResult.year25Kwh,
        xgboost_model_version: null,
        prediction_confidence: 0.85,
      })
      .select()
      .single();

    // 6. Calculate financials
    const financialResult = calculateFinancials({
      capacityKwp: solarResult.systemCapacityKwp,
      annualGenerationKwh: solarResult.annualGenerationKwh,
      electricityRatePerUnit: input.electricityRatePerUnit,
      state: input.state,
      propertyType: input.propertyType,
      panelType: panelType as any,
      electricityInflationRate: 0.06,
      discountRate: 0.08,
      degradationRate: 0.005,
    });

    const { data: financialRecord } = await supabase
      .from("financial_analyses")
      .insert({
        solar_prediction_id: solarRecord?.id ?? null,
        user_id: user.id,
        gross_installation_cost_inr: financialResult.grossInstallationCostInr,
        central_subsidy_inr: financialResult.centralSubsidyInr,
        state_subsidy_inr: financialResult.stateSubsidyInr,
        net_investment_inr: financialResult.netInvestmentInr,
        panel_options: financialResult.panelOptions,
        annual_savings_inr: financialResult.annualSavingsInr,
        payback_period_years: financialResult.paybackPeriodYears,
        roi_percentage: financialResult.roiPercentage,
        irr_percentage: financialResult.irrPercentage,
        npv_inr: financialResult.npvInr,
        savings_5yr_inr: financialResult.savings5yrInr,
        savings_10yr_inr: financialResult.savings10yrInr,
        savings_25yr_inr: financialResult.savings25yrInr,
        co2_offset_annual_kg: financialResult.co2OffsetAnnualKg,
        trees_equivalent: financialResult.treesEquivalent,
        units_sold_to_grid_annual: financialResult.unitsExportedAnnual,
        grid_export_revenue_annual: financialResult.gridExportRevenueAnnual,
        electricity_inflation_rate: 0.06,
        discount_rate: 0.08,
        panel_degradation_rate: 0.005,
      })
      .select()
      .single();

    // 7. Calculate suitability score
    const suitabilityResult = calculateSuitabilityScore({
      roofAreaSqm: input.roofAreaSqm,
      usableAreaSqm: input.roofAreaSqm * USABLE_RATIO,
      shadingFactor: 0.05,
      peakSunHoursDaily: weatherRaw.peakSunHoursDaily,
      tiltAngle: 15,
      financialResult,
      solarResult,
      state: input.state,
      propertyType: input.propertyType,
    });

    await supabase.from("suitability_scores").insert({
      roof_analysis_id: roofAnalysis.id,
      financial_analysis_id: financialRecord?.id ?? null,
      overall_score: suitabilityResult.overallScore,
      roof_quality_score: suitabilityResult.roofQualityScore,
      solar_resource_score: suitabilityResult.solarResourceScore,
      financial_viability_score: suitabilityResult.financialViabilityScore,
      policy_environment_score: suitabilityResult.policyEnvironmentScore,
      strengths: suitabilityResult.strengths,
      weaknesses: suitabilityResult.weaknesses,
      opportunities: suitabilityResult.opportunities,
      recommendation: suitabilityResult.recommendation,
      recommendation_level: suitabilityResult.recommendationLevel,
    });

    // 8. Mark analysis completed
    await supabase
      .from("roof_analyses")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", roofAnalysis.id);

    // Fire-and-forget: send to FastAPI ML backend for enhanced prediction
    const ML_BACKEND = process.env.ML_BACKEND_URL || "http://localhost:8000";
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        fetch(`${ML_BACKEND}/api/ml/predict`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            annualGhi: weatherRaw.annualGhi,
            peakSunHoursDaily: weatherRaw.peakSunHoursDaily,
            avgTemperature: weatherRaw.avgTemperatureC,
            avgHumidity: weatherRaw.avgHumidityPct,
            roofArea: input.roofAreaSqm,
            orientation: "south",
            shading: "none",
            cleaning: "monthly",
            panelType: input.panelPreference || "mono_perc",
            environment: "clean",
            latitude: input.latitude,
            month: new Date().getMonth() + 1,
            city: sanitizedCity,
            state: input.state,
            monthlyBillInr: input.monthlyBillInr,
            monthlyConsumptionKwh: input.monthlyConsumptionKwh,
            budgetInr: input.budgetInr,
            propertyType: input.propertyType,
          }),
          signal: AbortSignal.timeout(15000),
        }).catch((mlErr: unknown) => console.warn("ML backend prediction failed (non-blocking):", mlErr));
      }
    } catch (mlSetupErr) {
      console.warn("ML backend setup failed (non-blocking):", mlSetupErr);
    }

    const response = NextResponse.json({
      analysisId: roofAnalysis.id,
      score: suitabilityResult.overallScore,
      capacityKwp: solarResult.systemCapacityKwp,
      annualGenerationKwh: solarResult.annualGenerationKwh,
      netInvestmentInr: financialResult.netInvestmentInr,
      paybackYears: financialResult.paybackPeriodYears,
      savings25yr: financialResult.savings25yrInr,
    });

    return applySecurityHeaders(response);
  } catch (err) {
    console.error("Analysis creation failed:", err);
    return NextResponse.json(
      { error: "Analysis failed. Please try again." },
      { status: 500 },
    );
  }
}
