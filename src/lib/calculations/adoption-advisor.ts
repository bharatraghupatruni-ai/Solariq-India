/**
 * Solar Adoption Advisor
 * Generates homeowner-friendly verdicts with financial,
 * environmental, and technical reasoning.
 * No LLM APIs — purely calculation-based.
 */

export interface AdoptionAdvisorInput {
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

export interface AdoptionAdvisorResult {
  verdict: "install_now" | "install_after_improvements" | "not_recommended";
  headline: string;
  financialReasoning: string;
  environmentalReasoning: string;
  technicalReasoning: string;
  finalVerdict: string;
}

export function generateAdoptionAdvice(input: AdoptionAdvisorInput): AdoptionAdvisorResult {
  const verdict: AdoptionAdvisorResult["verdict"] =
    input.readinessScore >= 70 ? "install_now"
    : input.readinessScore >= 40 ? "install_after_improvements"
    : "not_recommended";

  // Financial reasoning
  const payback = input.paybackYears.toFixed(1);
  const savings = (input.annualSavingsInr / 1000).toFixed(1);
  const subsidy = (input.subsidyInr / 1000).toFixed(1);
  const investment = (input.netInvestmentInr / 100000).toFixed(2);

  const financialReasoning = verdict === "install_now"
    ? `With a payback period of ${payback} years and annual savings of ₹${savings}K, the investment of ₹${investment}L (after ₹${subsidy}K subsidy) generates an ROI of ${input.roiPercentage.toFixed(0)}%. Electricity tariffs in India rise ~6% yearly, making savings grow over time.`
    : verdict === "install_after_improvements"
    ? `Your current configuration yields a ${payback}-year payback. After addressing orientation or shading constraints, payback could drop below 5 years. The ₹${subsidy}K PM Surya Ghar subsidy significantly reduces your effective cost.`
    : `At a ${payback}-year payback with current constraints, solar is not cost-effective. Wait for lower panel prices or address roof limitations before investing ₹${investment}L.`;

  // Environmental reasoning
  const trees = Math.round(input.co2OffsetKg / 21.77);
  const tonnes = (input.co2OffsetKg / 1000).toFixed(2);

  const environmentalReasoning = `Your system would offset ${tonnes} tonnes of CO₂ annually — equivalent to planting ${trees} trees per year. Over 25 years, that's ${(input.co2OffsetKg * 25 / 1000).toFixed(0)} tonnes of CO₂ prevented from entering the atmosphere. India's grid emission factor is 0.82 kg CO₂/kWh — every solar kWh directly displaces fossil fuel generation.`;

  // Technical reasoning
  const orientLabel = input.orientation.charAt(0).toUpperCase() + input.orientation.slice(1);
  const shadingLabel = input.shading === "none" ? "no shading" : input.shading === "partial" ? "some shading" : "significant shading";
  const ghiLabel = input.annualGhi > 1900 ? "excellent" : input.annualGhi > 1500 ? "good" : "moderate";

  const technicalReasoning = verdict === "install_now"
    ? `Your ${orientLabel}-facing roof with ${input.roofArea} m² area receives ${ghiLabel} solar irradiance (${input.annualGhi} kWh/m²/year). With ${shadingLabel}, your system will perform at near-optimal efficiency.`
    : verdict === "install_after_improvements"
    ? `Your ${orientLabel}-facing ${input.roofArea} m² roof has ${ghiLabel} irradiance but ${shadingLabel}. Addressing ${input.shading !== "none" ? "shading constraints" : "orientation"} could boost output by 10-20%.`
    : `Your ${input.roofArea} m² roof with ${shadingLabel} and ${orientLabel} orientation limits system capacity. Consider whether roof modifications could improve the technical feasibility.`;

  // Final verdict
  const finalVerdict = verdict === "install_now"
    ? `Based on your roof orientation, available area, and local solar irradiance, solar installation is strongly recommended. Install now to start saving ₹${savings}K/year.`
    : verdict === "install_after_improvements"
    ? `Solar is viable but has room for improvement. Address the identified constraints first, then install for optimal returns of ₹${savings}K+/year.`
    : `Solar installation is not recommended at this time due to multiple constraints. Reassess in 1-2 years as technology improves and costs decline.`;

  const headline = verdict === "install_now"
    ? "Solar Installation Strongly Recommended"
    : verdict === "install_after_improvements"
    ? "Solar Recommended After Improvements"
    : "Solar Not Recommended Currently";

  return { verdict, headline, financialReasoning, environmentalReasoning, technicalReasoning, finalVerdict };
}
