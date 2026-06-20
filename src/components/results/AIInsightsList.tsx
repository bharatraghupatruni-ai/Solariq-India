"use client";

import { ClayCard } from "@/components/ui/ClayCard";
import { generateInsights, type Insight, type InsightsResult } from "@/lib/calculations/insights-engine";

interface Props {
  shading: "none" | "partial" | "heavy";
  cleaning: "weekly" | "monthly" | "rarely";
  orientation: "south" | "east" | "west" | "north";
  panelType: "mono" | "poly" | "thin_film";
  environment: "clean" | "dusty" | "urban_smog";
  annualGenerationKwh: number;
  electricityRatePerUnit: number;
  annualSavingsInr: number;
  co2OffsetKg: number;
  roofArea: number;
  systemCapacityKwp: number;
}

function asText(v: any) {
  return (v === null || v === undefined) ? "" : String(v);
}

const CATEGORY_STYLE: Record<string, { icon: string; bg: string; text: string }> = {
  positive:    { icon: "✓", bg: "bg-emerald-100", text: "text-emerald-600" },
  negative:    { icon: "!", bg: "bg-red-100",     text: "text-red-600" },
  comparison:  { icon: "↔", bg: "bg-blue-100",    text: "text-blue-600" },
  financial:   { icon: "₹", bg: "bg-amber-100",   text: "text-amber-600" },
  environmental: { icon: "🌱", bg: "bg-green-100", text: "text-green-600" },
};

function InsightRow(props: { insight: Insight }) {
  const style = CATEGORY_STYLE[props.insight.category] || CATEGORY_STYLE.positive;
  return (
    <div className="flex items-start gap-3 p-3 rounded-[12px] border border-stone-200/50 bg-stone-50/40 hover:bg-stone-50/70 transition-all duration-200">
      <div className={"w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 " + style.bg + " " + style.text}>
        {asText(style.icon)}
      </div>
      <div className="flex-1">
        <p className="text-xs text-[#1c1917] leading-relaxed font-semibold">{asText(props.insight.statement)}</p>
      </div>
    </div>
  );
}

export function AIInsightsList(input: Props) {
  const result: InsightsResult = generateInsights(input);

  return (
    <ClayCard glow="data" className="border-stone-200/50 text-[#292524]">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-stone-400 uppercase tracking-wide font-semibold">AI Quantified Insights</p>
            <h3 className="text-lg font-bold text-[#1c1917]">What These Numbers Mean</h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
            {asText(result.insights.length)} insights
          </span>
        </div>

        <div className="text-xs text-stone-500 font-semibold italic bg-stone-50/50 p-3 rounded-xl border border-stone-200/30">
          {asText(result.summary)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          {result.insights.map(function (ins, i) {
            return <InsightRow key={i} insight={ins} />;
          })}
        </div>
      </div>
    </ClayCard>
  );
}
