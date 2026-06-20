import type { PanelType } from "@/lib/types/database";
import type { SolarCalculationInput } from "@/lib/types/analysis";
import {
  PANEL_SPECS,
  PANEL_AREA_SQM,
  DEFAULT_USABLE_AREA_RATIO,
  DEFAULT_SYSTEM_EFFICIENCY,
  PANEL_DEGRADATION_RATE,
  INVERTER_EFFICIENCY,
  WIRING_LOSSES,
  SOILING_LOSS,
} from "@/lib/constants/panels";

export interface SolarGenerationResult {
  panelCount: number;
  systemCapacityKwp: number;
  dailyGenerationKwh: number;
  monthlyGenerationKwh: number;
  annualGenerationKwh: number;
  lifetimeGenerationKwh: number;
  systemEfficiencyPct: number;
  performanceRatio: number;
  monthlyBreakdown: number[];
  yearlyProjections: number[];
  year1Kwh: number;
  year5Kwh: number;
  year10Kwh: number;
  year25Kwh: number;
}

export function calculateSolarGeneration(
  input: SolarCalculationInput
): SolarGenerationResult {
  const panel = PANEL_SPECS[input.panelType];
  const usableArea = input.roofAreaSqm * (input.usableAreaRatio ?? DEFAULT_USABLE_AREA_RATIO);
  const panelCount = Math.floor(usableArea / PANEL_AREA_SQM);
  const systemCapacityKwp = (panelCount * panel.wattage) / 1000;

  // Tilt angle efficiency factor (optimal ~15-25° for India)
  const tiltFactor = calculateTiltFactor(input.tiltAngle, input.latitude);

  // Azimuth factor (south-facing is optimal in India)
  const azimuthFactor = calculateAzimuthFactor(input.azimuthAngle);

  // Shading reduction
  const shadingFactor = 1 - (input.shadingFactor ?? 0);

  // Overall performance ratio
  const performanceRatio =
    INVERTER_EFFICIENCY * (1 - WIRING_LOSSES) * (1 - SOILING_LOSS) * shadingFactor;

  const systemEfficiency =
    input.systemEfficiency ?? DEFAULT_SYSTEM_EFFICIENCY;

  const peakSunHours = input.peakSunHoursDaily;

  const dailyGenerationKwh =
    systemCapacityKwp *
    peakSunHours *
    systemEfficiency *
    tiltFactor *
    azimuthFactor *
    performanceRatio;

  const annualGenerationKwh = dailyGenerationKwh * 365;

  // Monthly breakdown using GHI seasonality
  const monthlyBreakdown = calculateMonthlyBreakdown(
    annualGenerationKwh,
    input.monthlyGhi
  );

  // 25-year degradation projections
  const yearlyProjections = Array.from({ length: 25 }, (_, i) =>
    annualGenerationKwh * Math.pow(1 - PANEL_DEGRADATION_RATE, i)
  );

  return {
    panelCount,
    systemCapacityKwp,
    dailyGenerationKwh,
    monthlyGenerationKwh: dailyGenerationKwh * 30,
    annualGenerationKwh,
    lifetimeGenerationKwh: yearlyProjections.reduce((a, b) => a + b, 0),
    systemEfficiencyPct: systemEfficiency * 100,
    performanceRatio,
    monthlyBreakdown,
    yearlyProjections,
    year1Kwh: yearlyProjections[0],
    year5Kwh: yearlyProjections[4],
    year10Kwh: yearlyProjections[9],
    year25Kwh: yearlyProjections[24],
  };
}

function calculateTiltFactor(tiltAngle: number, latitude: number): number {
  // Optimal tilt ≈ latitude for India; penalty away from optimal
  const optimalTilt = Math.abs(latitude);
  const deviation = Math.abs(tiltAngle - optimalTilt);
  if (deviation <= 5) return 1.0;
  if (deviation <= 15) return 0.97;
  if (deviation <= 25) return 0.93;
  return 0.88;
}

function calculateAzimuthFactor(azimuthAngle: number): number {
  // 180° = true south (optimal for India)
  const deviation = Math.abs(azimuthAngle - 180);
  if (deviation <= 15) return 1.0;
  if (deviation <= 30) return 0.97;
  if (deviation <= 45) return 0.93;
  if (deviation <= 90) return 0.85;
  return 0.75;
}

function calculateMonthlyBreakdown(
  annualKwh: number,
  monthlyGhi: number[]
): number[] {
  if (!monthlyGhi || monthlyGhi.length !== 12) {
    // Uniform distribution fallback
    return Array(12).fill(annualKwh / 12);
  }
  const totalGhi = monthlyGhi.reduce((a, b) => a + b, 0);
  return monthlyGhi.map((ghi) => (ghi / totalGhi) * annualKwh);
}

export function selectOptimalPanelType(
  roofAreaSqm: number,
  budget: number,
  latitude: number
): PanelType {
  const isHotClimate = latitude < 20;
  const isSmallRoof = roofAreaSqm < 25;
  const isPremiumBudget = budget > 300000;

  if (isHotClimate && isPremiumBudget) return "hjt";
  if (isSmallRoof) return "topcon";
  if (isPremiumBudget) return "topcon";
  return "mono_perc";
}
