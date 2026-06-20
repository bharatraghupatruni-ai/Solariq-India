"use client";

import { motion } from "framer-motion";
import { ClayCard } from "@/components/ui/ClayCard";
import { calculateSolarReadinessScore, type SolarReadinessScore as ReadinessScore } from "@/lib/calculations/solar-readiness";

interface Props {
  orientation: "south" | "east" | "west" | "north";
  shading: "none" | "partial" | "heavy";
  roofArea: number;
  cleaning: "weekly" | "monthly" | "rarely";
  panelType: "mono" | "poly" | "thin_film";
  environment: "clean" | "dusty" | "urban_smog";
  solarResource: number;
}

function asText(v: any) {
  return (v === null || v === undefined) ? "" : String(v);
}

function ScoreRing(props: { score: number }) {
  const size = 200;
  const radius = 80;
  
  // Circumference of the full circle = 2 * PI * 80 ≈ 502.65
  // Active arc = 300 degrees. Length = (300/360) * 502.65 ≈ 418.88
  const circumference = radius * (300 / 180) * Math.PI;
  const strokeDashoffset = circumference - (props.score / 100) * circumference;
  
  // Switch to green if score is > 85, else amber
  const activeColor = props.score > 85 ? "#10B981" : "#F59E0B";

  return (
    <div className="relative flex justify-center items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="overflow-visible">
        {/* Background track circle ring (Gap of 60deg at bottom) */}
        <path
          d="M 60,169.28 A 80,80 0 1,1 140,169.28"
          fill="none"
          stroke="#F1F5F9"
          strokeWidth={10}
          strokeLinecap="round"
        />
        {/* Active color fill arc */}
        <motion.path
          d="M 60,169.28 A 80,80 0 1,1 140,169.28"
          fill="none"
          stroke={activeColor}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.4, ease: [0.4, 0, 0.2, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
        <motion.span
          className="gauge-score"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {props.score}
        </motion.span>
        <span className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-wider mt-0.5">Score</span>
      </div>
    </div>
  );
}

function SubScoreRow(props: { label: string; score: number; weight: number; color: string }) {
  const pct = Math.min(100, (props.score / props.weight) * 100);
  const display = props.score + " / " + props.weight;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-xs font-semibold">
        <span className="text-gray-500 font-medium">{asText(props.label)}</span>
        <span className="font-bold tabular-nums" style={{ color: props.color }}>{asText(display)}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 border border-gray-200/40 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: props.color }}
          initial={{ width: 0 }}
          animate={{ width: pct + "%" }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

export function SolarReadinessGauge(input: Props) {
  const result: ReadinessScore = calculateSolarReadinessScore({
    ...input,
    panelType: (input.panelType === "mono" ? "mono_perc" : input.panelType) as any,
  });

  const activeColor = result.score > 85 ? "#10B981" : "#F59E0B";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-gray-800">
      
      {/* Gauge instrument Card */}
      <div className="gauge-card flex flex-col items-center gap-5 py-4">
        <div className="text-center">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider font-mono">Telemetry Node</span>
          <h3 className="text-base font-bold text-gray-900 tracking-tight mt-1">Solar Readiness Score</h3>
        </div>
        
        <ScoreRing score={result.score} />
        
        <div className="text-center">
          <p className="gauge-verdict font-bold uppercase tracking-wider" style={{ color: activeColor }}>
            {asText(result.verdict)}
          </p>
          <p className="text-xs text-gray-500 leading-relaxed max-w-xs font-medium mt-2">
            {asText(result.recommendation)}
          </p>
        </div>
      </div>

      {/* Breakdown Card */}
      <div className="card">
        <h3 className="font-bold text-gray-900 text-sm tracking-tight mb-5 border-b border-gray-100 pb-3">Score Breakdown</h3>
        <div className="grid grid-cols-1 gap-4">
          <SubScoreRow label="Solar Resource" score={result.details.solarResourceScore} weight={30} color="#F59E0B" />
          <SubScoreRow label="Orientation" score={result.details.orientationScore} weight={20} color="#3B82F6" />
          <SubScoreRow label="Shading" score={result.details.shadingScore} weight={20} color="#10B981" />
          <SubScoreRow label="Roof Area" score={result.details.roofAreaScore} weight={10} color="#8B5CF6" />
          <SubScoreRow label="Panel Type" score={result.details.panelTypeScore} weight={10} color="#EF4444" />
          <SubScoreRow label="Cleaning Frequency" score={result.details.cleaningScore} weight={5} color="#06B6D4" />
          <SubScoreRow label="Environment" score={result.details.environmentScore} weight={5} color="#84CC16" />
        </div>
      </div>
    </div>
  );
}
