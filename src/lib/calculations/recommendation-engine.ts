/**
 * AI Recommendation Engine
 * Rules-based engine generating actionable solar recommendations
 * No LLM APIs — purely calculation-based
 */

import type { SolarReadinessInput } from "./solar-readiness";
import type { HealthIndexInput } from "./health-index";

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: "install" | "optimize" | "maintain" | "finance" | "caution";
  priority: "critical" | "high" | "medium" | "low";
  impact: string;
  actionLabel: string;
}

export interface RecommendationResult {
  recommendations: Recommendation[];
  verdict: "install_now" | "install_after_improvements" | "not_recommended";
  verdictReason: string;
  topAction: string;
}

interface RecommendationContext {
  readinessInput: SolarReadinessInput;
  healthInput: HealthIndexInput;
  readinessScore: number;
  healthScore: number;
  paybackYears: number;
  roiPercentage: number;
  monthlyBillInr: number;
  annualSavingsInr: number;
  netInvestmentInr: number;
}

export function generateRecommendations(ctx: RecommendationContext): RecommendationResult {
  const recommendations: Recommendation[] = [];

  // Rule 1: Install Immediately
  if (ctx.readinessScore >= 75 && ctx.paybackYears <= 6) {
    recommendations.push({
      id: "rec-install-now",
      title: "Install Solar Immediately",
      description: `With a readiness score of ${ctx.readinessScore}/100 and payback in ${ctx.paybackYears.toFixed(1)} years, solar installation is strongly recommended.`,
      category: "install",
      priority: "critical",
      impact: `Save ₹${(ctx.annualSavingsInr / 1000).toFixed(0)}K/year`,
      actionLabel: "Start Installation",
    });
  }

  // Rule 2: Reduce Shading
  if (ctx.readinessInput.shading === "heavy" || ctx.readinessInput.shading === "partial") {
    const improvement = ctx.readinessInput.shading === "heavy" ? "18%" : "8%";
    recommendations.push({
      id: "rec-shading",
      title: "Reduce Shading",
      description: `Heavy shading reduces solar output by up to ${improvement}. Trim trees or relocate rooftop objects.`,
      category: "optimize",
      priority: "high",
      impact: `+${improvement} generation`,
      actionLabel: "Plan Shading Removal",
    });
  }

  // Rule 3: Use Mono PERC Panels
  const PANEL_TOP_TIER = new Set(["mono_perc", "topcon", "hjt", "bifacial", "mono"]);
  if (!PANEL_TOP_TIER.has(ctx.readinessInput.panelType)) {
    recommendations.push({
      id: "rec-mono-panel",
      title: "Upgrade to Mono PERC Panels",
      description: "Premium mono/TOPCon/HJT panels offer 20%+ efficiency and are the most cost-effective option in India.",
      category: "optimize",
      priority: "medium",
      impact: "+₹6,500 annual savings",
      actionLabel: "Compare Panel Types",
    });
  }

  // Rule 4: Increase Cleaning Frequency
  if (ctx.readinessInput.cleaning === "rarely" || ctx.readinessInput.cleaning === "monthly") {
    const improvement = ctx.readinessInput.cleaning === "rarely" ? "12%" : "5%";
    recommendations.push({
      id: "rec-cleaning",
      title: "Increase Cleaning Frequency",
      description: `Weekly cleaning improves generation by up to ${improvement} compared to current schedule.`,
      category: "maintain",
      priority: "medium",
      impact: `+${improvement} generation`,
      actionLabel: "Schedule Cleaning",
    });
  }

  // Rule 5: Expand Roof Usage
  if (ctx.readinessInput.roofArea < 80) {
    recommendations.push({
      id: "rec-expand-roof",
      title: "Expand Roof Usage",
      description: "Consider using unused roof sections or adjacent structures for additional panels.",
      category: "optimize",
      priority: "low",
      impact: "More capacity",
      actionLabel: "Assess Roof Options",
    });
  }

  // Rule 6: Environment — Dust concern
  if (ctx.readinessInput.environment === "dusty" || ctx.readinessInput.environment === "urban_smog") {
    recommendations.push({
      id: "rec-anti-soiling",
      title: "Apply Anti-Soiling Coating",
      description: "Anti-soiling coating reduces dust accumulation by 30%, reducing cleaning frequency needs.",
      category: "maintain",
      priority: "medium",
      impact: "+5% output",
      actionLabel: "Learn More",
    });
  }

  // Rule 7: Not Recommended
  if (ctx.readinessScore < 30) {
    recommendations.push({
      id: "rec-not-recommended",
      title: "Not Recommended at This Time",
      description: "Multiple constraints make solar unviable. Reassess in 2-3 years as technology costs decline.",
      category: "caution",
      priority: "critical",
      impact: "Wait for improvements",
      actionLabel: "Set Reminder",
    });
  }

  // Rule 8: Financial — EMI option
  if (ctx.netInvestmentInr > 50000 && ctx.monthlyBillInr > 2000) {
    recommendations.push({
      id: "rec-emi",
      title: "Consider Solar Loan/EMI",
      description: `With EMI, your monthly outflow can be less than your current bill of ₹${ctx.monthlyBillInr}.`,
      category: "finance",
      priority: "medium",
      impact: "₹0 upfront cost",
      actionLabel: "Calculate EMI",
    });
  }

  // Rule 9: Orientation improvement
  if (ctx.readinessInput.orientation !== "south") {
    const loss = ctx.readinessInput.orientation === "north" ? "20%" : ctx.readinessInput.orientation === "east" ? "8%" : "12%";
    recommendations.push({
      id: "rec-orientation",
      title: "Optimize Panel Orientation",
      description: `South-facing panels generate significantly more. Your ${ctx.readinessInput.orientation}-facing roof loses ~${loss}.`,
      category: "optimize",
      priority: "high",
      impact: `+${loss} with south-facing`,
      actionLabel: "Review Layout",
    });
  }

  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // Determine verdict
  const verdict: RecommendationResult["verdict"] =
    ctx.readinessScore >= 70 ? "install_now"
    : ctx.readinessScore >= 40 ? "install_after_improvements"
    : "not_recommended";

  const verdictReason = verdict === "install_now"
    ? "Based on your roof orientation, available area, and local solar irradiance, solar installation is strongly recommended."
    : verdict === "install_after_improvements"
    ? "Solar is viable but has some constraints. Address the top recommendations to improve returns significantly."
    : "Multiple constraints make solar less viable currently. Consider addressing the issues above and reassessing in 1-2 years.";

  const topAction = recommendations[0]?.actionLabel ?? "Get Solar Assessment";

  return { recommendations, verdict, verdictReason, topAction };
}
