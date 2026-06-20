import { AnalysisWizard } from "@/components/analysis/AnalysisWizard";

export const metadata = {
  title: "New Analysis — SolarIQ",
};

export default function NewAnalysisPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1a2332]">Solar Feasibility Analysis</h1>
        <p className="text-[#9ba4b0] text-sm mt-1">
          Answer 4 quick questions to get your full solar report
        </p>
      </div>
      <AnalysisWizard />
    </div>
  );
}
