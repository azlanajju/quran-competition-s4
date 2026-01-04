import { getPool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("admin_session");

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
      // Verify admin exists and is active
      const [admins] = (await connection.execute(
        `SELECT id, email, full_name, is_active 
         FROM admins 
         WHERE id = ? AND is_active = TRUE`,
        [session.id]
      )) as any[];

      if (admins.length === 0) {
        return NextResponse.json({ success: false, authenticated: false }, { status: 401 });
      }

      const admin = admins[0];

      return NextResponse.json({
        success: true,
        authenticated: true,
        admin: {
          id: admin.id,
          email: admin.email,
          fullName: admin.full_name,
        },
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error("Admin verify error:", error);
    return NextResponse.json({ success: false, authenticated: false, error: error.message }, { status: 500 });
  }
}

