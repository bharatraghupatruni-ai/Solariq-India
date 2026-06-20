import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { applySecurityHeaders, validateBounds } from "@/lib/validation";
import { checkRateLimit, recordRequest } from "@/lib/rate-limiter";

const ML_BACKEND = process.env.ML_BACKEND_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  // Rate limiting
  const clientId = request.ip ?? "anonymous";
  const rateResult = checkRateLimit(clientId);
  if (!rateResult.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }
  recordRequest(clientId);

  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the session token to forward to the Python backend
  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token ?? "";

  try {
    const body = await request.json();

    // Optional: validate lat/lng bounds if present
    if (body.latitude !== undefined) {
      const latV = validateBounds(body.latitude, -90, 90, "Latitude");
      if (!latV.valid) {
        return NextResponse.json({ error: latV.error }, { status: 400 });
      }
    }
    if (body.longitude !== undefined) {
      const lonV = validateBounds(body.longitude, -180, 180, "Longitude");
      if (!lonV.valid) {
        return NextResponse.json({ error: lonV.error }, { status: 400 });
      }
    }

    const backendResponse = await fetch(`${ML_BACKEND}/api/ml/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });

    const data = await backendResponse.json();

    const response = NextResponse.json(data, { status: backendResponse.status });
    return applySecurityHeaders(response);
  } catch (err) {
    console.error("ML predict proxy error:", err);
    return NextResponse.json(
      { error: "ML backend unavailable. Please try again later." },
      { status: 502 }
    );
  }
}
