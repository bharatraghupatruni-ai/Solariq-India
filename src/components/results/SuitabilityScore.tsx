"use client";

import { motion } from "framer-motion";
import { ClayCard } from "@/components/ui/ClayCard";
import type { SuitabilityScore as SuitabilityScoreType } from "@/lib/types/database";

interface Props {
  score: SuitabilityScoreType;
}

const RECOMMENDATION_LABELS = {
  highly_recommended: { label: "Highly Recommended", color: "#10b981", bg: "bg-emerald-500/10 border border-emerald-500/20" },
  recommended: { label: "Recommended", color: "#3b82f6", bg: "bg-blue-500/10 border border-blue-500/20" },
  marginal: { label: "Marginal", color: "#f59e0b", bg: "bg-amber-500/10 border border-amber-500/20" },
  not_recommended: { label: "Not Recommended", color: "#ef4444", bg: "bg-red-500/10 border border-red-500/20" },
};

function ScoreRing({ score, size = 160 }: { score: number; size?: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const color =
    score >= 75 ? "#10b981" : score >= 55 ? "#3b82f6" : score >= 35 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(41, 37, 36, 0.05)"
          strokeWidth={10}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-4xl font-extrabold tracking-tight"
          style={{ color }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {score}
        </motion.span>
        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mt-0.5">/ 100</span>
      </div>
    </div>
  );
}

function SubScoreBar({
  label,
  score,
  color,
}: {
  label: string;
  score: number;
  color: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-xs font-semibold">
        <span className="text-stone-500">{label}</span>
        <span className="font-bold" style={{ color }}>
          {score}
        </span>
      </div>
      <div className="h-2 rounded-full bg-stone-100 overflow-hidden border border-stone-200/40">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

export function SuitabilityScoreCard({ score }: Props) {
  const rec = RECOMMENDATION_LABELS[score.recommendation_level];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-[#292524]">
      {/* Main score */}
      <ClayCard glow={score.overall_score >= 55 ? "eco" : "solar"} className="border-stone-200/50">
        <div className="flex flex-col items-center gap-4 py-4">
          <h2 className="text-base font-bold text-[#1c1917] tracking-tight">Solar Suitability Score</h2>
          <ScoreRing score={score.overall_score} size={180} />
          <span
            className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${rec.bg}`}
            style={{ color: rec.color }}
          >
            {rec.label}
          </span>
          <p className="text-xs text-stone-500 text-center leading-relaxed max-w-sm mt-2 font-medium">
            {score.recommendation}
          </p>
        </div>
      </ClayCard>

      {/* Sub-scores and insights */}
      <div className="flex flex-col gap-4">
        <ClayCard className="border-stone-200/50">
          <h3 className="font-bold text-[#1c1917] text-sm tracking-tight mb-5">Score Breakdown</h3>
          <div className="flex flex-col gap-4">
            <SubScoreBar label="Roof Quality" score={score.roof_quality_score} color="#3b82f6" />
            <SubScoreBar label="Solar Resource" score={score.solar_resource_score} color="#f59e0b" />
            <SubScoreBar label="Financial Viability" score={score.financial_viability_score} color="#10b981" />
            <SubScoreBar label="Policy & Incentives" score={score.policy_environment_score} color="#8b5cf6" />
          </div>
        </ClayCard>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {score.strengths.length > 0 && (
            <ClayCard className="p-4 border-stone-200/50" glow="eco">
              <p className="text-[10px] font-bold text-emerald-600 mb-2.5 uppercase tracking-wider">Strengths</p>
              <ul className="flex flex-col gap-1.5">
                {score.strengths.slice(0, 3).map((s, i) => (
                  <li key={i} className="text-[10px] text-stone-500 flex items-start gap-1.5 leading-normal font-semibold">
                    <span className="text-emerald-500 font-bold mt-0.5">✓</span> {s}
                  </li>
                ))}
              </ul>
            </ClayCard>
          )}
          {score.opportunities.length > 0 && (
            <ClayCard className="p-4 border-stone-200/50" glow="data">
              <p className="text-[10px] font-bold text-blue-600 mb-2.5 uppercase tracking-wider">Opportunities</p>
              <ul className="flex flex-col gap-1.5">
                {score.opportunities.slice(0, 3).map((o, i) => (
                  <li key={i} className="text-[10px] text-stone-500 flex items-start gap-1.5 leading-normal font-semibold">
                    <span className="text-blue-400 font-bold mt-0.5">→</span> {o}
                  </li>
                ))}
              </ul>
            </ClayCard>
          )}
          {score.weaknesses.length > 0 && (
            <ClayCard className="p-4 border-stone-200/50" glow="solar">
              <p className="text-[10px] font-bold text-amber-600 mb-2.5 uppercase tracking-wider">Watch Out</p>
              <ul className="flex flex-col gap-1.5">
                {score.weaknesses.slice(0, 3).map((w, i) => (
                  <li key={i} className="text-[10px] text-stone-500 flex items-start gap-1.5 leading-normal font-semibold">
                    <span className="text-amber-500 font-bold mt-0.5">!</span> {w}
                  </li>
                ))}
              </ul>
            </ClayCard>
          )}
        </div>
      </div>
    </div>
  );
}
