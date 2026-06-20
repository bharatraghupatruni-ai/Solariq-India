"use client";

import { ClayCard } from "@/components/ui/ClayCard";
import { generateRecommendations, type Recommendation } from "@/lib/calculations/recommendation-engine";

interface Props {
  readinessInput: {
    orientation: "south" | "east" | "west" | "north";
    shading: "none" | "partial" | "heavy";
    roofArea: number;
    cleaning: "weekly" | "monthly" | "rarely";
    panelType: "mono" | "poly" | "thin_film";
    environment: "clean" | "dusty" | "urban_smog";
    solarResource: number;
  };
  healthInput: {
    environment: "clean" | "dusty" | "urban_smog";
    cleaning: "weekly" | "monthly" | "rarely";
    avgTemperature: number;
    panelType: "mono" | "poly" | "thin_film";
    avgHumidity: number;
    shading: "none" | "partial" | "heavy";
  };
  readinessScore: number;
  healthScore: number;
  paybackYears: number;
  roiPercentage: number;
  monthlyBillInr: number;
  annualSavingsInr: number;
  netInvestmentInr: number;
}

function asText(v: any) {
  return (v === null || v === undefined) ? "" : String(v);
}

const CATEGORY_LABEL: Record<string, string> = {
  install: "Install",
  optimize: "Optimize",
  maintain: "Maintain",
  finance: "Finance",
  caution: "Caution",
};

const PRIORITY_STYLE: Record<string, { color: string; bg: string }> = {
  critical: { color: "#dc2626", bg: "#dc26261a" },
  high:     { color: "#f59e0b", bg: "#f59e0b1a" },
  medium:   { color: "#3b82f6", bg: "#3b82f61a" },
  low:      { color: "#10b981", bg: "#10b9811a" },
};

const VERDICT_BANNER: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  install_now:                { label: "Install Now",      bg: "bg-emerald-50 border border-emerald-200", text: "text-emerald-700",  icon: "✓" },
  install_after_improvements: { label: "Install After Improvements", bg: "bg-amber-50 border border-amber-200",   text: "text-amber-700",    icon: "→" },
  not_recommended:            { label: "Not Recommended",  bg: "bg-red-50 border border-red-200",     text: "text-red-700",      icon: "✕" },
};

function PriorityBadge(props: { priority: string }) {
  const s = PRIORITY_STYLE[props.priority] || PRIORITY_STYLE.medium;
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide" style={{ backgroundColor: s.bg, color: s.color }}>
      {asText(props.priority)}
  </span>
  );
}

function RecCard(props: { rec: Recommendation }) {
  const category = CATEGORY_LABEL[props.rec.category] || props.rec.category;
  return (
    <div className="p-4 rounded-[14px] flex flex-col gap-2 border border-stone-200/50 bg-stone-50/40 hover:bg-stone-50/70 transition-all duration-200">
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-bold text-[#1c1917] text-xs flex-1">{asText(props.rec.title)}</h4>
        <PriorityBadge priority={props.rec.priority} />
      </div>
      <p className="text-xs text-stone-500 leading-relaxed font-medium">{asText(props.rec.description)}</p>
      <div className="flex items-center justify-between pt-1">
        <span className="text-[10px] text-stone-400 uppercase tracking-wide font-bold">{asText(category)}</span>
        <span className="text-xs font-bold text-emerald-600">{asText(props.rec.impact)}</span>
      </div>
      <div className="text-xs text-blue-600 font-bold">{asText(props.rec.actionLabel)} →</div>
    </div>
  );
}

export function RecommendationsPanel(input: Props) {
  const mappedInput = {
    ...input,
    readinessInput: {
      ...input.readinessInput,
      panelType: (input.readinessInput.panelType === "mono" ? "mono_perc" : input.readinessInput.panelType) as any,
    },
    healthInput: {
      ...input.healthInput,
      panelType: (input.healthInput.panelType === "mono" ? "mono_perc" : input.healthInput.panelType) as any,
    },
  };
  const result = generateRecommendations(mappedInput);
  const banner = VERDICT_BANNER[result.verdict];
  const verdictReason = asText(result.verdictReason);

  return (
    <ClayCard glow="solar" className="border-stone-200/50 text-[#292524]">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-xs text-stone-400 uppercase tracking-wide font-semibold">AI Recommendations</p>
          <h3 className="text-lg font-bold text-[#1c1917]">Action Plan</h3>
        </div>

        {banner && (
          <div className={"flex items-center gap-3 p-4 rounded-[14px] " + banner.bg}>
            <div className={"w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold bg-white shadow-sm " + banner.text}>
              {asText(banner.icon)}
            </div>
            <div className="flex-1">
              <p className={"text-sm font-bold " + banner.text}>{asText(banner.label)}</p>
              <p className="text-xs text-stone-600 mt-0.5 font-medium">{asText(verdictReason)}</p>
            </div>
          </div>
        )}

        {result.recommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {result.recommendations.map(function (r) {
              return <RecCard key={r.id} rec={r} />;
            })}
          </div>
        ) : (
          <p className="text-sm text-stone-400 text-center py-6 font-semibold">No recommendations at this time</p>
        )}
      </div>
    </ClayCard>
  );
}
