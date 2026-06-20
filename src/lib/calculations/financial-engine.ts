import type { PropertyType } from "@/lib/types/database";
import type { FinancialCalculationInput } from "@/lib/types/analysis";
import { INDIAN_STATES, GRID_EMISSION_FACTOR } from "@/lib/constants/states";
import { PANEL_SPECS } from "@/lib/constants/panels";

export interface FinancialResult {
  grossInstallationCostInr: number;
  centralSubsidyInr: number;
  stateSubsidyInr: number;
  netInvestmentInr: number;
  annualSavingsInr: number;
  paybackPeriodYears: number;
  roiPercentage: number;
  irrPercentage: number;
  npvInr: number;
  savings5yrInr: number;
  savings10yrInr: number;
  savings25yrInr: number;
  co2OffsetAnnualKg: number;
  treesEquivalent: number;
  unitsExportedAnnual: number;
  gridExportRevenueAnnual: number;
  panelOptions: PanelOptionResult[];
  yearwiseSavings: number[];
  yearwiseCumulativeSavings: number[];
}

export interface PanelOptionResult {
  type: string;
  label: string;
  totalCostInr: number;
  netCostAfterSubsidyInr: number;
  annualGenerationKwh: number;
  annualSavingsInr: number;
  paybackYears: number;
  roiPct: number;
  efficiencyPct: number;
  warrantyYears: number;
  pros: string[];
  cons: string[];
  color: string;
}

export function calculateFinancials(
  input: FinancialCalculationInput
): FinancialResult {
  const stateInfo = INDIAN_STATES[input.state] ?? null;

  const costPerKwp = PANEL_SPECS[input.panelType]?.costPerKwp ?? 45000;
  const grossCost = input.capacityKwp * costPerKwp;

  // PM Surya Ghar (MNRE 2024) central subsidy
  const centralSubsidy = calculateCentralSubsidy(
    input.capacityKwp,
    input.propertyType
  );

  // State-specific additional subsidy
  const stateSubsidy =
    stateInfo && input.propertyType === "residential"
      ? stateInfo.stateSubsidyInrPerKw * input.capacityKwp
      : 0;

  const netInvestment = Math.max(0, grossCost - centralSubsidy - stateSubsidy);

  // Annual savings
  const annualSavingsInr =
    input.annualGenerationKwh * input.electricityRatePerUnit;

  // Net metering: export surplus (assume 20% exported for residential)
  const exportRatio = input.propertyType === "residential" ? 0.2 : 0.3;
  const unitsExported = input.annualGenerationKwh * exportRatio;
  const exportRate = (stateInfo?.avgTariffInr ?? input.electricityRatePerUnit) * 0.85;
  const gridExportRevenue = unitsExported * exportRate;

  const totalAnnualBenefit = annualSavingsInr + gridExportRevenue;
  const paybackYears = netInvestment / totalAnnualBenefit;

  // 25-year projections with electricity inflation & panel degradation
  const yearwiseSavings: number[] = [];
  const yearwiseCumulativeSavings: number[] = [];
  let cumulative = -netInvestment;

  for (let year = 1; year <= 25; year++) {
    const inflationMultiplier = Math.pow(
      1 + input.electricityInflationRate,
      year - 1
    );
    const degradationMultiplier = Math.pow(
      1 - input.degradationRate,
      year - 1
    );
    const yearSaving =
      totalAnnualBenefit * inflationMultiplier * degradationMultiplier;
    yearwiseSavings.push(yearSaving);
    cumulative += yearSaving;
    yearwiseCumulativeSavings.push(cumulative);
  }

  const npv = calculateNPV(
    netInvestment,
    totalAnnualBenefit,
    input.electricityInflationRate,
    input.degradationRate,
    input.discountRate,
    25
  );

  const irr = calculateIRR(netInvestment, yearwiseSavings);
  const roi = ((npv / netInvestment) * 100);

  const co2OffsetKg = input.annualGenerationKwh * GRID_EMISSION_FACTOR;
  const treesEquivalent = Math.round(co2OffsetKg / 21.77);

  const panelOptions = buildPanelOptions(
    input.capacityKwp,
    input.annualGenerationKwh,
    input.electricityRatePerUnit,
    centralSubsidy,
    stateSubsidy
  );

  return {
    grossInstallationCostInr: grossCost,
    centralSubsidyInr: centralSubsidy,
    stateSubsidyInr: stateSubsidy,
    netInvestmentInr: netInvestment,
    annualSavingsInr: totalAnnualBenefit,
    paybackPeriodYears: paybackYears,
    roiPercentage: roi,
    irrPercentage: irr,
    npvInr: npv,
    savings5yrInr: yearwiseCumulativeSavings[4] + netInvestment,
    savings10yrInr: yearwiseCumulativeSavings[9] + netInvestment,
    savings25yrInr: yearwiseCumulativeSavings[24] + netInvestment,
    co2OffsetAnnualKg: co2OffsetKg,
    treesEquivalent,
    unitsExportedAnnual: unitsExported,
    gridExportRevenueAnnual: gridExportRevenue,
    panelOptions,
    yearwiseSavings,
    yearwiseCumulativeSavings,
  };
}

