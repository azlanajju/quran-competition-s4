import { getPool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("judge_session");

    if (!sessionCookie) {
      return NextResponse.json({ success: false, authenticated: false }, { status: 401 });
    }

    let session;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch {
      return NextResponse.json({ success: false, authenticated: false }, { status: 401 });
    }

    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      // Verify judge exists and is active
      const [judges] = (await connection.execute(
        `SELECT id, username, full_name, is_active, score_type, sequence_from, sequence_to 
         FROM judges 
         WHERE id = ? AND is_active = TRUE`,
        [session.id]
      )) as any[];

      if (judges.length === 0) {
        return NextResponse.json({ success: false, authenticated: false }, { status: 401 });
      }

      const judge = judges[0];

      return NextResponse.json({
        success: true,
        authenticated: true,
        judge: {
          id: judge.id,
          username: judge.username,
          fullName: judge.full_name,
          scoreType: judge.score_type,
          sequenceFrom: judge.sequence_from,
          sequenceTo: judge.sequence_to,
        },
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error("Verify error:", error);
    return NextResponse.json({ success: false, authenticated: false, error: error.message }, { status: 500 });
  }
}

