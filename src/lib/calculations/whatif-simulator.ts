/**
 * What-if Simulator
 * Compare current configuration vs alternative scenarios
 *
 * Scenarios:
 * - vs Mono Panel
 * - vs Reduced Shading
 * - vs Weekly Cleaning
 * - vs Ideal Roof
 *
 * Shows: Generation, Savings, ROI, CO₂ differences
 */

import { calculateSolarGeneration } from "./solar-engine";
import { calculateFinancials } from "./financial-engine";
import type { PanelType } from "@/lib/types/database";
import { PANEL_SPECS } from "@/lib/constants/panels";

export interface WhatIfScenario {
  id: string;
  label: string;
  description: string;
  dailyGenerationKwh: number;
  annualGenerationKwh: number;
  annualSavingsInr: number;
  paybackYears: number;
  roiPercentage: number;
  co2OffsetKg: number;
  generationDiff: number;
  savingsDiff: number;
  roiDiff: number;
  co2Diff: number;
  color: string;
}

export interface WhatIfInput {
  roofAreaSqm: number;
  peakSunHoursDaily: number;
  latitude: number;
  monthlyGhi: number[];
  electricityRatePerUnit: number;
  state: string;
  propertyType: string;
  // Current config
  currentPanelType: PanelType;
  currentShadingFactor: number;
  currentCleaning: "weekly" | "monthly" | "rarely";
  currentOrientation: "south" | "east" | "west" | "north";
}

const CLEANING_PERF: Record<string, number> = { weekly: 0.02, monthly: 0.04, rarely: 0.08 };
const ORIENTATION_FACTOR: Record<string, number> = { south: 1.0, east: 0.97, west: 0.93, north: 0.75 };

function scenarioResult(
  input: WhatIfInput,
  panelType: PanelType,
  shadingFactor: number,
  cleaningLoss: number,
  orientFactor: number,
  label: string,
  description: string,
  color: string,
  baseline: { generation: number; savings: number; roi: number; co2: number },
): WhatIfScenario {
  const solar = calculateSolarGeneration({
    roofAreaSqm: input.roofAreaSqm,
    usableAreaRatio: 0.70,
    peakSunHoursDaily: input.peakSunHoursDaily,
    systemEfficiency: 0.80 * (1 - cleaningLoss) * orientFactor * (1 - shadingFactor),
    panelType,
    latitude: input.latitude,
    shadingFactor,
    tiltAngle: 15,
    azimuthAngle: input.currentOrientation === "south" ? 180 : input.currentOrientation === "east" ? 90 : input.currentOrientation === "west" ? 270 : 0,
    monthlyGhi: input.monthlyGhi,
  });

  const financial = calculateFinancials({
    capacityKwp: solar.systemCapacityKwp,
    annualGenerationKwh: solar.annualGenerationKwh,
    electricityRatePerUnit: input.electricityRatePerUnit,
    state: input.state,
    propertyType: input.propertyType as "residential",
    costPerKwp: PANEL_SPECS[panelType]?.costPerKwp ?? 45000,
    electricityInflationRate: 0.06,
    discountRate: 0.08,
    degradationRate: 0.005,
  });

  return {
    id: label.toLowerCase().replace(/\s+/g, "-"),
    label,
    description,
    dailyGenerationKwh: solar.dailyGenerationKwh,
    annualGenerationKwh: solar.annualGenerationKwh,
    annualSavingsInr: financial.annualSavingsInr,
    paybackYears: financial.paybackPeriodYears,
    roiPercentage: financial.roiPercentage,
    co2OffsetKg: financial.co2OffsetAnnualKg,
    generationDiff: solar.annualGenerationKwh - baseline.generation,
    savingsDiff: financial.annualSavingsInr - baseline.savings,
    roiDiff: financial.roiPercentage - baseline.roi,
    co2Diff: financial.co2OffsetAnnualKg - baseline.co2,
    color,
  };
}

export function runWhatIfSimulations(input: WhatIfInput): WhatIfScenario[] {
  // Baseline: current configuration
  const baseline = (() => {
    const cleaningLoss = CLEANING_PERF[input.currentCleaning] ?? 0.04;
    const orientFactor = ORIENTATION_FACTOR[input.currentOrientation] ?? 0.85;
    const solar = calculateSolarGeneration({
      roofAreaSqm: input.roofAreaSqm,
      usableAreaRatio: 0.70,
      peakSunHoursDaily: input.peakSunHoursDaily,
      systemEfficiency: 0.80 * (1 - cleaningLoss) * orientFactor * (1 - input.currentShadingFactor),
      panelType: input.currentPanelType,
      latitude: input.latitude,
      shadingFactor: input.currentShadingFactor,
      tiltAngle: 15,
      azimuthAngle: 180,
      monthlyGhi: input.monthlyGhi,
    });
    const financial = calculateFinancials({
      capacityKwp: solar.systemCapacityKwp,
      annualGenerationKwh: solar.annualGenerationKwh,
      electricityRatePerUnit: input.electricityRatePerUnit,
      state: input.state,
      propertyType: input.propertyType as "residential",
      costPerKwp: PANEL_SPECS[input.currentPanelType]?.costPerKwp ?? 45000,
      electricityInflationRate: 0.06,
      discountRate: 0.08,
      degradationRate: 0.005,
    });
    return {
      generation: solar.annualGenerationKwh,
      savings: financial.annualSavingsInr,
      roi: financial.roiPercentage,
      co2: financial.co2OffsetAnnualKg,
    };
  })();

  const base = { generation: baseline.generation, savings: baseline.savings, roi: baseline.roi, co2: baseline.co2 };

  const scenarios: WhatIfScenario[] = [];

  // Scenario: Mono Panel upgrade
  if (input.currentPanelType !== "mono_perc") {
    scenarios.push(
      scenarioResult(input, "mono_perc", input.currentShadingFactor, CLEANING_PERF[input.currentCleaning] ?? 0.04, ORIENTATION_FACTOR[input.currentOrientation] ?? 0.85, "Mono PERC Panels", "Upgrade to high-efficiency Mono PERC panels", "#3b82f6", base),
    );
  }

  // Scenario: Reduced Shading
  if (input.currentShadingFactor > 0.05) {
    scenarios.push(
      scenarioResult(input, input.currentPanelType, 0.05, CLEANING_PERF[input.currentCleaning] ?? 0.04, ORIENTATION_FACTOR[input.currentOrientation] ?? 0.85, "Reduced Shading", "Trim trees and remove rooftop obstacles", "#10b981", base),
    );
  }

  // Scenario: Weekly Cleaning
  if (input.currentCleaning !== "weekly") {
    scenarios.push(
      scenarioResult(input, input.currentPanelType, input.currentShadingFactor, 0.02, ORIENTATION_FACTOR[input.currentOrientation] ?? 0.85, "Weekly Cleaning", "Clean panels every week for maximum output", "#f59e0b", base),
    );
  }

  // Scenario: Ideal Roof
  scenarios.push(
    scenarioResult(input, "mono_perc", 0.05, 0.02, 1.0, "Ideal Roof", "South-facing, no shading, weekly cleaning, Mono PERC", "#8b5cf6", base),
  );

  return scenarios;
}
