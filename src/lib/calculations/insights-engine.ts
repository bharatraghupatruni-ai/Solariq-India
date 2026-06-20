/**
 * AI Insights Engine
 * Generates calculation-based quantified impact statements.
 * No LLM APIs — purely calculation-based.
 *
 * Examples:
 * - Heavy shading reduces output by 18%.
 * - Weekly cleaning improves generation by 12%.
 * - Mono panels increase annual savings by ₹6,500.
 */

export interface Insight {
  id: string;
  statement: string;
  category: "positive" | "negative" | "comparison" | "financial" | "environmental";
  metric: string;
  value: number;
  unit: string;
}

export interface InsightsResult {
  insights: Insight[];
  topPositive: Insight[];
  topNegative: Insight[];
  financialInsights: Insight[];
  environmentalInsights: Insight[];
  summary: string;
}

interface InsightsContext {
  shading: "none" | "partial" | "heavy";
  cleaning: "weekly" | "monthly" | "rarely";
  orientation: "south" | "east" | "west" | "north";
  panelType: "mono_perc" | "topcon" | "hjt" | "bifacial" | "mono" | "poly" | "thin_film";
  environment: "clean" | "dusty" | "urban_smog";
  annualGenerationKwh: number;
  electricityRatePerUnit: number;
  annualSavingsInr: number;
  co2OffsetKg: number;
  roofArea: number;
  systemCapacityKwp: number;
}

const SHADING_LOSS: Record<string, number> = { none: 0, partial: 0.10, heavy: 0.18 };
const CLEANING_GAIN: Record<string, number> = { weekly: 0.12, monthly: 0.06, rarely: 0 };
const ORIENTATION_LOSS: Record<string, number> = { south: 0, east: 0.08, west: 0.12, north: 0.20 };
const PANEL_SAVINGS_DIFF: Record<string, number> = {
  mono_perc: 0,
  mono: 0,
  topcon: -1500,
  bifacial: -1500,
  hjt: -2000,
  poly: -3500,
  thin_film: -6500,
};
const PANEL_DISPLAY_NAME: Record<string, string> = {
  mono_perc: "Mono PERC",
  mono: "Mono PERC",
  topcon: "TOPCon",
  bifacial: "Bifacial",
  hjt: "HJT",
  poly: "polycrystalline",
  thin_film: "thin film",
};

