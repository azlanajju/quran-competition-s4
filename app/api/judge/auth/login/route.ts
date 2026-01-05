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

      // Set session cookie (use secure only if actually using HTTPS)
      // Check if request is over HTTPS (either directly or via proxy)
      const protocol = request.headers.get("x-forwarded-proto") || 
                      (request.url.startsWith("https://") ? "https" : "http");
      const isSecure = protocol === "https" || process.env.FORCE_SECURE_COOKIES === "true";
      
      response.cookies.set("judge_session", JSON.stringify({ id: judge.id, username: judge.username }), {
        httpOnly: true,
        secure: isSecure,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
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