function calculateCentralSubsidy(
  capacityKwp: number,
  propertyType: PropertyType
): number {
  // MNRE PM Surya Ghar scheme (2024)
  // Only for residential
  if (propertyType !== "residential") return 0;

  let subsidy = 0;
  if (capacityKwp <= 2) {
    subsidy = capacityKwp * 30000;
  } else if (capacityKwp <= 3) {
    subsidy = 2 * 30000 + (capacityKwp - 2) * 18000;
  } else {
    subsidy = 2 * 30000 + 1 * 18000; // Capped at 3kW for residential
  }
  return subsidy;
}

function calculateNPV(
  investment: number,
  annualBenefit: number,
  inflationRate: number,
  degradationRate: number,
  discountRate: number,
  years: number
): number {
  let npv = -investment;
  for (let year = 1; year <= years; year++) {
    const cashflow =
      annualBenefit *
      Math.pow(1 + inflationRate, year - 1) *
      Math.pow(1 - degradationRate, year - 1);
    npv += cashflow / Math.pow(1 + discountRate, year);
  }
  return npv;
}

function calculateIRR(
  investment: number,
  cashflows: number[]
): number {
  let rate = 0.1;
  for (let i = 0; i < 100; i++) {
    let npv = -investment;
    let dnpv = 0;
    cashflows.forEach((cf, t) => {
      const factor = Math.pow(1 + rate, t + 1);
      npv += cf / factor;
      dnpv -= ((t + 1) * cf) / (factor * (1 + rate));
    });
    const newRate = rate - npv / dnpv;
    if (Math.abs(newRate - rate) < 0.0001) break;
    rate = newRate;
  }
  return Math.round(rate * 10000) / 100;
}

function buildPanelOptions(
  capacityKwp: number,
  baseAnnualKwh: number,
  tariff: number,
  centralSubsidy: number,
  stateSubsidy: number
): PanelOptionResult[] {
  return (["mono_perc", "topcon", "hjt", "bifacial"] as const).map((type) => {
    const spec = PANEL_SPECS[type];
    const totalCost = capacityKwp * spec.costPerKwp;
    const netCost = Math.max(0, totalCost - centralSubsidy - stateSubsidy);
    // Adjust generation by efficiency ratio vs mono_perc baseline
    const efficiencyRatio = spec.efficiency / PANEL_SPECS.mono_perc.efficiency;
    const annualKwh = baseAnnualKwh * efficiencyRatio;
    const annualSavings = annualKwh * tariff;
    const payback = netCost / annualSavings;
    const roi = ((annualSavings * 25 - netCost) / netCost) * 100;

    return {
      type,
      label: spec.label,
      totalCostInr: totalCost,
      netCostAfterSubsidyInr: netCost,
      annualGenerationKwh: annualKwh,
      annualSavingsInr: annualSavings,
      paybackYears: payback,
      roiPct: roi,
      efficiencyPct: spec.efficiency * 100,
      warrantyYears: spec.warrantyYears,
      pros: spec.pros,
      cons: spec.cons,
      color: spec.color,
    };
  });
}
