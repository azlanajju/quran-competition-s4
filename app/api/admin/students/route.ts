import { getPool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const offset = (page - 1) * limit;

    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      let whereClause = "1=1";
      const params: any[] = [];

      if (status) {
        whereClause += " AND s.status = ?";
        params.push(status);
      }

      if (search) {
        whereClause += " AND (s.full_name LIKE ? OR s.phone LIKE ? OR s.city LIKE ?)";
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      if (dateFrom) {
        whereClause += " AND DATE(s.created_at) >= ?";
        params.push(dateFrom);
      }

      if (dateTo) {
        whereClause += " AND DATE(s.created_at) <= ?";
        params.push(dateTo);
      }

      // Get total count
      const [countResult] = (await connection.execute(`SELECT COUNT(DISTINCT s.id) as total FROM students s WHERE ${whereClause}`, params)) as any[];

      const total = countResult[0]?.total || 0;

      // Get students with video submission info (including latest submission ID)
      const [students] = (await connection.execute(
        `SELECT s.*, 
         COUNT(vs.id) as video_count,
         MAX(vs.created_at) as last_video_date,
         MAX(vs.id) as latest_submission_id,
         s.id_card_key,
         s.id_card_url
         FROM students s
         LEFT JOIN video_submissions vs ON s.id = vs.student_id
         WHERE ${whereClause}
         GROUP BY s.id
         ORDER BY s.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      )) as any[];

      return NextResponse.json({
        success: true,
        students: students,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error("Students list error:", error);
    return NextResponse.json({ error: "Failed to fetch students", details: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, status } = body;

    if (!studentId || !status) {
      return NextResponse.json({ error: "Student ID and status are required" }, { status: 400 });
    }

    const validStatuses = ["pending", "submitted", "reviewed", "approved", "rejected"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      await connection.execute("UPDATE students SET status = ? WHERE id = ?", [status, parseInt(studentId)]);

      return NextResponse.json({
        success: true,
        message: "Student status updated successfully",
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error("Update student error:", error);
    return NextResponse.json({ error: "Failed to update student", details: error.message }, { status: 500 });
  }
}
