"use client";

import { useState } from "react";
import { ClayCard } from "@/components/ui/ClayCard";
import { formatCurrency, formatKwh, formatPercentage, formatYears } from "@/lib/utils/format";
import type { WhatIfScenario } from "@/lib/calculations/whatif-simulator";

interface Props {
  scenarios: WhatIfScenario[];
}

export function WhatIfSimulator({ scenarios }: Props) {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(scenarios[0]?.id || "");

  const activeScenario = scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0];

  if (!scenarios || scenarios.length === 0) return null;

  return (
    <div className="glass-card p-8 rounded-3xl text-left border border-white/40 h-full flex flex-col justify-between">
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-xs text-stone-450 uppercase tracking-wider font-semibold">AI Simulator</p>
          <h3 className="text-lg font-bold text-primary font-serif mt-1">What-If Simulation</h3>
          <p className="text-stone-500 text-xs mt-1 leading-normal font-medium">
            Compare your baseline rooftop configuration against system upgrades and optimal practices.
          </p>
        </div>

        {/* Tab selection */}
        <div className="flex flex-wrap gap-2">
          {scenarios.map((scenario) => {
            const isActive = scenario.id === selectedScenarioId;
            return (
              <button
                key={scenario.id}
                onClick={() => setSelectedScenarioId(scenario.id)}
                className="px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer border"
                style={{
                  background: isActive ? "#003527" : "white",
                  borderColor: isActive ? "transparent" : "rgba(41, 37, 36, 0.08)",
                  color: isActive ? "white" : "#57534e",
                }}
              >
                {scenario.label}
              </button>
            );
          })}
        </div>

        {/* Selected Scenario details */}
        {activeScenario && (
          <div
            className="p-5 rounded-2xl flex flex-col md:flex-row items-stretch gap-6 transition-all duration-300 border border-stone-200/50 bg-stone-50/50"
            style={{
              borderLeft: `6px solid #fcdf46`,
            }}
          >
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-sm text-primary font-serif">{activeScenario.label}</h4>
                <p className="text-stone-500 text-[11px] mt-1 leading-normal font-medium">{activeScenario.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div>
                  <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Annual Generation</p>
                  <p className="text-base font-extrabold text-primary font-serif mt-0.5">{formatKwh(activeScenario.annualGenerationKwh)}</p>
                  <span
                    className={`text-[11px] font-bold ${
                      activeScenario.generationDiff >= 0 ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {activeScenario.generationDiff >= 0 ? "+" : ""}
                    {formatKwh(activeScenario.generationDiff)} / yr
                  </span>
                </div>

                <div>
                  <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Annual Savings</p>
                  <p className="text-base font-extrabold text-primary font-serif mt-0.5">{formatCurrency(activeScenario.annualSavingsInr)}</p>
                  <span
                    className={`text-[11px] font-bold ${
                      activeScenario.savingsDiff >= 0 ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {activeScenario.savingsDiff >= 0 ? "+" : ""}
                    {formatCurrency(activeScenario.savingsDiff)} / yr
                  </span>
                </div>
              </div>
            </div>

            <div className="w-full md:w-[180px] flex flex-col justify-between gap-4 p-4 rounded-xl bg-white border border-stone-200/50 shrink-0">
              <div>
                <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">ROI & Payback</p>
                <p className="text-xl font-extrabold text-primary font-serif mt-0.5">{formatPercentage(activeScenario.roiPercentage, 0)}</p>
                <p className="text-[11px] text-stone-500 font-semibold mt-0.5">Payback: {formatYears(activeScenario.paybackYears)}</p>
              </div>

              <div className="border-t border-stone-200/50 pt-3">
                <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">CO₂ Offset</p>
                <p className="text-base font-extrabold text-emerald-600 mt-0.5">{Math.round(activeScenario.co2OffsetKg).toLocaleString()} kg</p>
                <span className="text-[11px] text-emerald-600 font-bold block mt-0.5">
                  +{Math.round(activeScenario.co2Diff).toLocaleString()} kg extra
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
