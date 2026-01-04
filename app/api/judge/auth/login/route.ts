import { getPool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ success: false, error: "Username and password are required" }, { status: 400 });
    }

    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      // Find judge by username
      const [judges] = (await connection.execute(
        `SELECT id, username, password_hash, full_name, is_active 
         FROM judges 
         WHERE username = ? AND is_active = TRUE`,
        [username]
      )) as any[];

      if (judges.length === 0) {
        return NextResponse.json({ success: false, error: "Invalid username or password" }, { status: 401 });
      }

      const judge = judges[0];

      // Verify password
      const isValidPassword = await bcrypt.compare(password, judge.password_hash);

      if (!isValidPassword) {
        return NextResponse.json({ success: false, error: "Invalid username or password" }, { status: 401 });
      }

      // Create session (using cookie)
      const response = NextResponse.json({
        success: true,
        judge: {
          id: judge.id,
          username: judge.username,
          fullName: judge.full_name,
        },
      });

      // Set session cookie (in production, use secure, httpOnly, sameSite)
      response.cookies.set("judge_session", JSON.stringify({ id: judge.id, username: judge.username }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return response;
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json({ success: false, error: "Failed to login", details: error.message }, { status: 500 });
  }
}

