import { NextRequest, NextResponse } from "next/server";
import { Client } from "pg";

export async function GET(request: NextRequest) {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return NextResponse.json({ error: "DATABASE_URL environment variable is not defined" }, { status: 500 });
  }

  const client = new Client({
    connectionString: dbUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    
    // Check columns before
    const checkRes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user_inputs';
    `);
    const initialColumns = checkRes.rows.map((r: any) => r.column_name);

    // Apply migration
    await client.query(`
      ALTER TABLE user_inputs 
      ADD COLUMN IF NOT EXISTS shading TEXT DEFAULT 'none';
    `);
    await client.query(`
      ALTER TABLE user_inputs 
      ADD COLUMN IF NOT EXISTS environment TEXT DEFAULT 'clean';
    `);

    // Check columns after
    const checkResAfter = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user_inputs';
    `);
    const finalColumns = checkResAfter.rows.map((r: any) => r.column_name);

    await client.end();

    return NextResponse.json({
      success: true,
      initialColumns,
      finalColumns
    });
  } catch (error: any) {
    try {
      await client.end();
    } catch {}
    return NextResponse.json({
      success: false,
      error: error.message || String(error)
    }, { status: 500 });
  }
}
