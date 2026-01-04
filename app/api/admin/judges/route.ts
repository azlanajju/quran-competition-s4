import { getPool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";

// GET: List all judges
export async function GET(request: NextRequest) {
  try {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      const [judges] = (await connection.execute(
        `SELECT id, username, full_name, is_active, created_at, updated_at 
         FROM judges 
         ORDER BY created_at DESC`
      )) as any[];

      return NextResponse.json({
        success: true,
        judges: judges || [],
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error("Error fetching judges:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch judges", details: error.message }, { status: 500 });
  }
}

// POST: Create a new judge
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, fullName } = body;

    if (!username || !password || !fullName) {
      return NextResponse.json({ success: false, error: "Username, password, and full name are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ success: false, error: "Password must be at least 6 characters long" }, { status: 400 });
    }

    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      // Check if username already exists
      const [existing] = (await connection.execute(`SELECT id FROM judges WHERE username = ?`, [username])) as any[];

      if (existing.length > 0) {
        return NextResponse.json({ success: false, error: "Username already exists" }, { status: 409 });
      }

      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Insert judge
      await connection.execute(
        `INSERT INTO judges (username, password_hash, full_name) VALUES (?, ?, ?)`,
        [username, passwordHash, fullName]
      );

      return NextResponse.json({
        success: true,
        message: "Judge created successfully",
      });
    } catch (error: any) {
      if (error.code === "ER_DUP_ENTRY") {
        return NextResponse.json({ success: false, error: "Username already exists" }, { status: 409 });
      }
      throw error;
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error("Error creating judge:", error);
    return NextResponse.json({ success: false, error: "Failed to create judge", details: error.message }, { status: 500 });
  }
}

// PUT: Update judge
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, username, password, fullName, isActive } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Judge ID is required" }, { status: 400 });
    }

    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      // Check if judge exists
      const [existing] = (await connection.execute(`SELECT id FROM judges WHERE id = ?`, [id])) as any[];

      if (existing.length === 0) {
        return NextResponse.json({ success: false, error: "Judge not found" }, { status: 404 });
      }

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];

      if (username !== undefined) {
        // Check if new username conflicts
        const [conflict] = (await connection.execute(`SELECT id FROM judges WHERE username = ? AND id != ?`, [username, id])) as any[];
        if (conflict.length > 0) {
          return NextResponse.json({ success: false, error: "Username already exists" }, { status: 409 });
        }
        updates.push("username = ?");
        values.push(username);
      }

      if (password !== undefined) {
        if (password.length < 6) {
          return NextResponse.json({ success: false, error: "Password must be at least 6 characters long" }, { status: 400 });
        }
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        updates.push("password_hash = ?");
        values.push(passwordHash);
      }

      if (fullName !== undefined) {
        updates.push("full_name = ?");
        values.push(fullName);
      }

      if (isActive !== undefined) {
        updates.push("is_active = ?");
        values.push(isActive);
      }

      if (updates.length === 0) {
        return NextResponse.json({ success: false, error: "No fields to update" }, { status: 400 });
      }

      values.push(id);
      await connection.execute(`UPDATE judges SET ${updates.join(", ")} WHERE id = ?`, values);

      return NextResponse.json({
        success: true,
        message: "Judge updated successfully",
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error("Error updating judge:", error);
    return NextResponse.json({ success: false, error: "Failed to update judge", details: error.message }, { status: 500 });
  }
}

// DELETE: Delete judge
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Judge ID is required" }, { status: 400 });
    }

    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      await connection.execute(`DELETE FROM judges WHERE id = ?`, [parseInt(id)]);

      return NextResponse.json({
        success: true,
        message: "Judge deleted successfully",
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error("Error deleting judge:", error);
    return NextResponse.json({ success: false, error: "Failed to delete judge", details: error.message }, { status: 500 });
  }
}

