"use client";

import { ClayCard } from "@/components/ui/ClayCard";
import { generateAdoptionAdvice, type AdoptionAdvisorResult } from "@/lib/calculations/adoption-advisor";

interface Props {
  orientation: string;
  roofArea: number;
  annualGhi: number;
  shading: string;
  panelType: string;
  paybackYears: number;
  annualSavingsInr: number;
  netInvestmentInr: number;
  roiPercentage: number;
  subsidyInr: number;
  co2OffsetKg: number;
  readinessScore: number;
}

function asText(v: any) {
  return (v === null || v === undefined) ? "" : String(v);
}

const VERDICT_STYLES: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  install_now:                { bg: "bg-emerald-50",  text: "text-emerald-700",  border: "border-emerald-200", icon: "✓" },
  install_after_improvements: { bg: "bg-amber-50",    text: "text-amber-700",    border: "border-amber-200",   icon: "→" },
  not_recommended:            { bg: "bg-red-50",      text: "text-red-700",      border: "border-red-200",     icon: "✕" },
};

function ReasonBlock(props: { title: string; body: string; icon: string }) {
  return (
    <div className="p-3 rounded-[12px] border border-stone-200/50 bg-stone-50/40 hover:bg-stone-50/70 transition-all duration-200">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base">{asText(props.icon)}</span>
        <p className="text-[10px] font-bold text-[#1c1917] uppercase tracking-wide">{asText(props.title)}</p>
      </div>
      <p className="text-xs text-stone-500 leading-relaxed font-medium">{asText(props.body)}</p>
    </div>
  );
}

export function AdoptionAdvisorCard(input: Props) {
  const result: AdoptionAdvisorResult = generateAdoptionAdvice(input);
  const style = VERDICT_STYLES[result.verdict] || VERDICT_STYLES.install_after_improvements;

  return (
    <ClayCard glow="eco" className="border-stone-200/50 text-[#292524]">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-xs text-stone-400 uppercase tracking-wide font-semibold">Adoption Advisor</p>
          <h3 className="text-lg font-bold text-[#1c1917]">Homeowner Verdict</h3>
        </div>

        <div className={"flex items-center gap-4 p-5 rounded-[14px] border " + style.bg + " " + style.border}>
          <div className={"w-14 h-14 rounded-full flex items-center justify-center text-3xl font-bold bg-white shadow-sm shrink-0 " + style.text}>
            {asText(style.icon)}
          </div>
          <div className="flex-1">
            <p className={"text-base font-bold " + style.text}>{asText(result.headline)}</p>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed font-medium">{asText(result.finalVerdict)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <ReasonBlock title="Financial" body={result.financialReasoning} icon="💰" />
          <ReasonBlock title="Environmental" body={result.environmentalReasoning} icon="🌱" />
          <ReasonBlock title="Technical" body={result.technicalReasoning} icon="⚡" />
        </div>
      </div>
    </ClayCard>
  );
}
