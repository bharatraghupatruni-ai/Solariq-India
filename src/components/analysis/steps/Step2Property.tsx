"use client";

import { useState } from "react";
import { useAnalysisStore } from "@/stores/analysis-store";

const PROPERTY_TYPES = [
  { value: "residential", label: "Residential", icon: "home", hint: "House/Flat" },
  { value: "commercial", label: "Commercial", icon: "business", hint: "Office/Shop" },
  { value: "industrial", label: "Industrial", icon: "factory", hint: "Warehouse" },
  { value: "agricultural", label: "Agricultural", icon: "agriculture", hint: "Farm" },
] as const;

const ORIENTATIONS = [
  { value: "south", label: "South Facing", desc: "Optimal Performance" },
  { value: "east", label: "East Facing", desc: "Good Morning Yield" },
  { value: "west", label: "West Facing", desc: "Good Evening Yield" },
  { value: "north", label: "North Facing", desc: "Sub-Optimal Yield" },
] as const;

const SHADING_OPTIONS = [
  {
    value: "none",
    label: "No Shading",
    icon: "wb_sunny",
    desc: "Full sun — no trees or buildings overhead",
    color: "text-emerald-600",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500",
    impact: "0% loss",
    impactColor: "text-emerald-600",
  },
  {
    value: "partial",
    label: "Partial Shading",
    icon: "partly_cloudy_day",
    desc: "Some shade from trees or nearby structures",
    color: "text-amber-600",
    bg: "bg-amber-500/10",
    border: "border-amber-500",
    impact: "~10% loss",
    impactColor: "text-amber-600",
  },
  {
    value: "heavy",
    label: "Heavy Shading",
    icon: "park",
    desc: "Significant obstruction — large trees or buildings",
    color: "text-red-600",
    bg: "bg-red-500/10",
    border: "border-red-500",
    impact: "~18% loss",
    impactColor: "text-red-600",
  },
] as const;

const ENVIRONMENT_OPTIONS = [
  {
    value: "clean",
    label: "Clean Air",
    icon: "air",
    desc: "Rural or coastal — minimal dust and pollution",
    color: "text-sky-600",
    bg: "bg-sky-500/10",
    border: "border-sky-500",
    impact: "0% loss",
    impactColor: "text-sky-600",
  },
  {
    value: "dusty",
    label: "Dusty / Arid",
    icon: "sand",
    desc: "Dry region — frequent dust on panels",
    color: "text-orange-600",
    bg: "bg-orange-500/10",
    border: "border-orange-500",
    impact: "~5% loss",
    impactColor: "text-orange-600",
  },
  {
    value: "urban_smog",
    label: "Urban Smog",
    icon: "factory",
    desc: "City centre — haze, smog, industrial pollution",
    color: "text-purple-600",
    bg: "bg-purple-500/10",
    border: "border-purple-500",
    impact: "~8% loss",
    impactColor: "text-purple-600",
  },
] as const;

