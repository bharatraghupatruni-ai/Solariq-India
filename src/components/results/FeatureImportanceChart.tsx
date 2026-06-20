"use client";

import { ClayCard } from "@/components/ui/ClayCard";

interface FeatureImportance {
  feature: string;
  importance: number;
  direction: "positive" | "negative";
  description: string;
  impact: string;
}

interface Props {
  features: FeatureImportance[];
  modelVersion?: string;
}

function asText(v: any) {
  return (v === null || v === undefined) ? "" : String(v);
}

const FEATURE_LABEL: Record<string, string> = {
  annual_ghi:        "Solar Irradiance",
  peak_sun_hours:    "Peak Sun Hours",
  avg_temperature:   "Temperature",
  avg_humidity:      "Humidity",
  roof_area:         "Roof Area",
  orientation_score: "Orientation",
  shading_score:     "Shading",
  cleaning_score:    "Cleaning Schedule",
  panel_efficiency:  "Panel Type",
  environment_score: "Environment",
  latitude:          "Latitude",
  month:             "Season / Month",
};

function FeatureBar(props: { feature: FeatureImportance; max: number }) {
  const pct = Math.max(0, Math.min(100, (props.feature.importance / props.max) * 100));
  const color = props.feature.direction === "positive" ? "#10b981" : "#ef4444";
  const label = FEATURE_LABEL[props.feature.feature] || props.feature.feature;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs shrink-0">{props.feature.direction === "positive" ? "▲" : "▼"}</span>
          <span className="text-xs font-bold text-[#1c1917] truncate">{asText(label)}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold" style={{ color }}>{props.feature.importance.toFixed(1)}%</span>
          <span className="text-[10px] text-stone-400 font-bold max-w-[80px] truncate text-right uppercase tracking-wider">{asText(props.feature.impact)}</span>
        </div>
      </div>
      <div className="h-2 rounded-full bg-stone-100 border border-stone-200/40 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: pct + "%", backgroundColor: color, transition: "width 1s ease-out" }} />
      </div>
    </div>
  );
}

export function FeatureImportanceChart(props: Props) {
  const sorted = [...props.features].sort(function (a, b) { return b.importance - a.importance; });
  const max = sorted.length > 0 ? sorted[0].importance : 1;
  const top = sorted.slice(0, 8);

  return (
    <ClayCard className="border-stone-200/50 text-[#292524]">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-stone-400 uppercase tracking-wide font-semibold">Explainable AI (XAI)</p>
            <h3 className="text-lg font-bold text-[#1c1917]">What Drove This Prediction</h3>
          </div>
          {props.modelVersion && (
            <span className="text-[10px] font-bold text-stone-500 bg-stone-50 border border-stone-200/50 px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wider">
              {asText(props.modelVersion)}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3.5">
          {top.map(function (f) {
            return <FeatureBar key={f.feature} feature={f} max={max} />;
          })}
        </div>

        <p className="text-[10px] text-stone-400 text-center pt-3 border-t border-stone-200/40 font-semibold uppercase tracking-wider">
          Feature importance based on XGBoost model contribution to predicted output.
        </p>
      </div>
    </ClayCard>
  );
}
