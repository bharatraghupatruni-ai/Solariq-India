import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { calculateFinancials } from "@/lib/calculations/financial-engine";
import { applySecurityHeaders, validateBounds } from "@/lib/validation";
import { checkRateLimit, recordRequest } from "@/lib/rate-limiter";

const schema = z.object({
  capacityKwp: z.number().positive(),
  annualGenerationKwh: z.number().positive(),
  electricityRatePerUnit: z.number().positive(),
  state: z.string(),
  propertyType: z.enum(["residential", "commercial", "industrial", "agricultural"]),
  panelType: z.enum(["polycrystalline", "monocrystalline", "topcon", "bifacial", "thin_film"]),
  electricityInflationRate: z.number().min(0).max(0.3).optional(),
  discountRate: z.number().min(0).max(0.3).optional(),
  degradationRate: z.number().min(0).max(0.05).optional(),
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
  const capacityValidation = validateBounds(input.capacityKwp, 0.1, 1000, "Capacity (kWp)");
  if (!capacityValidation.valid) {
    return NextResponse.json({ error: capacityValidation.error }, { status: 422 });
  }

  const generationValidation = validateBounds(input.annualGenerationKwh, 0, 1_000_000, "Annual generation (kWh)");
  if (!generationValidation.valid) {
    return NextResponse.json({ error: generationValidation.error }, { status: 422 });
  }

  const result = calculateFinancials({
    capacityKwp: input.capacityKwp,
    annualGenerationKwh: input.annualGenerationKwh,
    electricityRatePerUnit: input.electricityRatePerUnit,
    state: input.state,
    propertyType: input.propertyType,
    panelType: input.panelType as any,
    electricityInflationRate: input.electricityInflationRate ?? 0.06,
    discountRate: input.discountRate ?? 0.08,
    degradationRate: input.degradationRate ?? 0.005,
  });

  const response = NextResponse.json({ data: result });
  return applySecurityHeaders(response);
}
