import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClayCard } from "@/components/ui/ClayCard";
import { Info } from "lucide-react";
import { ReportHeaderActions } from "@/components/results/ReportHeaderActions";
import { SuitabilityScoreCard } from "@/components/results/SuitabilityScore";
import { formatCurrency, formatKwp, formatKwh, formatYears, formatPercentage } from "@/lib/utils/format";
import { runWhatIfSimulations } from "@/lib/calculations/whatif-simulator";
import { calculateSolarReadinessScore } from "@/lib/calculations/solar-readiness";
import { calculateSolarHealthIndex } from "@/lib/calculations/health-index";
import { predictSolarGeneration } from "@/lib/ml/prediction-engine";
import { WhatIfSimulator } from "@/components/results/WhatIfSimulator";
import { EMICalculator } from "@/components/financial/EMICalculator";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AnalysisResultPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: analysis, error: selectError } = await supabase
    .from("roof_analyses")
    .select(`
      *,
      properties (*),
      user_inputs (*),
      solar_predictions (
        *,
        financial_analyses (*)
      ),
      suitability_scores (*)
    `)
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (selectError) {
    console.error("Database query failed for analysis:", id, selectError);
  }

  if (!analysis) notFound();

  const solar = Array.isArray(analysis.solar_predictions)
    ? analysis.solar_predictions[0]
    : analysis.solar_predictions;
  const financial = Array.isArray(solar?.financial_analyses)
    ? solar?.financial_analyses[0]
    : solar?.financial_analyses;
  const suitability = Array.isArray(analysis.suitability_scores)
    ? analysis.suitability_scores[0]
    : analysis.suitability_scores;
  const prop = Array.isArray(analysis.properties)
    ? analysis.properties[0]
    : analysis.properties;
  const inputs = Array.isArray(analysis.user_inputs)
    ? analysis.user_inputs[0]
    : analysis.user_inputs;

  if (!solar || !financial || !suitability) {
    return (
      <div className="flex items-center justify-center py-20 text-[#292524]">
        <div className="glass-card text-center p-12 rounded-3xl border border-stone-200/50">
          <div className="text-4xl mb-4">⏳</div>
          <h2 className="text-lg font-bold text-primary font-serif">Analysis in Progress</h2>
          <p className="text-stone-500 text-sm mt-2 font-medium">
            Your analysis is being processed. Refresh in a few moments.
          </p>
        </div>
      </div>
    );
  }

  const orientation = (inputs?.orientation as string) || "south";
  const shading = (inputs?.shading as string) || "none";
  const cleaning = (inputs?.cleaning_frequency as string) || "monthly";
  const panelType = (inputs?.panel_type as string) || "mono";
  const environment = (inputs?.environment as string) || "clean";
  const roofArea = (inputs?.roof_area_sqm as number) || 100;
  const avgTemp = (inputs?.avg_temperature as number) || 28;
  const avgHumidity = (inputs?.avg_humidity as number) || 50;
  const latitude = (inputs?.latitude as number) || 20;
  const solarResource = (solar.annual_ghi as number) || 1800;

  const orientationVal = ["south", "east", "west", "north"].includes(orientation) ? orientation : "south";
  const shadingVal = ["none", "partial", "heavy"].includes(shading) ? shading : "none";
  const cleaningVal = ["weekly", "monthly", "rarely"].includes(cleaning) ? cleaning : "monthly";
  const panelTypeVal = ["mono", "poly", "thin_film"].includes(panelType) ? panelType : "mono";
  const mappedPanelType = (panelTypeVal === "mono" ? "mono_perc" : panelTypeVal) as "mono_perc" | "topcon" | "hjt" | "bifacial" | "poly" | "thin_film";
  const environmentVal = ["clean", "dusty", "urban_smog"].includes(environment) ? environment : "clean";

  // Compute Solar Readiness Score
  const readinessResult = calculateSolarReadinessScore({
    orientation: orientationVal as "south" | "east" | "west" | "north",
    shading: shadingVal as "none" | "partial" | "heavy",
    roofArea,
    cleaning: cleaningVal as "weekly" | "monthly" | "rarely",
    panelType: mappedPanelType,
    environment: environmentVal as "clean" | "dusty" | "urban_smog",
    solarResource,
  });

  // Compute Solar Health Index
  const healthResult = calculateSolarHealthIndex({
    environment: environmentVal as "clean" | "dusty" | "urban_smog",
    cleaning: cleaningVal as "weekly" | "monthly" | "rarely",
    avgTemperature: avgTemp,
    panelType: mappedPanelType,
    avgHumidity,
    shading: shadingVal as "none" | "partial" | "heavy",
  });

  // Predict Solar Generation (Confidence intervals + Feature Importance)
  const mlResult = predictSolarGeneration({
    annualGhi: solarResource,
    peakSunHoursDaily: solar.peak_sun_hours_daily ?? 5.5,
    avgTemperature: avgTemp,
    avgHumidity: avgHumidity,
    roofArea,
    orientation: orientationVal as "south" | "east" | "west" | "north",
    shading: shadingVal as "none" | "partial" | "heavy",
    cleaning: cleaningVal as "weekly" | "monthly" | "rarely",
    panelType: panelTypeVal as "mono" | "poly" | "thin_film",
    environment: environmentVal as "clean" | "dusty" | "urban_smog",
    latitude,
    month: new Date().getMonth() + 1,
  });

  // What-if Scenarios
  const whatIfScenarios = runWhatIfSimulations({
    roofAreaSqm: roofArea,
    peakSunHoursDaily: solar.peak_sun_hours_daily ?? 5.5,
    latitude,
    monthlyGhi: solar.monthly_generation_breakdown
      ? (solar.monthly_generation_breakdown as number[]).map((v) => (v * 30) / roofArea)
      : Array(12).fill(solarResource / 12),
    electricityRatePerUnit: financial.electricity_rate_per_unit ?? 8,
    state: (inputs?.state as string) || "maharashtra",
    propertyType: (inputs?.property_type as string) || "residential",
    currentPanelType: (panelTypeVal === "mono" ? "mono_perc" : panelTypeVal === "poly" ? "poly" : "thin_film") as "mono_perc" | "topcon" | "hjt" | "bifacial",
    currentShadingFactor: shadingVal === "heavy" ? 0.18 : shadingVal === "partial" ? 0.1 : 0.05,
    currentCleaning: cleaningVal as "weekly" | "monthly" | "rarely",
    currentOrientation: orientationVal as "south" | "east" | "west" | "north",
  });

  // SVG Line Chart Points Computation for Energy prediction
  const monthlyGeneration = (solar.monthly_generation_breakdown as number[]) || Array(12).fill(0);
  const maxKwh = Math.max(...monthlyGeneration, 100);
  const chartWidth = 740;
  const chartHeight = 130;
  const paddingX = 30;
  const paddingY = 20;

  const points = monthlyGeneration.map((val, idx) => {
    const x = paddingX + (idx / 11) * chartWidth;
    const y = chartHeight + paddingY - (val / maxKwh) * chartHeight;
    return { x, y };
  });

  const pointsStr = points.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPathStr = `M ${points[0].x} ${chartHeight + paddingY} ` +
    points.map((p) => `L ${p.x} ${p.y}`).join(" ") +
    ` L ${points[11].x} ${chartHeight + paddingY} Z`;

  // 25-Year Projection Chart Points Computation
  const netInvestment = financial.net_investment_inr;
  const annualSavings = financial.annual_savings_inr;
  const cumulativeSavings = Array.from({ length: 25 }, (_, i) => {
    const savings = (1.06 ** i) * (1 - 0.005) ** i * annualSavings;
    return savings;
  });

  let runningSavings = -netInvestment;
  const savingsTimelinePoints = cumulativeSavings.map((val) => {
    runningSavings += val;
    return runningSavings;
  });
  const maxSavingsVal = Math.max(...savingsTimelinePoints, 10000);
  const minSavingsVal = -netInvestment;

  const csPoints = savingsTimelinePoints.map((val, idx) => {
    const x = paddingX + (idx / 24) * chartWidth;
    const y = chartHeight + paddingY - ((val - minSavingsVal) / (maxSavingsVal - minSavingsVal)) * chartHeight;
    return { x, y };
  });
  const csPointsStr = csPoints.map((p) => `${p.x},${p.y}`).join(" ");
  const csAreaPathStr = `M ${csPoints[0].x} ${chartHeight + paddingY} ` +
    csPoints.map((p) => `L ${p.x} ${p.y}`).join(" ") +
    ` L ${csPoints[24].x} ${chartHeight + paddingY} Z`;

  // Degradation Line: from 100% (top) to 87.5% (slopes down slightly)
  const degPoints = Array.from({ length: 25 }, (_, idx) => {
    const x = paddingX + (idx / 24) * chartWidth;
    const y = paddingY + 20 + (idx / 24) * 35;
    return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
  }).join(" ");

  return (
    <div className="flex flex-col gap-12 text-on-surface">
      {/* Property Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="font-label-md text-xs text-primary tracking-widest uppercase mb-2 block font-semibold">
            Feasibility Report
          </span>
          <h1 className="font-headline-lg text-3xl font-bold text-on-background font-serif leading-tight">
            {prop?.name ?? "Rooftop Residence"}, {prop?.city ? prop.city.charAt(0).toUpperCase() + prop.city.slice(1) : "Mumbai"}
          </h1>
          <div className="flex items-center gap-4 mt-2 text-stone-500 text-xs font-semibold">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">location_on</span>
              <span>
                {inputs?.latitude?.toFixed(2)}° N, {inputs?.longitude?.toFixed(2)}° E
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">update</span>
              <span>Last Synced: 2 mins ago</span>
            </div>
          </div>
        </div>
        <ReportHeaderActions analysisId={id} />
      </header>

      {/* Bento Grid Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Readiness Assessment Gauges */}
        <section className="md:col-span-4 glass-card p-8 rounded-3xl flex flex-col justify-between">
          <div>
            <h3 className="font-label-md text-xs text-stone-400 uppercase tracking-wider font-semibold mb-6">
              Readiness Assessment
            </h3>
            <div className="space-y-8">
              {/* Score 1: Solar Readiness */}
              <div className="flex items-center justify-between">
                <div className="relative w-20 h-20 flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 96 96">
                    <circle className="text-stone-100" cx="48" cy="48" fill="transparent" r="40" stroke="currentColor" strokeWidth="8"></circle>
                    <circle
                      className="text-primary"
                      cx="48"
                      cy="48"
                      fill="transparent"
                      r="40"
                      stroke="currentColor"
                      strokeDasharray="251"
                      strokeDashoffset={251 - (251 * readinessResult.score) / 100}
                      strokeWidth="8"
                    ></circle>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center font-bold text-base text-primary">
                    {readinessResult.score}
                  </div>
                </div>
                <div className="flex-1 ml-4 text-left">
                  <h4 className="font-bold text-sm text-primary font-serif">Solar Readiness</h4>
                  <p className="text-[11px] text-stone-500 mt-0.5 leading-normal">
                    {readinessResult.score >= 85
                      ? "Excellent rooftop structure and exposure."
                      : "Moderate suitability, some shadows."}
                  </p>
                </div>
              </div>

              {/* Score 2: Health Index */}
              <div className="flex items-center justify-between">
                <div className="relative w-20 h-20 flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 96 96">
                    <circle className="text-stone-100" cx="48" cy="48" fill="transparent" r="40" stroke="currentColor" strokeWidth="8"></circle>
                    <circle
                      className="text-[#6d5e00]"
                      cx="48"
                      cy="48"
                      fill="transparent"
                      r="40"
                      stroke="currentColor"
                      strokeDasharray="251"
                      strokeDashoffset={251 - (251 * healthResult.score) / 100}
                      strokeWidth="8"
                    ></circle>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center font-bold text-base text-[#6d5e00]">
                    {healthResult.score}
                  </div>
                </div>
                <div className="flex-1 ml-4 text-left">
                  <h4 className="font-bold text-sm text-primary font-serif">Health Index</h4>
                  <p className="text-[11px] text-stone-500 mt-0.5 leading-normal">
                    {healthResult.score >= 80
                      ? "Minimal environmental losses. High yield."
                      : "Affected by urban dust and local shading."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Energy Prediction Model (SVG Chart) */}
        <section className="md:col-span-8 glass-card p-8 rounded-3xl overflow-hidden relative text-left">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-label-md text-xs text-stone-400 uppercase tracking-wider font-semibold mb-1">
                Energy Prediction Model
              </h3>
              <h4 className="font-headline-md text-lg font-bold text-primary font-serif">Annual kWh Generation</h4>
            </div>
            <div className="bg-primary/5 px-3 py-1 rounded-lg border border-primary/10">
              <span className="font-label-md text-[10px] uppercase font-bold text-primary">
                ML Confidence: R² {mlResult.modelMetrics.r2.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="h-44 w-full relative mt-4">
            <svg className="w-full h-full fill-none" viewBox="0 0 800 170">
              {/* Grid Lines */}
              {Array.from({ length: 4 }).map((_, i) => {
                const y = paddingY + (i / 3) * chartHeight;
                return (
                  <line
                    key={i}
                    x1={paddingX}
                    y1={y}
                    x2={chartWidth + paddingX}
                    y2={y}
                    className="stroke-stone-100"
                    strokeWidth="1"
                  />
                );
              })}
              {/* Area Fill */}
              <path d={areaPathStr} className="fill-primary/5" />
              {/* Line Path */}
              <polyline points={pointsStr} className="stroke-primary stroke-[2.5]" />
              {/* Points */}
              {points.map((p, idx) => (
                <circle
                  key={idx}
                  cx={p.x}
                  cy={p.y}
                  r="4.5"
                  className="fill-[#fcdf46] stroke-primary stroke-[1.5] cursor-pointer hover:r-6 transition-all"
                />
              ))}
            </svg>
            {/* Months */}
            <div className="absolute bottom-0 w-full flex justify-between font-label-md text-[9px] text-stone-400 px-8 uppercase font-bold">
              <span>Jan</span><span>Mar</span><span>May</span><span>Jul</span><span>Sep</span><span>Nov</span>
            </div>
          </div>
        </section>

        {/* AI Feature Contribution */}
        <section className="md:col-span-5 glass-card p-8 rounded-3xl text-left">
          <h3 className="font-label-md text-xs text-stone-400 uppercase tracking-wider font-semibold mb-6">
            AI Feature Contribution
          </h3>
          <div className="space-y-6">
            {mlResult.featureImportance.map((feat) => {
              const isShading = feat.feature.toLowerCase().includes("shading");
              const isAlbedo = feat.feature.toLowerCase().includes("albedo") || feat.feature.toLowerCase().includes("humidity");
              const colorClass = isShading
                ? "bg-red-500"
                : isAlbedo
                ? "bg-[#fcdf46]"
                : "bg-primary";
              const textClass = isShading
                ? "text-red-650 font-bold"
                : "text-primary font-bold";

              return (
                <div key={feat.feature}>
                  <div className="flex justify-between mb-2 text-xs">
                    <span className="font-semibold capitalize text-stone-700">
                      {feat.feature.replace(/_/g, " ")}
                    </span>
                    <span className={textClass}>
                      {isShading ? "-" : "+"}
                      {(feat.importance * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colorClass}`}
                      style={{ width: `${Math.min(feat.importance * 120, 100)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Financial Quick Stats Grid */}
        <section className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6 text-left self-start">
          <div className="card h-fit border-l-4 border-amber-500">
            <h4 className="metric-label mb-2">
              Recommended System
            </h4>
            <p className="font-headline-md text-xl font-bold text-gray-900 font-serif">
              {formatKwp(solar.system_capacity_kwp)}{" "}
              <span className="text-xs font-normal text-gray-500 font-sans block mt-1">Mono-Perc Technology</span>
            </p>
          </div>

          <div className="card h-fit border-l-4 border-eco-500">
            <h4 className="metric-label mb-2">
              Total Investment
            </h4>
            <p className="font-headline-md text-xl font-bold text-gray-900 font-serif">
              {formatCurrency(financial.net_investment_inr)}{" "}
              <span className="text-xs font-normal text-gray-500 font-sans block mt-1">Net of subsidies</span>
            </p>
          </div>

          <div className="card h-fit border-l-4 border-blue-500">
            <h4 className="metric-label mb-2">
              Payback Period
            </h4>
            <p className="font-headline-md text-xl font-bold text-gray-900 font-serif">
              {formatYears(financial.payback_period_years)}{" "}
              <span className="text-xs font-normal text-gray-500 font-sans block mt-1">Estimated break-even</span>
            </p>
          </div>

          <div className="card h-fit border-l-4 border-gray-400">
            <h4 className="metric-label mb-2">
              Lifetime Savings
            </h4>
            <p className="font-headline-md text-xl font-bold text-gray-900 font-serif">
              {formatCurrency(financial.savings_25yr_inr)}{" "}
              <span className="text-xs font-normal text-gray-500 font-sans block mt-1">Cumulative over 25 Years</span>
            </p>
          </div>
        </section>

        {/* What-If Simulator */}
        <section className="md:col-span-6 flex flex-col">
          <WhatIfSimulator scenarios={whatIfScenarios} />
        </section>

        {/* PM Surya Ghar Subsidy Details */}
        <section className="md:col-span-6 glass-card p-8 rounded-3xl text-left border border-white/40 flex flex-col justify-between overflow-hidden relative shadow-md">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl"></div>
          <div>
            <h3 className="text-base font-bold text-primary tracking-tight mb-6 flex items-center gap-2 border-b border-stone-200/60 pb-3">
              <span className="material-symbols-outlined text-[#d97706]">account_balance</span>
              PM Surya Ghar Subsidy
            </h3>
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-center py-3 border-b border-stone-200/40 text-sm">
                <span className="text-stone-600 font-medium">Central Government (MNRE) Benefit</span>
                <span className="font-bold text-stone-900 font-serif text-base tabular-nums">
                  {formatCurrency(financial.central_subsidy_inr)}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-stone-200/40 text-sm">
                <span className="text-stone-600 font-medium">State Incentive Scheme</span>
                <span className="font-bold text-stone-900 font-serif text-base tabular-nums">
                  {formatCurrency(financial.state_subsidy_inr)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-4">
                <span className="text-base font-bold text-primary">Total Direct Benefit</span>
                <span className="text-amber-800 font-serif text-2xl font-bold tabular-nums">
                  {formatCurrency(financial.central_subsidy_inr + financial.state_subsidy_inr)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-stone-500 mt-8 bg-stone-50/60 p-3.5 rounded-2xl border border-stone-200/40 relative z-10">
            <Info className="w-4 h-4 text-stone-450 shrink-0" />
            <span>Estimated approval time: 4-6 weeks post commissioning</span>
          </div>
        </section>

        {/* 25-Year Projection Chart */}
        <section className="md:col-span-8 glass-card p-8 rounded-3xl text-left">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-label-md text-xs text-stone-400 uppercase tracking-wider font-semibold mb-1">
                Long-term Performance Analysis
              </h3>
              <h4 className="font-headline-md text-lg font-bold text-primary font-serif">Payback & Cumulative Savings</h4>
            </div>
            <div className="text-right">
              <span className="font-serif text-xl text-primary font-bold">
                {formatCurrency(financial.savings_25yr_inr)}
              </span>
              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mt-0.5">Net Profit (25 Yrs)</p>
            </div>
          </div>

          <div className="h-44 w-full relative mt-4">
            <svg className="w-full h-full fill-none" viewBox="0 0 800 170">
              {/* Grid Lines */}
              {Array.from({ length: 4 }).map((_, i) => {
                const y = paddingY + (i / 3) * chartHeight;
                return (
                  <line
                    key={i}
                    x1={paddingX}
                    y1={y}
                    x2={chartWidth + paddingX}
                    y2={y}
                    className="stroke-stone-100"
                    strokeWidth="1"
                  />
                );
              })}
              {/* Area Fill */}
              <path d={csAreaPathStr} className="fill-primary/5" />
              {/* Savings Curve */}
              <polyline points={csPointsStr} className="stroke-primary stroke-[2.5]" />
              {/* Degradation Line */}
              <path d={degPoints} className="stroke-red-400 stroke-[1.5] stroke-dasharray-4 opacity-70" />
            </svg>
            <div className="absolute bottom-0 w-full flex justify-between font-label-md text-[9px] text-stone-400 px-8 uppercase font-bold">
              <span>Year 01</span><span>Year 05</span><span>Year 10</span><span>Year 15</span><span>Year 20</span><span>Year 25</span>
            </div>
          </div>
          <div className="flex items-center gap-6 mt-4 justify-center text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <span className="text-stone-500 font-semibold">Cumulative Net Cash Flow</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <span className="text-stone-500 font-semibold">Annual Panel Degradation (0.5%/yr)</span>
            </div>
          </div>
        </section>

        {/* EMI vs Savings Card */}
        <section className="md:col-span-4 flex flex-col">
          <EMICalculator
            loanAmountInr={financial.net_investment_inr}
            annualSavingsInr={financial.annual_savings_inr}
          />
        </section>
      </div>

      {/* Visual Contextual Break Banner */}
      <section className="mt-6 w-full h-80 rounded-[40px] overflow-hidden relative group shadow-2xl">
        <img
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          alt="Modern terrace solar panels"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuC7V6M4e5P4b95bwwbhZiKU_8ttafQPpAeQYVVJAH1tGeKwQp2C0Qy4on5JgvboLOX8gHaVP7e7ko6Vu3S9PdtiMBk2y-IShUvBPycpcigj-aYY6LgA4zl-yIFFB0qt09QbpSW3GrQF6ScZHVmzhH0B6JQEsrntcHo31QiVdc4wJtWUw7VTwxQX8ZNABJtNwBdPNOhOr1b6hO6tj9BntGO-V1IaiXiUomuEitgWkLVUIgR8fxpnzHzedOh9xe5kkURbfWoYtJg_FWY"
          data-alt="A high-angle architectural photography shot of a luxury Mumbai residence in Bandra West featuring a sleek, high-efficiency solar panel array integrated into the modern terrace design."
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-10 text-left">
          <h2 className="text-white font-headline-lg text-3xl font-bold font-serif">Digital Twin Real-Time Simulation</h2>
          <p className="text-white/80 font-body-lg text-sm max-w-2xl mt-2">
            Visualizing 8,760 hours of annual sunlight trajectory across your specific roof geometry.
          </p>
        </div>
      </section>
    </div>
  );
}
