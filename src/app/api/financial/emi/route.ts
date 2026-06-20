import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { calculateEMI } from "@/lib/calculations/emi-calculator";
import { applySecurityHeaders, validateBounds } from "@/lib/validation";
import { checkRateLimit, recordRequest } from "@/lib/rate-limiter";

const schema = z.object({
  loanAmountInr: z.number().positive(),
  interestRatePct: z.number().min(1).max(30),
  tenureYears: z.number().int().min(1).max(25),
  annualSavingsInr: z.number().positive(),
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

  const loanValidation = validateBounds(parsed.data.loanAmountInr, 10000, 50000000, "Loan amount");
  if (!loanValidation.valid) return NextResponse.json({ error: loanValidation.error }, { status: 422 });

  const result = calculateEMI(parsed.data);
  const response = NextResponse.json({ data: result });
  return applySecurityHeaders(response);
}
