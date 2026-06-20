import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runWhatIfSimulations } from "@/lib/calculations/whatif-simulator";
import { applySecurityHeaders, validateBounds } from "@/lib/validation";
import { checkRateLimit, recordRequest } from "@/lib/rate-limiter";

const schema = z.object({
  roofAreaSqm: z.number().positive(),
  peakSunHoursDaily: z.number().positive(),
  latitude: z.number(),
  monthlyGhi: z.array(z.number()).length(12),
  electricityRatePerUnit: z.number().positive(),
  state: z.string(),
  propertyType: z.string(),
  currentPanelType: z.enum(["mono_perc", "topcon", "hjt", "bifacial"]),
  currentShadingFactor: z.number().min(0).max(1),
  currentCleaning: z.enum(["weekly", "monthly", "rarely"]),
  currentOrientation: z.enum(["south", "east", "west", "north"]),
});

export async function POST(request: NextRequest) {
  const clientId = request.ip ?? "anonymous";
  const rateResult = checkRateLimit(clientId);
  if (!rateResult.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }
  recordRequest(clientId);

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 422 });
  }

  const areaValidation = validateBounds(parsed.data.roofAreaSqm, 50, 50000, "Roof area");
  if (!areaValidation.valid) return NextResponse.json({ error: areaValidation.error }, { status: 422 });

  const scenarios = runWhatIfSimulations(parsed.data);
  const response = NextResponse.json({ data: scenarios });
  return applySecurityHeaders(response);
}
