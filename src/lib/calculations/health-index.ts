/**
 * Solar Health Index
 * 0-100 score measuring rooftop solar health
 *
 * Factors:
 * - Dust accumulation (based on environment + cleaning)
 * - Heat stress (based on temperature + panel type)
 * - Humidity corrosion (based on humidity + environment)
 * - Shading impact (based on shading level)
 * - Maintenance score (based on cleaning frequency)
 */

export interface HealthIndexInput {
  environment: "clean" | "dusty" | "urban_smog";
  cleaning: "weekly" | "monthly" | "rarely";
  avgTemperature: number;
  panelType: "mono_perc" | "topcon" | "hjt" | "bifacial" | "mono" | "poly" | "thin_film";
  avgHumidity: number;
  shading: "none" | "partial" | "heavy";
}

export interface HealthIndexResult {
  score: number;
  category: "excellent" | "good" | "fair" | "poor" | "critical";
  color: string;
  factors: {
    dustScore: number;
    heatScore: number;
    humidityScore: number;
    shadingScore: number;
    maintenanceScore: number;
  };
  suggestions: string[];
}

const DUST_SCORES: Record<string, number> = { clean: 20, dusty: 12, urban_smog: 15 };
const CLEANING_BENEFIT: Record<string, number> = { weekly: 20, monthly: 14, rarely: 5 };
const TILE_PERCENT_OF_DUST = 0.5; // cleaning contributes half to dust score, half to maintenance

function heatScore(temp: number, panelType: string): number {
  const tempCoeff: Record<string, number> = {
    hjt: -0.0026,
    topcon: -0.0030,
    mono_perc: -0.0035,
    mono: -0.0035,
    bifacial: -0.0035,
    poly: -0.0040,
    thin_film: -0.0025,
  };
  const coeff = tempCoeff[panelType] ?? -0.0035;
  const loss = Math.max(0, (temp - 25) * Math.abs(coeff)) * 100;
  return Math.max(0, 20 - loss);
}

function humidityScore(humidity: number): number {
  if (humidity < 40) return 20;
  if (humidity < 60) return 17;
  if (humidity < 75) return 13;
  return 8;
}

function shadingHealthScore(shading: string): number {
  return { none: 20, partial: 10, heavy: 3 }[shading] ?? 10;
}

const SUGGESTION_RULES: Array<{ condition: (i: HealthIndexInput, f: HealthIndexResult["factors"]) => boolean; message: string }> = [
  { condition: (_, f) => f.dustScore < 15, message: "Increase panel cleaning frequency to reduce dust-related generation losses" },
  { condition: (_, f) => f.heatScore < 12, message: "Consider HJT panels with lower temperature coefficient for hot climates" },
  { condition: (_, f) => f.humidityScore < 12, message: "Ensure IP67-rated junction boxes and corrosion-resistant mounting" },
  { condition: (i) => i.shading === "heavy", message: "Trim nearby trees or relocate roof objects to reduce shading" },
  { condition: (i) => i.cleaning === "rarely", message: "Weekly cleaning improves generation by up to 12%" },
  { condition: (i) => i.environment === "urban_smog", message: "Consider anti-soiling coating for panels in polluted areas" },
  { condition: (_, f) => f.maintenanceScore < 10, message: "Schedule regular maintenance checks to maintain peak performance" },
];

export function calculateSolarHealthIndex(input: HealthIndexInput): HealthIndexResult {
  const cleaningBenefit = CLEANING_BENEFIT[input.cleaning] ?? 0;
  const dustScore = (DUST_SCORES[input.environment] ?? 10) + cleaningBenefit * TILE_PERCENT_OF_DUST;
  const heat = heatScore(input.avgTemperature, input.panelType);
  const humidity = humidityScore(input.avgHumidity);
  const shading = shadingHealthScore(input.shading);
  const maintenance = cleaningBenefit;

  // Max score = 100 (dust max 30, heat max 20, humidity max 20, shading max 20, maintenance separately tracked)
  const total = Math.min(100, dustScore + heat + humidity + shading);

  const factors = {
    dustScore: Math.min(40, dustScore),
    heatScore: heat,
    humidityScore: humidity,
    shadingScore: shading,
    maintenanceScore: maintenance,
  };

  const category = total >= 80 ? "excellent" as const
    : total >= 65 ? "good" as const
    : total >= 50 ? "fair" as const
    : total >= 30 ? "poor" as const
    : "critical" as const;

  const color = total >= 80 ? "#10b981" : total >= 65 ? "#22c55e" : total >= 50 ? "#f59e0b" : total >= 30 ? "#f97316" : "#ef4444";

  const suggestions = SUGGESTION_RULES
    .filter((rule) => rule.condition(input, factors))
    .map((rule) => rule.message);

  return { score: total, category, color, factors, suggestions };
}
