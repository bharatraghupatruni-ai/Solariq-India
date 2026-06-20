"use client";

import { motion } from "framer-motion";
import { ClayCard } from "@/components/ui/ClayCard";
import { calculateSolarHealthIndex, type HealthIndexResult } from "@/lib/calculations/health-index";

interface Props {
  environment: "clean" | "dusty" | "urban_smog";
  cleaning: "weekly" | "monthly" | "rarely";
  avgTemperature: number;
  panelType: "mono" | "poly" | "thin_film";
  avgHumidity: number;
  shading: "none" | "partial" | "heavy";
}

function asText(v: any) {
  return (v === null || v === undefined) ? "" : String(v);
}

function FactorBar(props: { label: string; score: number; max: number; color: string }) {
  const pct = Math.min(100, (props.score / props.max) * 100);
  const display = props.score + " / " + props.max;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-xs font-semibold">
        <span className="text-stone-500 font-medium">{asText(props.label)}</span>
        <span className="font-bold" style={{ color: props.color }}>{asText(display)}</span>
      </div>
      <div className="h-2 rounded-full bg-stone-100 border border-stone-200/40 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: props.color }}
          initial={{ width: 0 }}
          animate={{ width: pct + "%" }}
          transition={{ duration: 0.9 }}
        />
      </div>
    </div>
  );
}

function SuggestionItem(props: { text: string }) {
  return (
    <li className="text-xs text-stone-600 flex items-start gap-2 font-medium">
      <span className="text-amber-500 font-bold mt-0.5">{asText("→")}</span>
      <span>{asText(props.text)}</span>
    </li>
  );
}

function BigNumber(props: { value: number; color: string }) {
  return (
    <div className="text-4xl font-extrabold tracking-tight" style={{ color: props.color }}>
      {asText(props.value)}
    </div>
  );
}

function Caption(props: { value: string }) {
  return (
    <div className="text-xs text-stone-400 font-bold uppercase tracking-wider mt-0.5">
      {asText(props.value)}
    </div>
  );
}

export function HealthIndexCard(input: Props) {
  const result: HealthIndexResult = calculateSolarHealthIndex(input);

  return (
    <ClayCard glow="eco" className="border-stone-200/50 text-[#292524]">
      <div className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-stone-400 uppercase tracking-wide font-semibold">Health Diagnostics</p>
            <h3 className="text-lg font-bold text-[#1c1917]">Solar Health Index</h3>
          </div>
          <div className="flex flex-col items-center">
            <BigNumber value={result.score} color={result.color} />
            <Caption value={result.category} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <FactorBar label="Dust" score={result.factors.dustScore} max={40} color="#f59e0b" />
          <FactorBar label="Heat" score={result.factors.heatScore} max={20} color="#ef4444" />
          <FactorBar label="Humidity" score={result.factors.humidityScore} max={20} color="#3b82f6" />
          <FactorBar label="Shading" score={result.factors.shadingScore} max={20} color="#10b981" />
        </div>

        {result.suggestions.length > 0 && (
          <div className="pt-3 border-t border-stone-200/40">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Improvement Suggestions</p>
            <ul className="flex flex-col gap-2">
              {result.suggestions.map(function (s, i) {
                return <SuggestionItem key={i} text={asText(s)} />;
              })}
            </ul>
          </div>
        )}
      </div>
    </ClayCard>
  );
}
