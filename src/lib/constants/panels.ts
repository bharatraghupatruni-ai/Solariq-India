import type { PanelType } from "@/lib/types/database";

export interface PanelSpec {
  type: PanelType;
  label: string;
  wattage: number;
  efficiency: number;
  areaSqm: number;
  costPerKwp: number;
  warrantyYears: number;
  temperatureCoefficient: number;
  pros: string[];
  cons: string[];
  bestFor: string;
  color: string;
}

export const PANEL_SPECS: Record<PanelType, PanelSpec> = {
  mono_perc: {
    type: "mono_perc",
    label: "Mono PERC",
    wattage: 400,
    efficiency: 0.20,
    areaSqm: 1.96,
    costPerKwp: 38000,
    warrantyYears: 25,
    temperatureCoefficient: -0.0035,
    pros: ["Most popular in India", "Good efficiency", "Affordable", "Wide availability"],
    cons: ["Lower efficiency vs TOPCon/HJT", "Higher temperature loss"],
    bestFor: "Residential with moderate budget",
    color: "#3b82f6",
  },
  topcon: {
    type: "topcon",
    label: "TOPCon",
    wattage: 440,
    efficiency: 0.22,
    areaSqm: 1.96,
    costPerKwp: 45000,
    warrantyYears: 30,
    temperatureCoefficient: -0.0028,
    pros: ["Higher efficiency", "Better temperature performance", "Higher output per panel"],
    cons: ["Higher cost", "Less availability in India"],
    bestFor: "Limited roof space, premium build",
    color: "#f59e0b",
  },
  hjt: {
    type: "hjt",
    label: "HJT (Heterojunction)",
    wattage: 460,
    efficiency: 0.23,
    areaSqm: 1.96,
    costPerKwp: 55000,
    warrantyYears: 30,
    temperatureCoefficient: -0.0020,
    pros: ["Highest efficiency", "Lowest temperature coefficient", "Best for hot climates"],
    cons: ["Most expensive", "Limited supply in India"],
    bestFor: "Hot climate zones, premium commercial",
    color: "#10b981",
  },
  bifacial: {
    type: "bifacial",
    label: "Bifacial",
    wattage: 420,
    efficiency: 0.21,
    areaSqm: 1.96,
    costPerKwp: 42000,
    warrantyYears: 27,
    temperatureCoefficient: -0.0032,
    pros: ["Captures reflected light", "Higher yield in open areas", "Good ROI for ground mounts"],
    cons: ["Needs elevated mounting", "Less effective on dark rooftops"],
    bestFor: "Ground mount, open rooftops with light-coloured surfaces",
    color: "#8b5cf6",
  },
};

export const PANEL_AREA_SQM = 1.96; // Standard panel dimensions
export const DEFAULT_USABLE_AREA_RATIO = 0.70;
export const DEFAULT_SYSTEM_EFFICIENCY = 0.80;
export const PANEL_DEGRADATION_RATE = 0.005; // 0.5% per year
export const INVERTER_EFFICIENCY = 0.96;
export const WIRING_LOSSES = 0.02;
export const SOILING_LOSS = 0.02;
