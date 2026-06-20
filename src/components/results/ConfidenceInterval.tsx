"use client";

import { ClayCard } from "@/components/ui/ClayCard";

interface Props {
  predictedKwh: number;
  confidenceLow: number;
  confidenceHigh: number;
  confidencePct: number;
  modelVersion: string;
  r2?: number;
  mae?: number;
  rmse?: number;
}

function asText(v: any) {
  return (v === null || v === undefined) ? "" : String(v);
}

function fmtNum(n: number) {
  return Math.round(n).toLocaleString("en-IN");
}

export function ConfidenceInterval(props: Props) {
  const range = props.confidenceHigh - props.confidenceLow;
  const predictedPos = ((props.predictedKwh - props.confidenceLow) / range) * 100;
  const confidenceColor = props.confidencePct >= 80 ? "#10b981" : props.confidencePct >= 60 ? "#3b82f6" : "#f59e0b";
  const lowStr = fmtNum(props.confidenceLow);
  const predStr = fmtNum(props.predictedKwh);
  const highStr = fmtNum(props.confidenceHigh);
  const r2Str = props.r2 !== undefined ? props.r2.toFixed(3) : "";
  const maeStr = props.mae !== undefined ? props.mae.toFixed(1) : "";

  return (
    <ClayCard glow="data" className="border-stone-200/50 text-[#292524]">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-xs text-stone-400 uppercase tracking-wide font-semibold">ML Prediction</p>
          <h3 className="text-lg font-bold text-[#1c1917]">Generation Estimate & Confidence</h3>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-[#1c1917] tracking-tight">{lowStr && predStr}</span>
          <span className="text-xs text-stone-400 font-bold uppercase tracking-wider">kWh / year</span>
        </div>

        <div className="relative h-3 rounded-full bg-stone-100 border border-stone-200/40 overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full rounded-full opacity-35"
            style={{ backgroundColor: confidenceColor, width: "100%" }}
          />
          <div
            className="absolute top-0 h-full w-1.5 rounded-full"
            style={{ backgroundColor: confidenceColor, left: Math.max(0, Math.min(100, predictedPos)) + "%", boxShadow: "0 0 0 3px white, 0 0 0 4px " + confidenceColor }}
          />
        </div>

        <div className="grid grid-cols-3 gap-2 text-center pt-2">
          <div>
            <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Low</p>
            <p className="text-sm font-bold text-[#1c1917]">{lowStr}</p>
          </div>
          <div>
            <p className="text-[10px] text-emerald-600 uppercase font-extrabold tracking-wider">Predicted</p>
            <p className="text-sm font-extrabold text-emerald-600">{predStr}</p>
          </div>
          <div>
            <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">High</p>
            <p className="text-sm font-bold text-[#1c1917]">{highStr}</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs pt-3 border-t border-stone-200/40 font-semibold">
          <div className="flex items-center gap-2">
            <span className="text-stone-400">Confidence</span>
            <span className="font-bold" style={{ color: confidenceColor }}>{props.confidencePct}%</span>
          </div>
          <div className="flex items-center gap-3 text-stone-400">
            <span>Model: {asText(props.modelVersion)}</span>
            {r2Str && <span>R²={r2Str}</span>}
            {maeStr && <span>MAE={maeStr}</span>}
          </div>
        </div>
      </div>
    </ClayCard>
  );
}
