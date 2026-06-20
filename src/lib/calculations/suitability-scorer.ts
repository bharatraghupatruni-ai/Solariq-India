import type { RecommendationLevel } from "@/lib/types/database";
import type { SolarGenerationResult } from "./solar-engine";
import type { FinancialResult } from "./financial-engine";

export interface SuitabilityInput {
  roofAreaSqm: number;
  usableAreaSqm: number;
  shadingFactor: number;
  peakSunHoursDaily: number;
  tiltAngle: number;
  financialResult: FinancialResult;
  solarResult: SolarGenerationResult;
  state: string;
  propertyType: string;
}

export interface SuitabilityResult {
  overallScore: number;
  roofQualityScore: number;
  solarResourceScore: number;
  financialViabilityScore: number;
  policyEnvironmentScore: number;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  recommendation: string;
  recommendationLevel: RecommendationLevel;
}

export function calculateSuitabilityScore(
  input: SuitabilityInput
): SuitabilityResult {
  const roofScore = scoreRoofQuality(input);
  const solarScore = scoreSolarResource(input);
  const financialScore = scoreFinancialViability(input);
  const policyScore = scorePolicyEnvironment(input);

  const overallScore = Math.round(
    roofScore * 0.25 +
    solarScore * 0.30 +
    financialScore * 0.35 +
    policyScore * 0.10
  );

  const { strengths, weaknesses, opportunities } = analyzeFactors(input, {
    roofScore,
    solarScore,
    financialScore,
    policyScore,
  });

  const { level, recommendation } = getRecommendation(overallScore, input);

  return {
    overallScore,
    roofQualityScore: roofScore,
    solarResourceScore: solarScore,
    financialViabilityScore: financialScore,
    policyEnvironmentScore: policyScore,
    strengths,
    weaknesses,
    opportunities,
    recommendation,
    recommendationLevel: level,
  };
}

function scoreRoofQuality(input: SuitabilityInput): number {
  let score = 0;

  // Usable area ratio (0-40 points)
  const usableRatio = input.usableAreaSqm / input.roofAreaSqm;
  score += usableRatio >= 0.7 ? 40 : usableRatio >= 0.5 ? 30 : usableRatio >= 0.35 ? 20 : 10;

  // Shading factor (0-30 points)
  score += input.shadingFactor <= 0.05 ? 30 : input.shadingFactor <= 0.15 ? 22 : input.shadingFactor <= 0.3 ? 12 : 4;

  // Tilt angle (0-30 points)
  const optimalRange = input.tiltAngle >= 10 && input.tiltAngle <= 30;
  score += optimalRange ? 30 : input.tiltAngle >= 5 && input.tiltAngle <= 40 ? 20 : 10;

  return Math.min(100, score);
}

function scoreSolarResource(input: SuitabilityInput): number {
  let score = 0;

  // Peak sun hours (0-60 points)
  const psh = input.peakSunHoursDaily;
  score += psh >= 5.5 ? 60 : psh >= 5.0 ? 50 : psh >= 4.5 ? 38 : psh >= 4.0 ? 26 : 14;

  // System capacity (0-25 points)
  const cap = input.solarResult.systemCapacityKwp;
  score += cap >= 5 ? 25 : cap >= 3 ? 20 : cap >= 2 ? 15 : cap >= 1 ? 10 : 5;

  // Annual generation (0-15 points)
  const gen = input.solarResult.annualGenerationKwh;
  score += gen >= 8000 ? 15 : gen >= 5000 ? 12 : gen >= 3000 ? 9 : gen >= 1000 ? 6 : 3;

  return Math.min(100, score);
}

