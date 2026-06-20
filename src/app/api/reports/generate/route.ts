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
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const analysisId = searchParams.get("analysisId");
  if (!analysisId) {
    return NextResponse.json({ error: "analysisId query parameter required" }, { status: 400 });
  }

  // Verify the user owns this analysis
  const { data: analysis } = await supabase
    .from("roof_analyses")
    .select("id, user_id, property_id")
    .eq("id", analysisId)
    .eq("user_id", user.id)
    .single();

  if (!analysis) {
    return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
  }

  // Try Python backend for PDF generation first
  const ML_BACKEND = process.env.ML_BACKEND_URL || "http://localhost:8000";
  try {
    const authHeader = request.headers.get("authorization") || "";
    const pdfResponse = await fetch(`${ML_BACKEND}/api/reports/pdf/${analysisId}`, {
      headers: { "Authorization": authHeader },
      signal: AbortSignal.timeout(30000),
    });

    if (pdfResponse.ok) {
      const pdfBuffer = await pdfResponse.arrayBuffer();
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename=SolarAI_India_Report_${analysisId}.pdf`,
        },
      });
    }
  } catch (pdfErr) {
    console.warn("PDF backend unavailable, falling back to JSON report:", pdfErr);
  }

  // Fallback: Fetch all related data and return as JSON
  const [propertyRes, inputRes, solarRes, financialRes, scoreRes, weatherRes] = await Promise.all([
    supabase.from("properties").select("*").eq("id", analysis.property_id ?? "").single(),
    supabase.from("user_inputs").select("*").eq("roof_analysis_id", analysisId).single(),
    supabase.from("solar_predictions").select("*").eq("roof_analysis_id", analysisId).single(),
    supabase.from("financial_analyses").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).single(),
    supabase.from("suitability_scores").select("*").eq("roof_analysis_id", analysisId).single(),
    supabase.from("weather_cache").select("*").order("fetched_at", { ascending: false }).limit(1).single(),
  ]);

  // Build report data
  const reportData = {
    analysisId,
    generatedAt: new Date().toISOString(),
    property: propertyRes.data,
    userInput: inputRes.data,
    solarPrediction: solarRes.data,
    financialAnalysis: financialRes.data,
    suitabilityScore: scoreRes.data,
    weatherData: weatherRes.data,
  };

  // Store report record
  const { data: report } = await supabase
    .from("reports")
    .insert({
      user_id: user.id,
      roof_analysis_id: analysisId,
      report_type: "full",
    })
    .select()
    .single();

  const response = NextResponse.json({
    data: reportData,
    reportId: report?.id,
    message: "Report data generated (PDF backend was unavailable).",
  });

  return applySecurityHeaders(response);
}
