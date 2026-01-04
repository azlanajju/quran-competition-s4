import { getPool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 });
    }

    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      // Find admin by email
      const [admins] = (await connection.execute(
        `SELECT id, email, password_hash, full_name, is_active 
         FROM admins 
         WHERE email = ? AND is_active = TRUE`,
        [email.toLowerCase().trim()]
      )) as any[];

      if (admins.length === 0) {
        return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
      }

      const admin = admins[0];

      // Verify password
      const isValidPassword = await bcrypt.compare(password, admin.password_hash);

      if (!isValidPassword) {
        return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
      }

      // Create session (using cookie)
      const response = NextResponse.json({
        success: true,
        admin: {
          id: admin.id,
          email: admin.email,
          fullName: admin.full_name,
        },
      });

      // Set session cookie (in production, use secure, httpOnly, sameSite)
      response.cookies.set("admin_session", JSON.stringify({ id: admin.id, email: admin.email }), {
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
    console.error("Admin login error:", error);
    return NextResponse.json({ success: false, error: "Failed to login", details: error.message }, { status: 500 });
  }
}

