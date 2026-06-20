import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatKwp, formatKwh } from "@/lib/utils/format";

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: analyses } = await supabase
    .from("roof_analyses")
    .select(`
      id, status, created_at, completed_at,
      properties ( name, city, state, property_type ),
      solar_predictions ( system_capacity_kwp, annual_generation_kwh ),
      suitability_scores ( overall_score, recommendation_level )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-12 text-on-surface">
      {/* Header */}
      <div>
        <span className="font-label-md text-xs text-primary uppercase tracking-[0.2em] font-semibold">
          Saved Simulates
        </span>
        <h1 className="font-headline-lg text-4xl font-bold text-on-surface mt-2 font-serif">
          My Solar Reports
        </h1>
        <p className="font-body-md text-stone-500 text-sm mt-2 max-w-2xl">
          Access, manage, and view your generated solar feasibility reports.
        </p>
      </div>

      {/* Reports List */}
      {!analyses || analyses.length === 0 ? (
        <div className="glass-card p-16 rounded-[32px] border-2 border-dashed border-primary/20 flex flex-col items-center justify-center text-center group hover:border-primary/40 transition-all">
          <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-primary text-3xl">description</span>
          </div>
          <h3 className="font-headline-md text-lg font-bold text-on-surface font-serif">No Reports Found</h3>
          <p className="font-body-sm text-xs text-on-surface-variant mt-2 max-w-[260px] text-stone-500">
            You haven&apos;t run any roof analyses yet. Start one now to generate a report.
          </p>
          <Link href="/analysis/new" className="mt-6">
            <button className="btn-primary cursor-pointer">
              Run First Analysis
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {analyses.map((analysis: any) => {
            const prop = Array.isArray(analysis.properties) ? analysis.properties[0] : analysis.properties;
            const pred = Array.isArray(analysis.solar_predictions)
              ? analysis.solar_predictions[0]
              : analysis.solar_predictions;
            const score = Array.isArray(analysis.suitability_scores)
              ? analysis.suitability_scores[0]
              : analysis.suitability_scores;
            const isCompleted = analysis.status === "completed";
            const overallScore = score?.overall_score ?? 0;

            const formattedDate = analysis.created_at
              ? new Date(analysis.created_at).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : "N/A";

            return (
              <div
                key={analysis.id}
                className="glass-card p-8 rounded-3xl border border-white/40 flex flex-col justify-between gap-6 hover:shadow-xl transition-all duration-500 text-left group"
              >
                <div>
                  <div className="flex justify-between items-start mb-2 gap-3">
                    <h3 className="font-headline-md text-lg font-bold text-primary truncate max-w-[70%] font-serif">
                      {prop?.name || "Unnamed Property"}
                    </h3>
                    <span
                      className={`text-[9px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                        isCompleted
                          ? "bg-primary/5 text-primary border border-primary/10"
                          : "bg-amber-50 text-amber-800 border border-amber-100"
                      }`}
                    >
                      {analysis.status}
                    </span>
                  </div>

                  <p className="text-xs text-stone-400 flex items-center gap-1.5 mb-4 font-semibold">
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    {prop?.city
                      ? `${prop.city.charAt(0).toUpperCase() + prop.city.slice(1)}, ${prop.state.replace(
                          /_/g,
                          " "
                        )}`
                      : "Location not set"}
                  </p>

                  <div className="grid grid-cols-2 gap-4 my-2 border-t border-stone-200/30 pt-4">
                    <div>
                      <p className="text-[9px] uppercase font-bold tracking-wider text-stone-400">
                        System Capacity
                      </p>
                      <p className="text-sm font-bold text-primary mt-0.5">
                        {isCompleted && pred?.system_capacity_kwp
                          ? formatKwp(pred.system_capacity_kwp)
                          : "Pending"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase font-bold tracking-wider text-stone-400">
                        Annual Generation
                      </p>
                      <p className="text-sm font-bold text-primary mt-0.5">
                        {isCompleted && pred?.annual_generation_kwh
                          ? formatKwh(pred.annual_generation_kwh)
                          : "Pending"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-stone-200/30 pt-4">
                  <div className="flex items-center gap-1.5 text-stone-400">
                    <span className="material-symbols-outlined text-sm">calendar_month</span>
                    <span className="text-xs font-semibold">{formattedDate}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {isCompleted && score && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-stone-400 font-semibold">Score:</span>
                        <span className="text-sm font-bold text-primary">{overallScore}</span>
                      </div>
                    )}
                    <Link href={`/analysis/${analysis.id}`}>
                      <button className="px-5 py-2 bg-primary text-white hover:opacity-95 rounded-full font-bold text-xs uppercase tracking-wider transition-all cursor-pointer">
                        View Report
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
