/**
 * Solar Readiness Score Engine
 * Calibrated 0-100 score with weighted factors
 *
 * Weights:
 * - Solar Resource: 30%
 * - Orientation: 20%
 * - Shading: 20%
 * - Roof Area: 10%
 * - Cleaning: 5%
 * - Environment: 5%
 * - Panel Type: 10%
 *
 * Score Ranges:
 * - >85: Ideal (Excellent solar potential)
 * - 70-85: Good (Good solar potential)
 * - 50-70: Moderate (Some constraints)
 * - 30-50: Poor (Multiple constraints)
 * - <30: Very Poor (Not recommended)
 */

export interface SolarReadinessInput {
  orientation: "south" | "east" | "west" | "north";
  shading: "none" | "partial" | "heavy";
  roofArea: number; // sqm
  cleaning: "weekly" | "monthly" | "rarely";
  panelType: "mono_perc" | "topcon" | "hjt" | "bifacial" | "poly" | "thin_film";
  environment: "clean" | "dusty" | "urban_smog";
  solarResource: number; // kWh/m²/year (from NASA)
}

export interface SolarReadinessScore {
  score: number;
  category: "excellent" | "good" | "moderate" | "poor" | "very_poor";
  color: string;
  details: {
    solarResourceScore: number;
    orientationScore: number;
    shadingScore: number;
    roofAreaScore: number;
    cleaningScore: number;
    environmentScore: number;
    panelTypeScore: number;
  };
  verdict: string;
  recommendation: string;
}

const ORIENTATION_BONUS: Record<string, number> = {
  south: 20,
  east: 14,
  west: 10,
  north: 4,
};

const SHADING_BONUS: Record<string, number> = {
  none: 20,
  partial: 12,
  heavy: 5,
};

const CLEANING_BONUS: Record<string, number> = {
  weekly: 5,
  monthly: 3,
  rarely: 1,
};

const ENVIRONMENT_BONUS: Record<string, number> = {
  clean: 5,
  dusty: 3,
  urban_smog: 2,
};

const PANEL_TYPE_BONUS: Record<string, number> = {
  hjt: 10,
  topcon: 9,
  bifacial: 9,
  mono_perc: 8,
  mono: 8,
  poly: 5,
  thin_film: 3,
};

function calculateSolarResourceScore(resource: number): number {
  if (resource > 2200) return 30; // Excellent solar zone
  if (resource > 1900) return 26; // High solar
  if (resource > 1600) return 22; // Moderate solar
  if (resource > 1300) return 16; // Low-moderate
  return 10; // Very low
}

function calculateRoofAreaScore(area: number): number {
  if (area > 500) return 10;      // Excellent
  if (area > 150) return 9;       // Very good
  if (area > 80) return 8;        // Good
  if (area > 50) return 7;        // Moderate
  if (area > 30) return 6;        // Limited
  if (area > 20) return 5;        // Small
  if (area > 10) return 4;        // Very small
  return 3;                       // Minimal
}

function getCategory(score: number): { category: SolarReadinessScore["category"]; color: string } {
  if (score >= 85) return { category: "excellent", color: "#10b981" }; // emerald-500
  if (score >= 70) return { category: "good", color: "#22c55e" };     // green-500
  if (score >= 50) return { category: "moderate", color: "#f59e0b" }; // amber-500
  if (score >= 30) return { category: "poor", color: "#f97316" };       // orange-500
  return { category: "very_poor", color: "#ef4444" };                   // red-500
}

function getVerdict(score: number): { verdict: string; recommendation: string } {
  if (score >= 85) {
    return {
      verdict: "Excellent Solar Potential",
      recommendation: "Your rooftop is an excellent candidate for solar. Install solar panels immediately.",
    };
  }
  if (score >= 70) {
    return {
      verdict: "Good Solar Potential",
      recommendation: "Your rooftop has good solar potential. Solar installation is strongly recommended.",
    };
  }
  if (score >= 50) {
    return {
      verdict: "Moderate Solar Potential",
      recommendation: "Solar is feasible but has some constraints. Consider optimization strategies.",
    };
  }
  if (score >= 30) {
    return {
      verdict: "Poor Solar Potential",
      recommendation: "Solar may not be cost-effective right now. Address constraints before proceeding.",
    };
  }
  return {
    verdict: "Very Poor Solar Potential",
    recommendation: "Solar installation is not recommended at this time due to multiple constraints.",
  };
}

export function calculateSolarReadinessScore(
  input: SolarReadinessInput,
): SolarReadinessScore {
  const solarResourceScore = calculateSolarResourceScore(input.solarResource);
  const orientationScore = ORIENTATION_BONUS[input.orientation] ?? 0;
  const shadingScore = SHADING_BONUS[input.shading] ?? 0;
  const roofAreaScore = calculateRoofAreaScore(input.roofArea);
  const cleaningScore = CLEANING_BONUS[input.cleaning] ?? 0;
  const environmentScore = ENVIRONMENT_BONUS[input.environment] ?? 0;
  const panelTypeScore = PANEL_TYPE_BONUS[input.panelType] ?? 0;

  const totalScore =
    solarResourceScore +
    orientationScore +
    shadingScore +
    roofAreaScore +
    cleaningScore +
    environmentScore +
    panelTypeScore;

  const clampedScore = Math.min(100, Math.max(0, totalScore));
  const { category, color } = getCategory(clampedScore);
  const { verdict, recommendation } = getVerdict(clampedScore);

  return {
    score: clampedScore,
    category,
    color,
    details: {
      solarResourceScore,
      orientationScore,
      shadingScore,
      roofAreaScore,
      cleaningScore,
      environmentScore,
      panelTypeScore,
    },
    verdict,
    recommendation,
  };
}

// Calibrated score validation per requirements:
// - Worst (North, Heavy Shading, Rare, Thin Film) < 40
// - Medium (East, Partial, Monthly) = 50-70
// - Ideal (South, No Shading, Weekly, Mono) > 85

export function validateScoreRanges(): boolean {
  // Worst case
  const worst = calculateSolarReadinessScore({
    orientation: "north",
    shading: "heavy",
    roofArea: 30,
    cleaning: "rarely",
    panelType: "thin_film",
    environment: "urban_smog",
    solarResource: 1200,
  });
  console.assert(worst.score < 40, `Worst case score ${worst.score} should be < 40`);

  // Medium case
  const medium = calculateSolarReadinessScore({
    orientation: "east",
    shading: "partial",
    roofArea: 75,
    cleaning: "monthly",
    panelType: "poly",
    environment: "dusty",
    solarResource: 1700,
  });
  console.assert(medium.score >= 50 && medium.score <= 70, `Medium score ${medium.score} should be 50-70`);

  // Ideal case
  const ideal = calculateSolarReadinessScore({
    orientation: "south",
    shading: "none",
    roofArea: 120,
    cleaning: "weekly",
    panelType: "mono_perc",
    environment: "clean",
    solarResource: 2100,
  });
  console.assert(ideal.score > 85, `Ideal score ${ideal.score} should be > 85`);

  return true;
}
