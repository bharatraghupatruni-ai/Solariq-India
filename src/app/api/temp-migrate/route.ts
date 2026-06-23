import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

export async function GET(request: NextRequest) {
  // Hardcode database URL with the password for one-time migration on Vercel
  const dbUrl = "postgresql://postgres:Bharat%407269@db.syomnwtavcvsvoxtapcm.supabase.co:5432/postgres";

  const sql = postgres(dbUrl, {
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    // Check columns before
    const checkRes = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user_inputs';
    `;
    const initialColumns = checkRes.map((r: any) => r.column_name);

    // Apply migration
    await sql`
      ALTER TABLE user_inputs 
      ADD COLUMN IF NOT EXISTS shading TEXT DEFAULT 'none';
    `;
    await sql`
      ALTER TABLE user_inputs 
      ADD COLUMN IF NOT EXISTS environment TEXT DEFAULT 'clean';
    `;

    // Check columns after
    const checkResAfter = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user_inputs';
    `;
    const finalColumns = checkResAfter.map((r: any) => r.column_name);

    await sql.end();

    return NextResponse.json({
      success: true,
      initialColumns,
      finalColumns
    });
  } catch (error: any) {
    try {
      await sql.end();
    } catch {}
    return NextResponse.json({
      success: false,
      error: error.message || String(error)
    }, { status: 500 });
  }
}