export function generateInsights(ctx: InsightsContext): InsightsResult {
  const insights: Insight[] = [];

  // Shading impact
  const shadingLoss = SHADING_LOSS[ctx.shading];
  if (shadingLoss > 0) {
    insights.push({
      id: "ins-shading",
      statement: `${ctx.shading === "heavy" ? "Heavy" : "Partial"} shading reduces output by ${Math.round(shadingLoss * 100)}%.`,
      category: "negative",
      metric: "shading_loss",
      value: Math.round(shadingLoss * 100),
      unit: "%",
    });
  } else {
    insights.push({
      id: "ins-no-shading",
      statement: "No shading — your panels operate at maximum potential.",
      category: "positive",
      metric: "shading_gain",
      value: 0,
      unit: "%",
    });
  }

  // Cleaning impact
  const cleaningGain = CLEANING_GAIN[ctx.cleaning];
  if (cleaningGain > 0) {
    insights.push({
      id: "ins-cleaning",
      statement: `${ctx.cleaning === "weekly" ? "Weekly" : "Monthly"} cleaning improves generation by ${Math.round(cleaningGain * 100)}%.`,
      category: "positive",
      metric: "cleaning_gain",
      value: Math.round(cleaningGain * 100),
      unit: "%",
    });
  } else {
    insights.push({
      id: "ins-rare-clean",
      statement: "Rare cleaning may reduce generation by up to 8% due to dust.",
      category: "negative",
      metric: "dust_loss",
      value: 8,
      unit: "%",
    });
  }

  // Orientation impact
  const orientLoss = ORIENTATION_LOSS[ctx.orientation];
  if (orientLoss > 0) {
    insights.push({
      id: "ins-orientation",
      statement: `${ctx.orientation.charAt(0).toUpperCase() + ctx.orientation.slice(1)}-facing roof loses ~${Math.round(orientLoss * 100)}% vs south-facing.`,
      category: "negative",
      metric: "orientation_loss",
      value: Math.round(orientLoss * 100),
      unit: "%",
    });
  } else {
    insights.push({
      id: "ins-south-optimal",
      statement: "South-facing roof is optimal for India — maximum generation potential.",
      category: "positive",
      metric: "orientation_optimal",
      value: 15,
      unit: "%",
    });
  }

  // Panel type comparison
  const panelSavingsDiff = PANEL_SAVINGS_DIFF[ctx.panelType] ?? 0;
  if (panelSavingsDiff !== 0) {
    const betterPanel = ctx.panelType === "poly" || ctx.panelType === "thin_film"
      ? "Mono PERC"
      : "next-generation";
    insights.push({
      id: "ins-panel-compare",
      statement: `${betterPanel} panels increase annual savings by ₹${Math.abs(panelSavingsDiff).toLocaleString("en-IN")} over ${PANEL_DISPLAY_NAME[ctx.panelType] ?? ctx.panelType}.`,
      category: "comparison",
      metric: "panel_savings_diff",
      value: Math.abs(panelSavingsDiff),
      unit: "INR",
    });
  }

  // Financial insights
  insights.push({
    id: "ins-annual-savings",
    statement: `Annual savings of ₹${(ctx.annualSavingsInr / 1000).toFixed(1)}K at ₹${ctx.electricityRatePerUnit}/kWh tariff.`,
    category: "financial",
    metric: "annual_savings",
    value: ctx.annualSavingsInr,
    unit: "INR",
  });

  insights.push({
    id: "ins-co2-offset",
    statement: `Your system offsets ${(ctx.co2OffsetKg / 1000).toFixed(2)} tonnes of CO₂ annually — equivalent to ${Math.round(ctx.co2OffsetKg / 21.77)} trees.`,
    category: "environmental",
    metric: "co2_offset",
    value: ctx.co2OffsetKg,
    unit: "kg",
  });

  // Capacity insight
  insights.push({
    id: "ins-capacity",
    statement: `${ctx.systemCapacityKwp.toFixed(2)} kWp system on ${ctx.roofArea} m² roof generates ${Math.round(ctx.annualGenerationKwh).toLocaleString("en-IN")} kWh/year.`,
    category: "financial",
    metric: "capacity_utilization",
    value: ctx.annualGenerationKwh,
    unit: "kWh",
  });

  // Environment insight
  if (ctx.environment !== "clean") {
    const envLoss = ctx.environment === "dusty" ? 5 : 8;
    insights.push({
      id: "ins-environment",
      statement: `${ctx.environment === "dusty" ? "Dusty environment" : "Urban smog"} reduces output by ~${envLoss}%. Consider anti-soiling coating.`,
      category: "negative",
      metric: "environment_loss",
      value: envLoss,
      unit: "%",
    });
  }

  const topPositive = insights.filter((i) => i.category === "positive").slice(0, 3);
  const topNegative = insights.filter((i) => i.category === "negative").slice(0, 3);
  const financialInsights = insights.filter((i) => i.category === "financial" || i.category === "comparison");
  const environmentalInsights = insights.filter((i) => i.category === "environmental");

  const positiveCount = topPositive.length;
  const negativeCount = topNegative.length;
  const summary = positiveCount > negativeCount
    ? "Your rooftop has strong solar potential. Address minor optimizations to maximize returns."
    : negativeCount > positiveCount
    ? "Several factors reduce your solar output. Address these constraints for better returns."
    : "Your rooftop has balanced pros and cons. Consider recommended optimizations for best results.";

  return {
    insights,
    topPositive,
    topNegative,
    financialInsights,
    environmentalInsights,
    summary,
  };
}
