"use client";

import { useState } from "react";
import { useAnalysisStore } from "@/stores/analysis-store";
import { INDIAN_STATES } from "@/lib/constants/states";

export function Step3Energy() {
  const { setStep, setEnergy, wizard } = useAnalysisStore();
  const stateKey = wizard.location?.state ?? "";
  const stateInfo = INDIAN_STATES[stateKey];

  const [monthlyBill, setMonthlyBill] = useState(
    wizard.energy?.monthlyBillInr ? Math.round(wizard.energy.monthlyBillInr) : 8500
  );
  const [consumption, setConsumption] = useState(
    wizard.energy?.monthlyConsumptionKwh ? Math.round(wizard.energy.monthlyConsumptionKwh) : 450
  );
  const [tariff, setTariff] = useState(
    wizard.energy?.electricityRatePerUnit?.toString() ??
      stateInfo?.avgTariffInr?.toString() ??
      "7"
  );
  const [gridConnected, setGridConnected] = useState(
    wizard.energy?.gridConnected !== undefined ? wizard.energy.gridConnected : true
  );

  const canProceed = monthlyBill > 0 && parseFloat(tariff) > 0;

  const handleNext = () => {
    setEnergy({
      monthlyBillInr: monthlyBill,
      monthlyConsumptionKwh: consumption || monthlyBill / parseFloat(tariff),
      electricityRatePerUnit: parseFloat(tariff),
      discomName: stateInfo?.discom ?? "",
      gridConnected,
      batteryInterest: false,
    });
  };

  return (
    <div className="step-transition">
      <h2 className="font-headline-lg text-3xl font-bold text-primary mb-12 font-serif leading-tight">
        Current Energy Profile
      </h2>

      <div className="space-y-12">
        {/* Monthly Bill Slider */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <label className="font-headline-md text-lg font-bold text-primary font-serif">
              Monthly Bill (INR)
            </label>
            <span className="font-data-display text-2xl font-bold text-primary">
              ₹ {monthlyBill.toLocaleString("en-IN")}
            </span>
          </div>
          <input
            className="w-full h-2 bg-stone-200 rounded-full appearance-none cursor-pointer accent-primary"
            max="50000"
            min="1000"
            step="500"
            type="range"
            value={monthlyBill}
            onChange={(e) => setMonthlyBill(parseInt(e.target.value))}
          />
          <div className="flex justify-between font-label-md text-xs font-semibold text-stone-400">
            <span>₹ 1,000</span>
            <span>₹ 50,000+</span>
          </div>
        </div>

        {/* Consumption Slider */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <label className="font-headline-md text-lg font-bold text-primary font-serif">
              Consumption (kWh)
            </label>
            <span className="font-data-display text-2xl font-bold text-primary">
              {consumption} Units
            </span>
          </div>
          <input
            className="w-full h-2 bg-stone-200 rounded-full appearance-none cursor-pointer accent-primary"
            max="5000"
            min="100"
            step="10"
            type="range"
            value={consumption}
            onChange={(e) => setConsumption(parseInt(e.target.value))}
          />
          <div className="flex justify-between font-label-md text-xs font-semibold text-stone-400">
            <span>100 kWh</span>
            <span>5,000 kWh</span>
          </div>
        </div>

        {/* Tariff Rate Input */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
            Electricity Rate Per Unit (₹/kWh)
          </label>
          <input
            type="number"
            placeholder={stateInfo?.avgTariffInr?.toString() ?? "7"}
            value={tariff}
            onChange={(e) => setTariff(e.target.value)}
            step="0.1"
            required
            className="w-full h-12 px-4 bg-stone-100/50 border border-stone-200 rounded-xl font-medium text-sm text-primary outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all neomorphic-inset"
          />
          <span className="text-[10px] text-stone-400 font-semibold block mt-1">
            {stateInfo
              ? `Average for ${stateInfo.name}: ₹${stateInfo.avgTariffInr}/kWh`
              : "Check your electricity bill for the rate"}
          </span>
        </div>

        {/* State discom metadata */}
        {stateInfo && (
          <div className="p-4 rounded-xl text-xs space-y-1 bg-stone-50 border border-stone-200/50 text-stone-500">
            <p className="font-bold text-[#1c1917] mb-2 tracking-wide uppercase text-[9px] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-amber-500">info</span>
              {stateInfo.name} DISCOM Details
            </p>
            <p>DISCOM: <strong className="text-[#1c1917] font-semibold">{stateInfo.discom}</strong></p>
            <p>Net metering: <strong className="text-[#1c1917] font-semibold">{stateInfo.netMeteringPolicy.replace(/_/g, " ")}</strong></p>
            <p>Avg sun hours: <strong className="text-[#1c1917] font-semibold">{stateInfo.avgSunHoursDaily} hrs/day</strong></p>
          </div>
        )}

        {/* Grid Connection Option Buttons */}
        <div>
          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-3">
            Grid Connection
          </label>
          <div className="flex gap-4">
            {[
              { label: "Grid Connected", value: true, icon: "link" },
              { label: "Off-Grid / Backup", value: false, icon: "battery_charging_full" },
            ].map((opt) => {
              const isSelected = gridConnected === opt.value;
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => setGridConnected(opt.value)}
                  className={`flex-1 p-4 rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-2 border cursor-pointer ${
                    isSelected
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-stone-200 bg-white hover:bg-stone-50 text-stone-500"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm font-semibold">{opt.icon}</span>
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Button controls */}
      <div className="mt-12 pt-8 border-t border-stone-200/50 flex justify-between items-center">
        <button
          onClick={() => setStep(2)}
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
