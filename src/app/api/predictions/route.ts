import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { applySecurityHeaders } from "@/lib/validation";
import { checkRateLimit, recordRequest } from "@/lib/rate-limiter";

export async function GET(request: NextRequest) {
  const clientId = request.ip ?? "anonymous";
  const rateResult = checkRateLimit(clientId);
  if (!rateResult.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }
  recordRequest(clientId);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const rawLimit = parseInt(searchParams.get("limit") ?? "10", 10);
  const rawOffset = parseInt(searchParams.get("offset") ?? "0", 10);
  const limit = Math.min(Number.isFinite(rawLimit) ? Math.max(rawLimit, 1) : 10, 50);
  const offset = Number.isFinite(rawOffset) ? Math.max(rawOffset, 0) : 0;

  const { data: predictions, error } = await supabase
    .from("roof_analyses")
    .select(`
      id, status, created_at, completed_at,
      properties ( name, city, state ),
      solar_predictions (
        system_capacity_kwp, annual_generation_kwh, prediction_confidence, recommended_panel_type,
        financial_analyses ( net_investment_inr, payback_period_years, roi_percentage, savings_25yr_inr )
      ),
      suitability_scores ( overall_score, recommendation_level )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch predictions" }, { status: 500 });
  }

  const { count } = await supabase
    .from("roof_analyses")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const response = NextResponse.json({
    data: predictions,
    pagination: { total: count ?? 0, limit, offset },
  });

  return applySecurityHeaders(response);
}
