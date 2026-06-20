import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatKwp } from "@/lib/utils/format";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: analyses } = await supabase
    .from("roof_analyses")
    .select(`
      id, status, created_at, completed_at,
      properties ( name, city, state ),
      solar_predictions ( system_capacity_kwp, annual_generation_kwh ),
      suitability_scores ( overall_score, recommendation_level )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const totalAnalyses = analyses?.length ?? 0;
  const completedAnalyses = analyses?.filter((a: any) => a.status === "completed").length ?? 0;

  // Count unique cities
  const uniqueCities = new Set(
    analyses?.map((a: any) => {
      const prop = Array.isArray(a.properties) ? a.properties[0] : a.properties;
      return prop?.city?.toLowerCase();
    }).filter(Boolean)
  );
  const citiesCount = uniqueCities.size;

  const fullName = user?.user_metadata?.full_name || "Premium Member";
  const firstName = fullName.split(" ")[0];

  return (
    <div className="flex flex-col gap-12 text-on-surface">
      {/* Dashboard Header */}
      <section>
        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <span className="font-label-md text-xs text-primary uppercase tracking-[0.2em] font-semibold">
              Operational Overview
            </span>
            <h1 className="font-headline-lg text-4xl font-bold text-on-surface mt-2 font-serif">
              Welcome back, {firstName}.
            </h1>
            <p className="font-body-md text-on-surface-variant mt-2 max-w-2xl text-stone-500">
              Your solar asset simulations are performing within optimal parameters. You have 1,250 Solar Credits remaining for high-fidelity spectral analysis.
            </p>
          </div>
          <div className="flex gap-4">
            <Link href="/analysis/new">
              <button className="px-6 py-3 bg-[#fcdf46] text-[#6d5e00] rounded-full font-bold font-label-md text-xs tracking-wider uppercase hover:shadow-md transition-all cursor-pointer">
                New Simulation
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Row */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Analyses Run */}
        <div className="glass-card rounded-[24px] overflow-hidden relative group p-8">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-[80px]">analytics</span>
          </div>
          <div>
            <span className="font-label-md text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
              Analyses Run
            </span>
            <div className="font-data-display text-4xl font-bold text-primary mt-2">
              {totalAnalyses.toString().padStart(2, "0")}
            </div>
            <div className="mt-4 flex items-center gap-2 text-primary font-bold text-sm">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              <span>+4 this month</span>
            </div>
          </div>
        </div>

        {/* Card 2: Reports Downloaded */}
        <div className="glass-card rounded-[24px] overflow-hidden relative group p-8">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-[80px]">description</span>
          </div>
          <div>
            <span className="font-label-md text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
              Reports Downloaded
            </span>
            <div className="font-data-display text-4xl font-bold text-primary mt-2">
              {completedAnalyses.toString().padStart(2, "0")}
            </div>
            <div className="mt-4 flex items-center gap-2 text-on-surface-variant font-bold text-sm">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              <span>All systems verified</span>
            </div>
          </div>
        </div>

        {/* Card 3: Properties Analyzed */}
        <div className="glass-card rounded-[24px] overflow-hidden relative group p-8">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-[80px]">location_on</span>
          </div>
          <div>
            <span className="font-label-md text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
              Properties Analyzed
            </span>
            <div className="font-data-display text-4xl font-bold text-primary mt-2">
              {citiesCount.toString().padStart(2, "0")}
            </div>
            <div className="mt-4 flex items-center gap-2 text-primary font-bold text-sm">
              <span className="material-symbols-outlined text-sm">explore</span>
              <span>
                {citiesCount > 0
                  ? Array.from(uniqueCities)
                      .map((c: any) => c.charAt(0).toUpperCase() + c.slice(1))
                      .slice(0, 2)
                      .join(" & ") + " Regions"
                  : "No Regions Yet"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid: Recent Analyses */}
      <section className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h2 className="font-headline-md text-2xl font-bold text-on-surface font-serif">Recent Analyses</h2>
          {totalAnalyses > 0 && (
            <Link href="/reports">
              <button className="text-primary font-label-md text-xs font-bold flex items-center gap-1 group cursor-pointer">
                View Archive
                <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">
                  arrow_forward
                </span>
              </button>
            </Link>
          )}
        </div>

        {totalAnalyses === 0 ? (
          /* Empty State */
          <div className="glass-card p-12 rounded-[32px] border-2 border-dashed border-primary/20 flex flex-col items-center justify-center text-center group hover:border-primary/40 transition-all">
            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-primary text-4xl">add_circle</span>
            </div>
            <h3 className="font-headline-md text-xl font-bold text-on-surface font-serif">New Analysis</h3>
            <p className="font-body-sm text-sm text-on-surface-variant mt-2 max-w-[260px] text-stone-500">
              Simulate a new property with AI-driven irradiation mapping.
            </p>
            <Link href="/analysis/new" className="mt-6">
              <button className="btn-primary cursor-pointer">
                Run First Analysis
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </Link>
          </div>
        ) : (
          /* Analysis List */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {analyses?.map((analysis: any) => {
              const prop = (Array.isArray(analysis.properties) ? analysis.properties[0] : analysis.properties) as {
                name: string;
                city: string;
                state: string;
                property_type: string;
              } | null;
              const solar = (Array.isArray(analysis.solar_predictions)
                ? analysis.solar_predictions[0]
                : analysis.solar_predictions) as {
                system_capacity_kwp: number;
                annual_generation_kwh: number;
              } | null;
              const score = (Array.isArray(analysis.suitability_scores)
                ? analysis.suitability_scores[0]
                : analysis.suitability_scores) as {
                overall_score: number;
                recommendation_level: string;
              } | null;

              const isCompleted = analysis.status === "completed";
              const overallScore = score?.overall_score ?? 0;

              return (
                <Link key={analysis.id} href={`/analysis/${analysis.id}`}>
                  <div className="glass-card p-8 rounded-3xl border border-white/40 flex flex-col hover:shadow-xl transition-all duration-500 cursor-pointer h-full group">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <span className="font-label-md text-xs text-primary font-bold">Property</span>
                        <h3 className="font-headline-md text-lg font-bold mt-1 group-hover:text-primary transition-colors font-serif">
                          {prop?.name ?? "Analysis"}
                        </h3>
                      </div>
                      <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary animate-hover">
                        <span className="material-symbols-outlined">
                          {prop?.property_type === "industrial"
                            ? "factory"
                            : prop?.property_type === "commercial"
                            ? "business"
                            : "solar_power"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4 mb-8">
                      <div className="flex justify-between border-b border-outline-variant/20 pb-2">
                        <span className="font-body-sm text-sm text-on-surface-variant">System Size</span>
                        <span className="font-label-md text-sm font-bold">
                          {isCompleted && solar ? formatKwp(solar.system_capacity_kwp) : "Pending"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-outline-variant/20 pb-2">
                        <span className="font-body-sm text-sm text-on-surface-variant">Suitability</span>
                        <span
                          className={`font-bold font-label-md text-xs px-2 py-0.5 rounded ${
                            overallScore >= 75
                              ? "text-primary bg-primary/10"
                              : overallScore >= 55
                              ? "text-blue-700 bg-blue-50"
                              : "text-amber-800 bg-amber-50"
                          }`}
                        >
                          {isCompleted
                            ? score?.recommendation_level || "Recommended"
                            : analysis.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="mt-auto flex items-center gap-6">
                      {isCompleted && score ? (
                        <>
                          <div className="relative w-16 h-16 flex-shrink-0">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                              <circle
                                className="stroke-stone-200/50"
                                cx="18"
                                cy="18"
                                fill="none"
                                r="15.9155"
                                strokeWidth="3"
                              />
                              <circle
                                className="stroke-primary"
                                cx="18"
                                cy="18"
                                fill="none"
                                r="15.9155"
                                strokeDasharray={`${overallScore}, 100`}
                                strokeWidth="3"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center font-bold text-sm">
                              {overallScore}
                            </div>
                          </div>
                          <div>
                            <span className="font-label-md text-xs text-on-surface-variant block">SolarIQ Score</span>
                            <span className="font-body-sm text-xs text-primary font-medium">
                              {overallScore >= 75 ? "Top 5% ROI" : "Optimal Area Sync"}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="text-xs text-stone-400 font-semibold italic flex items-center gap-2">
                          <span className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                          Processing feasibility analysis...
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}

            {/* New Simulation Card */}
            <Link href="/analysis/new">
              <div className="glass-card p-8 rounded-3xl border-2 border-dashed border-primary/20 flex flex-col items-center justify-center text-center group hover:border-primary/40 transition-all cursor-pointer h-full min-h-[280px]">
                <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-primary text-3xl">add_circle</span>
                </div>
                <h3 className="font-headline-md text-lg font-bold text-on-surface font-serif">New Simulation</h3>
                <p className="font-body-sm text-xs text-on-surface-variant mt-2 max-w-[200px] text-stone-500">
                  Simulate a new property with AI-driven irradiation mapping.
                </p>
              </div>
            </Link>
          </div>
        )}
      </section>

      {/* Visual Context Image Section */}
      <section className="mt-6">
        <div className="w-full h-[400px] rounded-[40px] overflow-hidden relative shadow-2xl">
          <img
            alt="Sustainable Future"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCUl8V4aeGkZdbOZX3_2WxjgJzIEek-rIYOsWBjxlTVV7rscKb29RJpjodRy86_DetQB4vwR3EiK7MeYZxvPEEXL6UuGKvYsnpL6kB8_r89nEHvW9zj8mrF12RPipiWPBMJIQds8PoAThRyH_JJZf-f4Eqh0m2I8rsJKGTZABtGHPkYO_zeyr4Ha03Eu5GpGXAZNV8ySFIA6gjSKR80eF-djX8g9NAXNpTNwclSoXqVWFO42exfHhePYIU0-KeFOWCGzHOAZKSvHY0"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/30 to-transparent flex items-end p-12">
            <div>
              <h2 className="font-headline-lg text-4xl font-bold text-white font-serif">Visualizing a Greener India.</h2>
              <p className="font-body-lg text-base text-white/80 mt-4 max-w-xl">
                Every simulation brings us closer to a decentralized, sustainable grid. Use your credits to unlock &apos;Weather AI&apos; forecasting for any project.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
