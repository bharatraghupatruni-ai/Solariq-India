import { NextRequest, NextResponse } from "next/server";
import { applySecurityHeaders } from "@/lib/validation";
import { checkRateLimit, recordRequest } from "@/lib/rate-limiter";

const backendUrl = process.env.PYTHON_BACKEND_URL ?? "http://127.0.0.1:8000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const clientId = request.ip ?? "anonymous";
  const rateResult = checkRateLimit(clientId);
  if (!rateResult.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }
  recordRequest(clientId);

  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(`${backendUrl}/api/prediction/${id}`, {
      headers: {
        "Authorization": authHeader,
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Prediction not found or backend error" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return applySecurityHeaders(NextResponse.json(data));
  } catch (error) {
    console.error("BFF prediction GET error:", error);
    return NextResponse.json({ error: "Backend connection error" }, { status: 502 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const clientId = request.ip ?? "anonymous";
  const rateResult = checkRateLimit(clientId);
  if (!rateResult.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }
  recordRequest(clientId);

  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(`${backendUrl}/api/prediction/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": authHeader,
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to delete prediction from backend" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return applySecurityHeaders(NextResponse.json(data));
  } catch (error) {
    console.error("BFF prediction DELETE error:", error);
    return NextResponse.json({ error: "Backend connection error" }, { status: 502 });
  }
}
