import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

export async function GET(request: NextRequest) {
  // Use direct IPv6 address of the database server
  const dbHost = "2406:da14:1d62:b400:1678:2540:3a01:f05c";
  const password = "Bharat@7269";
  const username = "postgres";
  const dbname = "postgres";
  const port = 5432;

  console.log(`Connecting directly to IPv6 [${dbHost}]:${port} from Vercel...`);
  
  const sql = postgres({
    host: dbHost,
    port: port,
    user: username,
    password: password,
    database: dbname,
    ssl: {
      rejectUnauthorized: false
    },
    connect_timeout: 10
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