function scoreFinancialViability(input: SuitabilityInput): number {
  let score = 0;
  const fin = input.financialResult;

  // Payback period (0-40 points)
  const pb = fin.paybackPeriodYears;
  score += pb <= 4 ? 40 : pb <= 6 ? 33 : pb <= 8 ? 24 : pb <= 12 ? 14 : 5;

  // ROI (0-30 points)
  const roi = fin.roiPercentage;
  score += roi >= 200 ? 30 : roi >= 100 ? 24 : roi >= 50 ? 16 : roi >= 20 ? 9 : 3;

  // Subsidy availability (0-15 points)
  score += fin.centralSubsidyInr > 0 ? 10 : 0;
  score += fin.stateSubsidyInr > 0 ? 5 : 0;

  // Net investment feasibility (0-15 points)
  const invLakhs = fin.netInvestmentInr / 100000;
  score += invLakhs <= 1.5 ? 15 : invLakhs <= 3 ? 12 : invLakhs <= 5 ? 9 : invLakhs <= 10 ? 6 : 3;

  return Math.min(100, score);
}

function scorePolicyEnvironment(input: SuitabilityInput): number {
  let score = 50; // Base score

  // Property type bonus
  if (input.propertyType === "residential") score += 30;
  else if (input.propertyType === "commercial") score += 20;

  // State-specific bonus (high solar states)
  const highSolarStates = ["rajasthan", "gujarat", "andhra_pradesh", "telangana", "madhya_pradesh"];
  if (highSolarStates.includes(input.state)) score += 20;

  return Math.min(100, score);
}

function analyzeFactors(
  input: SuitabilityInput,
  scores: Record<string, number>
) {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const opportunities: string[] = [];

  if (input.peakSunHoursDaily >= 5.5) strengths.push("Excellent solar irradiance in your location");
  if (scores.roofQualityScore >= 75) strengths.push("Good rooftop quality with minimal obstructions");
  if (input.financialResult.paybackPeriodYears <= 5) strengths.push("Quick payback period under 5 years");
  if (input.financialResult.centralSubsidyInr > 0) strengths.push("Eligible for PM Surya Ghar central subsidy");
  if (input.financialResult.irrPercentage >= 20) strengths.push(`Strong IRR of ${input.financialResult.irrPercentage.toFixed(1)}%`);

  if (input.shadingFactor > 0.2) weaknesses.push("Significant shading may reduce generation by up to " + Math.round(input.shadingFactor * 100) + "%");
  if (input.usableAreaSqm < 15) weaknesses.push("Limited usable roof area constrains system size");
  if (input.peakSunHoursDaily < 4.5) weaknesses.push("Below-average solar irradiance for your location");
  if (input.financialResult.paybackPeriodYears > 10) weaknesses.push("Long payback period above 10 years");

  opportunities.push("Electricity tariffs in India rise ~6% annually, improving ROI over time");
  if (input.financialResult.stateSubsidyInr === 0) opportunities.push("Check with your state DISCOM for additional incentives");
  opportunities.push(`Net metering allows exporting ${Math.round(input.financialResult.unitsExportedAnnual)} units/year back to grid`);
  opportunities.push(`Offset ${Math.round(input.financialResult.co2OffsetAnnualKg / 1000)} tonnes of CO₂ annually`);

  return { strengths, weaknesses, opportunities };
}

function getRecommendation(
  score: number,
  input: SuitabilityInput
): { level: RecommendationLevel; recommendation: string } {
  if (score >= 75) {
    return {
      level: "highly_recommended",
      recommendation: `Your property scores ${score}/100 — an excellent candidate for rooftop solar. With a payback period of ${input.financialResult.paybackPeriodYears.toFixed(1)} years and lifetime savings of ₹${(input.financialResult.savings25yrInr / 100000).toFixed(1)} lakhs, the investment makes strong financial sense.`,
    };
  }
  if (score >= 55) {
    return {
      level: "recommended",
      recommendation: `Your property scores ${score}/100 — a good candidate for rooftop solar. The returns are positive and installation is recommended, particularly if you have a long-term horizon.`,
    };
  }
  if (score >= 35) {
    return {
      level: "marginal",
      recommendation: `Your property scores ${score}/100 — solar is viable but with some constraints. Consider addressing shading issues or upgrading to higher-efficiency panels to improve returns.`,
    };
  }
  return {
    level: "not_recommended",
    recommendation: `Your property scores ${score}/100 — solar may not be the most cost-effective choice currently. Key challenges include limited roof space or inadequate sunlight. We recommend reassessing in 2-3 years as technology costs decline.`,
  };
}
