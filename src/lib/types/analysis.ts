import type { PanelType, PropertyType } from "./database";

export interface AnalysisWizardState {
  step: 1 | 2 | 3 | 4;
  location: LocationStep | null;
  property: PropertyStep | null;
  energy: EnergyStep | null;
  budget: BudgetStep | null;
}

export interface LocationStep {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface PropertyStep {
  propertyType: PropertyType;
  propertyName: string;
  roofAreaSqm: number;
  manualAreaEntry: boolean;
}

export interface EnergyStep {
  monthlyBillInr: number;
  monthlyConsumptionKwh: number;
  electricityRatePerUnit: number;
  discomName: string;
  gridConnected: boolean;
  batteryInterest: boolean;
}

export interface BudgetStep {
  budgetInr: number;
  panelPreference: PanelType | "auto";
  financingNeeded: boolean;
}

export interface SolarCalculationInput {
  roofAreaSqm: number;
  usableAreaRatio: number;
  peakSunHoursDaily: number;
  systemEfficiency: number;
  panelType: PanelType;
  latitude: number;
  shadingFactor: number;
  tiltAngle: number;
  azimuthAngle: number;
  monthlyGhi: number[];
}

export interface FinancialCalculationInput {
  capacityKwp: number;
  annualGenerationKwh: number;
  electricityRatePerUnit: number;
  state: string;
  propertyType: PropertyType;
  panelType: PanelType;
  electricityInflationRate: number;
  discountRate: number;
  degradationRate: number;
}
