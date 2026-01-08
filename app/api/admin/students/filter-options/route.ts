import { getPool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get("state");

    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      // Get distinct states
      const [states] = (await connection.execute(`SELECT DISTINCT state FROM students WHERE state IS NOT NULL AND state != '' ORDER BY state ASC`)) as any[];

      // Get cities - filtered by state if provided
      let citiesQuery = `SELECT DISTINCT city FROM students WHERE city IS NOT NULL AND city != ''`;
      const citiesParams: any[] = [];

      if (state) {
        citiesQuery += ` AND state = ?`;
        citiesParams.push(state);
      }

      citiesQuery += ` ORDER BY city ASC`;

      const [cities] = (await connection.execute(citiesQuery, citiesParams)) as any[];

      return NextResponse.json({
        success: true,
        states: states.map((row: any) => row.state),
        cities: cities.map((row: any) => row.city),
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error("Filter options error:", error);
    return NextResponse.json({ error: "Failed to fetch filter options", details: error.message }, { status: 500 });
  }
}