export function Step2Property() {
  const { setStep, setProperty, wizard } = useAnalysisStore();

  const [propertyType, setPropertyType] = useState<string>(
    wizard.property?.propertyType ?? "residential"
  );
  const [propertyName, setPropertyName] = useState(wizard.property?.propertyName ?? "");
  const [roofArea, setRoofArea] = useState<string>(
    wizard.property?.roofAreaSqm?.toString() ?? ""
  );
  const [orientationIdx, setOrientationIdx] = useState(0);
  const [roofMaterial, setRoofMaterial] = useState("Reinforced Concrete (RCC)");
  const [shading, setShading] = useState<"none" | "partial" | "heavy">(
    wizard.property?.shading ?? "none"
  );
  const [environment, setEnvironment] = useState<"clean" | "dusty" | "urban_smog">(
    wizard.property?.environment ?? "clean"
  );

  const currentOrientation = ORIENTATIONS[orientationIdx];
  const parsedArea = parseFloat(roofArea);
  const isAreaInvalid = roofArea !== "" && (isNaN(parsedArea) || parsedArea < 50);
  const canProceed = propertyName && propertyType && parsedArea >= 50;

  const handleNext = () => {
    setProperty({
      propertyType: propertyType as "residential" | "commercial" | "industrial" | "agricultural",
      propertyName,
      roofAreaSqm: parseFloat(roofArea),
      manualAreaEntry: true,
      shading,
      environment,
      orientation: currentOrientation.value,
      roofMaterial,
    } as any);
  };

  const nextOrientation = () => {
    setOrientationIdx((prev) => (prev + 1) % ORIENTATIONS.length);
  };

  const prevOrientation = () => {
    setOrientationIdx((prev) => (prev - 1 + ORIENTATIONS.length) % ORIENTATIONS.length);
  };

  return (
    <div className="step-transition">
      <h2 className="font-headline-lg text-3xl font-bold text-primary mb-8 font-serif leading-tight">
        Property Characteristics
      </h2>

      <div className="space-y-8">
        {/* Property Name */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
            Property Name
          </label>
          <input
            type="text"
            placeholder="My Home / Office Building"
            value={propertyName}
            onChange={(e) => setPropertyName(e.target.value)}
            required
            className="w-full h-12 px-4 bg-stone-100/50 border border-stone-200 rounded-xl font-medium text-sm text-primary outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all neomorphic-inset"
          />
        </div>

        {/* Property Type Choice Cards */}
        <div>
          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-3">
            Property Type
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {PROPERTY_TYPES.map((pt) => {
              const isSelected = propertyType === pt.value;
              return (
                <button
                  key={pt.value}
                  type="button"
                  onClick={() => setPropertyType(pt.value)}
                  className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 cursor-pointer ${
                    isSelected
                      ? "border-primary bg-primary/5 text-primary shadow-sm"
                      : "border-stone-200 bg-white hover:bg-stone-50 text-stone-500"
                  }`}
                >
                  <span className="material-symbols-outlined text-3xl">
                    {pt.icon}
                  </span>
                  <div className="font-bold text-xs">{pt.label}</div>
                  <div className="text-[9px] opacity-75 font-semibold uppercase tracking-wider">
                    {pt.hint}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Roof Area (Sqm) */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
            Roof Area (sqm) *
          </label>
          <input
            type="number"
            placeholder="100"
            value={roofArea}
            onChange={(e) => setRoofArea(e.target.value)}
            min={50}
            required
            className="w-full h-12 px-4 bg-stone-100/50 border border-stone-200 rounded-xl font-medium text-sm text-primary outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all neomorphic-inset"
          />
          {isAreaInvalid && (
            <p className="text-[10px] text-red-500 font-semibold mt-1">
              ⚠️ Minimum roof area required for modeling is 50 sqm.
            </p>
          )}
          <span className="text-[10px] text-stone-400 font-semibold block mt-1">
            Measure the flat area of your roof. Minimum 50 sqm required for central subsidy (typically 50-80 m² for a 2BHK flat).
          </span>
        </div>

        {/* Usable Area Calculations Banner */}
        {parsedArea >= 50 && (
          <div className="p-4 rounded-xl text-xs space-y-1 bg-primary/5 border border-primary/10 text-primary">
            <p>
              Usable area: <strong className="font-bold">{(parsedArea * 0.7).toFixed(0)} m²</strong> (after obstacles)
            </p>
            <p>
              Est. panels: <strong className="font-bold">{Math.floor((parsedArea * 0.7) / 1.96)}</strong> × 400W panels
            </p>
            <p>
              Est. capacity:{" "}
              <strong className="font-bold">
                {((Math.floor((parsedArea * 0.7) / 1.96) * 400) / 1000).toFixed(2)} kWp
              </strong>
            </p>
          </div>
        )}

        {/* Orientation & Material Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Orientation Selector */}
          <div className="space-y-4">
            <p className="font-label-md text-xs text-stone-400 font-bold uppercase tracking-widest block">
              Roof Orientation
            </p>
            <div className="flex justify-between items-center bg-stone-100/50 p-3 rounded-2xl neomorphic-inset">
              <button
                type="button"
                onClick={prevOrientation}
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary shadow-sm hover:bg-primary hover:text-white transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined font-bold">chevron_left</span>
              </button>
              <div className="text-center">
                <p className="font-bold text-primary text-sm font-serif">
                  {currentOrientation.label}
                </p>
                <p className="text-[10px] font-semibold text-stone-400">
                  {currentOrientation.desc}
                </p>
              </div>
              <button
                type="button"
                onClick={nextOrientation}
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary shadow-sm hover:bg-primary hover:text-white transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined font-bold">chevron_right</span>
              </button>
            </div>
          </div>

          {/* Roof Material Select List */}
          <div className="space-y-4">
            <p className="font-label-md text-xs text-stone-400 font-bold uppercase tracking-widest block">
              Roof Material
            </p>
            <div className="relative">
              <select
                value={roofMaterial}
                onChange={(e) => setRoofMaterial(e.target.value)}
                className="w-full h-12 px-4 pr-10 bg-stone-100/50 border border-stone-200 rounded-xl font-medium text-sm text-primary outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all neomorphic-inset appearance-none cursor-pointer"
              >
                <option>Reinforced Concrete (RCC)</option>
                <option>Metal Sheet</option>
                <option>Clay Tiles</option>
                <option>Asbestos Sheet</option>
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none material-symbols-outlined text-primary text-lg">
                keyboard_arrow_down
              </span>
            </div>
          </div>
        </div>

        {/* ── Shading Picker ── */}
        <div>
          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
            Rooftop Shading
          </label>
          <p className="text-[11px] text-stone-400 mb-3">
            How much shadow does your roof receive during the day?
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {SHADING_OPTIONS.map((opt) => {
              const isSelected = shading === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  id={`shading-${opt.value}`}
                  onClick={() => setShading(opt.value)}
                  className={`p-4 rounded-2xl border-2 transition-all text-left cursor-pointer ${
                    isSelected
                      ? `${opt.border} ${opt.bg}`
                      : "border-stone-200 bg-white hover:bg-stone-50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`material-symbols-outlined text-xl ${isSelected ? opt.color : "text-stone-400"}`}>
                      {opt.icon}
                    </span>
                    <span className={`font-bold text-xs ${isSelected ? opt.color : "text-stone-600"}`}>
                      {opt.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-500 leading-normal mb-2">{opt.desc}</p>
                  <div className={`text-[10px] font-bold uppercase tracking-wider ${opt.impactColor}`}>
                    Generation impact: {opt.impact}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Dust / Environment Picker ── */}
        <div>
          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
            Dust &amp; Air Quality
          </label>
          <p className="text-[11px] text-stone-400 mb-3">
            What is the typical air quality around your property?
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {ENVIRONMENT_OPTIONS.map((opt) => {
              const isSelected = environment === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  id={`environment-${opt.value}`}
                  onClick={() => setEnvironment(opt.value)}
                  className={`p-4 rounded-2xl border-2 transition-all text-left cursor-pointer ${
                    isSelected
                      ? `${opt.border} ${opt.bg}`
                      : "border-stone-200 bg-white hover:bg-stone-50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`material-symbols-outlined text-xl ${isSelected ? opt.color : "text-stone-400"}`}>
                      {opt.icon}
                    </span>
                    <span className={`font-bold text-xs ${isSelected ? opt.color : "text-stone-600"}`}>
                      {opt.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-500 leading-normal mb-2">{opt.desc}</p>
                  <div className={`text-[10px] font-bold uppercase tracking-wider ${opt.impactColor}`}>
                    Generation impact: {opt.impact}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Button controls */}
      <div className="mt-12 pt-8 border-t border-stone-200/50 flex justify-between items-center">
        <button
          onClick={() => setStep(1)}
          className="flex items-center gap-2 text-stone-500 font-bold text-xs uppercase hover:text-primary transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className="btn-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
          <span className="material-symbols-outlined text-sm font-semibold">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
