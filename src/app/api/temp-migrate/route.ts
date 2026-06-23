import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Return the keys of all environment variables to see if database credentials exist
  const keys = Object.keys(process.env);
  
  // Also return values of variables that contain "DB", "POSTGRES", "SUPABASE", or "PASSWORD"
  // (safely masking the actual values to keep them secure but readable enough to verify)
  const dbRelated: Record<string, string> = {};
  for (const key of keys) {
    const upperKey = key.toUpperCase();
    if (
      upperKey.includes("DB") || 
      upperKey.includes("POSTGRES") || 
      upperKey.includes("SUPABASE") || 
      upperKey.includes("PASSWORD") ||
      upperKey.includes("URL")
    ) {
      const val = process.env[key] || "";
      dbRelated[key] = val.length > 6 
        ? `${val.slice(0, 4)}...${val.slice(-3)}` 
        : "***";
    }
  }

  return NextResponse.json({
    success: true,
    allKeys: keys,
    dbRelated
  });
}
