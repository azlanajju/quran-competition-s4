import { getPool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const studentId = searchParams.get("studentId");

    const offset = (page - 1) * limit;

    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      let whereClause = "1=1";
      const params: any[] = [];

      if (status) {
        whereClause += " AND vs.processing_status = ?";
        params.push(status);
      }

      if (studentId) {
        whereClause += " AND vs.student_id = ?";
        params.push(parseInt(studentId));
      }

      // Get total count
      const [countResult] = (await connection.execute(`SELECT COUNT(*) as total FROM video_submissions vs WHERE ${whereClause}`, params)) as any[];

      const total = countResult[0]?.total || 0;

      // Get submissions with student info
      const [submissions] = (await connection.execute(
        `SELECT vs.*, 
         s.full_name, s.phone, s.city, s.state
         FROM video_submissions vs
         JOIN students s ON vs.student_id = s.id
         WHERE ${whereClause}
         ORDER BY vs.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      )) as any[];

      return NextResponse.json({
        success: true,
        submissions: submissions,
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
    console.error("Submissions list error:", error);
    return NextResponse.json({ error: "Failed to fetch submissions", details: error.message }, { status: 500 });
  }
}
