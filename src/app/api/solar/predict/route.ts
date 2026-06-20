import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { calculateSolarGeneration, selectOptimalPanelType } from "@/lib/calculations/solar-engine";
import { applySecurityHeaders, validateBounds, sanitizeString } from "@/lib/validation";
import { checkRateLimit, recordRequest } from "@/lib/rate-limiter";

const schema = z.object({
  roofAreaSqm: z.number().positive(),
  usableAreaRatio: z.number().min(0.1).max(1).optional(),
  peakSunHoursDaily: z.number().positive(),
  panelType: z.enum(["mono_perc", "topcon", "hjt", "bifacial"]).optional(),
  latitude: z.number(),
  shadingFactor: z.number().min(0).max(1).optional(),
  tiltAngle: z.number().min(0).max(90).optional(),
  azimuthAngle: z.number().min(0).max(360).optional(),
  monthlyGhi: z.array(z.number()).length(12).optional(),
  budget: z.number().positive().optional(),
});

export async function POST(request: NextRequest) {
  // Rate limiting
  const clientId = request.ip ?? "anonymous";
  const rateResult = checkRateLimit(clientId);
  if (!rateResult.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      { status: 429, headers: { "Retry-After": String(rateResult.retryAfter ?? 0) } },
    );
  }
  recordRequest(clientId);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const input = parsed.data;

  // Validate bounds
  const areaValidation = validateBounds(input.roofAreaSqm, 50, 50000, "Roof area (sqm)");
  if (!areaValidation.valid) {
    return NextResponse.json({ error: areaValidation.error }, { status: 422 });
  }

  const panelType =
    input.panelType ??
    selectOptimalPanelType(input.roofAreaSqm, input.budget ?? 500000, input.latitude);

  const result = calculateSolarGeneration({
    roofAreaSqm: input.roofAreaSqm,
    usableAreaRatio: input.usableAreaRatio ?? 0.70,
    peakSunHoursDaily: input.peakSunHoursDaily,
    systemEfficiency: 0.80,
    panelType,
    latitude: input.latitude,
    shadingFactor: input.shadingFactor ?? 0.05,
    tiltAngle: input.tiltAngle ?? 15,
    azimuthAngle: input.azimuthAngle ?? 180,
    monthlyGhi: input.monthlyGhi ?? [],
  });

  const response = NextResponse.json({ data: result, panelType });
  return applySecurityHeaders(response);
}
