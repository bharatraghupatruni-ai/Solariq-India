"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAnalysisStore } from "@/stores/analysis-store";
import { formatCurrency } from "@/lib/utils/format";
import { PANEL_SPECS } from "@/lib/constants/panels";

const PANEL_TYPES = ["mono_perc", "topcon", "hjt", "bifacial", "auto"] as const;

export function Step4Budget() {
  const router = useRouter();
  const { setStep, setBudget, wizard, setAnalysisId, setLoading, setError, error } =
    useAnalysisStore();

  const [budgetVal, setBudgetVal] = useState(
    wizard.budget?.budgetInr ? Math.round(wizard.budget.budgetInr) : 150000
  );
  const [panelPref, setPanelPref] = useState<typeof PANEL_TYPES[number]>("auto");
  const [batteryStorage, setBatteryStorage] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!budgetVal || !wizard.location || !wizard.property || !wizard.energy) return;

    setBudget({
      budgetInr: budgetVal,
      panelPreference: panelPref,
      financingNeeded: false,
    });

    setSubmitting(true);
    setLoading(true);

    try {
      const payload = {
        latitude: wizard.location.latitude,
        longitude: wizard.location.longitude,
        address: wizard.location.address,
        city: wizard.location.city,
        state: wizard.location.state,
        pincode: wizard.location.pincode,
        propertyName: wizard.property.propertyName,
        propertyType: wizard.property.propertyType,
        roofAreaSqm: wizard.property.roofAreaSqm,
        monthlyBillInr: wizard.energy.monthlyBillInr,
        monthlyConsumptionKwh: wizard.energy.monthlyConsumptionKwh,
        electricityRatePerUnit: wizard.energy.electricityRatePerUnit,
        budgetInr: budgetVal,
        gridConnected: wizard.energy.gridConnected,
        panelPreference: panelPref,
        batteryInterest: batteryStorage,
      };

      const res = await fetch("/api/analysis/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Analysis failed. Please try again.");
        setSubmitting(false);
        return;
      }

      setAnalysisId(data.analysisId);
      router.push(`/analysis/${data.analysisId}`);
    } catch {
      setError("Network error. Please check your connection.");
      setSubmitting(false);
    }
  };

  return (
    <div className="step-transition">
      <h2 className="font-headline-lg text-3xl font-bold text-primary mb-8 font-serif leading-tight">
        Investment & Hardware
      </h2>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-600 text-xs px-4 py-3 rounded-xl font-semibold mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Left Column: Budget & Battery */}
        <div className="space-y-8">
          {/* Budget Range Slider */}
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <label className="font-label-md text-xs text-stone-400 font-bold uppercase tracking-widest block">
                Investment Budget (INR)
              </label>
              <span className="font-data-display text-xl font-bold text-primary">
                ₹ {budgetVal.toLocaleString("en-IN")}
              </span>
            </div>
            <input
              className="w-full h-2 bg-stone-200 rounded-full appearance-none cursor-pointer accent-primary"
              max="1000000"
              min="50000"
              step="25000"
              type="range"
              value={budgetVal}
              onChange={(e) => setBudgetVal(parseInt(e.target.value))}
            />
            <div className="flex justify-between font-body-sm text-xs text-stone-400 font-semibold">
              <span>Budget-Friendly (₹50K)</span>
              <span>Premium (₹10L+)</span>
            </div>
          </div>

          {/* Dynamic Budget summary info */}
          <div className="p-4 rounded-xl text-xs space-y-1.5 bg-stone-50 border border-stone-200/50 text-stone-500">
            <p>
              Est. system capacity: <strong className="text-primary font-bold">{(budgetVal / 55000).toFixed(1)} kWp</strong>
            </p>
            <p className="text-[10px] text-stone-400 leading-normal">
              A standard 3kW residential system costs ₹1.2–1.8 lakh after subsidy.
            </p>
          </div>

          {/* Battery Storage Toggle */}
          <div className="p-6 bg-secondary-container/20 rounded-3xl flex items-center justify-between border border-secondary-container/30">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#fcdf46] flex items-center justify-center text-[#6d5e00] flex-shrink-0 shadow-sm">
                <span className="material-symbols-outlined font-semibold">battery_charging_full</span>
              </div>
              <div className="text-left">
                <p className="font-body-md text-sm font-bold text-primary">Battery Storage</p>
                <p className="font-label-md text-[10px] text-stone-500 font-semibold uppercase tracking-wider">
                  Add for night energy use
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={batteryStorage}
                onChange={(e) => setBatteryStorage(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-8 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>

        {/* Right Column: Panel Tech & Summary */}
        <div className="space-y-8">
          {/* Panel Technology Selection */}
          <div>
            <p className="font-label-md text-xs text-stone-400 font-bold uppercase tracking-widest block mb-4">
              Panel Technology
            </p>
            <div className="space-y-3">
              {/* Option Auto */}
              <label
                onClick={() => setPanelPref("auto")}
                className={`flex items-center p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                  panelPref === "auto" ? "border-primary bg-primary/5" : "border-stone-200 bg-white hover:bg-stone-50"
                }`}
              >
                <input
                  type="radio"
                  name="panelPref"
                  checked={panelPref === "auto"}
                  onChange={() => {}}
                  className="w-4 h-4 text-primary border-stone-300 focus:ring-primary"
                />
                <div className="ml-4 text-left">
                  <p className="font-body-md text-sm font-bold text-primary">🤖 Auto (AI Choice)</p>
                  <p className="font-label-md text-[10px] text-stone-500">
                    SolarIQ will dynamically calculate the best option for your roof yield.
                  </p>
                </div>
              </label>

              {/* Specific tech options */}
              {(["mono_perc", "bifacial"] as const).map((type) => {
                const spec = PANEL_SPECS[type];
                const isSelected = panelPref === type;
                return (
                  <label
                    key={type}
                    onClick={() => setPanelPref(type)}
                    className={`flex items-center p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      isSelected ? "border-primary bg-primary/5" : "border-stone-200 bg-white hover:bg-stone-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="panelPref"
                      checked={isSelected}
                      onChange={() => {}}
                      className="w-4 h-4 text-primary border-stone-300 focus:ring-primary"
                    />
                    <div className="ml-4 text-left">
                      <p className="font-body-md text-sm font-bold text-primary">{spec.label}</p>
                      <p className="font-label-md text-[10px] text-stone-500">
                        {(spec.efficiency * 100).toFixed(0)}% eff · {spec.wattage}W · ₹
                        {(spec.costPerKwp / 1000).toFixed(0)}K/kWp
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Feasibility Summary Card */}
          {wizard.location && wizard.property && wizard.energy && (
            <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200/50 text-stone-500 text-xs space-y-3">
              <span className="font-bold text-[#1c1917] tracking-wider uppercase text-[10px] flex items-center gap-1.5 border-b border-stone-200/50 pb-2 block">
                <span className="material-symbols-outlined text-sm text-primary">info</span>
                Simulation Configuration
              </span>
              <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                <span>Location:</span>
                <span className="font-bold text-primary text-right truncate">
                  {wizard.location.city}, {wizard.location.state.replace(/_/g, " ")}
                </span>
                <span>Roof Area:</span>
                <span className="font-bold text-primary text-right">
                  {wizard.property.roofAreaSqm} m²
                </span>
                <span>Monthly Bill:</span>
                <span className="font-bold text-primary text-right">
                  {formatCurrency(wizard.energy.monthlyBillInr)}
                </span>
                <span>Base Tariff:</span>
                <span className="font-bold text-primary text-right">
                  ₹{wizard.energy.electricityRatePerUnit}/kWh
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Button Controls */}
      <div className="mt-12 pt-8 border-t border-stone-200/50 flex justify-between items-center">
        <button
          onClick={() => setStep(3)}
          className="flex items-center gap-2 text-stone-500 font-bold text-xs uppercase hover:text-primary transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="btn-secondary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {submitting ? "Analyzing..." : "Generate Analysis"}
          <span className="material-symbols-outlined text-sm font-semibold">query_stats</span>
        </button>
      </div>
    </div>
  );
}
