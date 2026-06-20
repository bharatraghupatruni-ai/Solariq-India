import { NextRequest, NextResponse } from "next/server";
import { applySecurityHeaders } from "@/lib/validation";
import { checkRateLimit, recordRequest } from "@/lib/rate-limiter";
import pincodeData from "@/lib/constants/pincode_data.json";

export async function GET(request: NextRequest) {
  // Rate limiting
  const clientId = request.ip ?? "anonymous";
  const rateResult = checkRateLimit(clientId);
  if (!rateResult.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }
  recordRequest(clientId);

  const { searchParams } = request.nextUrl;
  const pincode = searchParams.get("pincode");

  if (!pincode) {
    return NextResponse.json({ error: "pincode query parameter required" }, { status: 400 });
  }

  try {
    const data = pincodeData as { s: string[], p: Record<string, number[]> };
    const entry = data.p[pincode];

    if (entry) {
      const city = data.s[entry[0]];
      const district = data.s[entry[1]];
      const state = data.s[entry[2]];

      const response = NextResponse.json({
        city,
        district,
        state,
        latitude: 20.5937,
        longitude: 78.9629,
        pincode
      });
      return applySecurityHeaders(response);
    } else {
      return NextResponse.json({ error: "Please enter a valid 6-digit Indian pincode" }, { status: 404 });
    }
  } catch (err) {
    console.error("Pincode lookup error:", err);
    return NextResponse.json(
      { error: "Pincode lookup service unavailable. Please try again later." },
      { status: 500 }
    );
  }
}
