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
    const state = searchParams.get("state");
    const city = searchParams.get("city");
    const noSubmissions = searchParams.get("noSubmissions") === "true";

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
        // Check if search term matches student ID format (S-XX or s-XX)
        const studentIdMatch = search.match(/^[Ss]-?(\d+)$/);
        if (studentIdMatch) {
          // Extract the numeric ID from the formatted string (e.g., "S-10" -> 10, "S10" -> 10)
          const studentId = parseInt(studentIdMatch[1]);
          whereClause += " AND s.id = ?";
          params.push(studentId);
        } else {
          // Regular search by name, phone, city, or numeric ID
          const searchTerm = `%${search}%`;
          const numericSearch = parseInt(search.trim());

          if (!isNaN(numericSearch)) {
            // If search is numeric, also search by ID
            whereClause += " AND (s.full_name LIKE ? OR s.phone LIKE ? OR s.city LIKE ? OR s.id = ?)";
            params.push(searchTerm, searchTerm, searchTerm, numericSearch);
          } else {
            // Non-numeric search: only search by name, phone, city
            whereClause += " AND (s.full_name LIKE ? OR s.phone LIKE ? OR s.city LIKE ?)";
            params.push(searchTerm, searchTerm, searchTerm);
          }
        }
      }

      if (dateFrom) {
        whereClause += " AND DATE(s.created_at) >= ?";
        params.push(dateFrom);
      }

      if (dateTo) {
        whereClause += " AND DATE(s.created_at) <= ?";
        params.push(dateTo);
      }

      if (state) {
        whereClause += " AND s.state = ?";
        params.push(state);
      }

      if (city) {
        whereClause += " AND s.city = ?";
        params.push(city);
      }

      // Get total count
      let total = 0;
      if (noSubmissions) {
        // For no submissions filter, we need to count students with no video submissions
        const [countResult] = (await connection.execute(
          `SELECT COUNT(DISTINCT s.id) as total 
           FROM students s 
           LEFT JOIN video_submissions vs ON s.id = vs.student_id 
           WHERE ${whereClause}
           GROUP BY s.id
           HAVING COUNT(vs.id) = 0`,
          params
        )) as any[];
        total = countResult.length;
      } else {
        const [countResult] = (await connection.execute(
          `SELECT COUNT(DISTINCT s.id) as total FROM students s WHERE ${whereClause}`,
          params
        )) as any[];
        total = countResult[0]?.total || 0;
      }

      // Get students with video submission info (including latest submission ID)
      let studentsQuery = `SELECT s.*, 
         COUNT(vs.id) as video_count,
         MAX(vs.created_at) as last_video_date,
         MAX(vs.id) as latest_submission_id,
         s.id_card_key,
         s.id_card_url
         FROM students s
         LEFT JOIN video_submissions vs ON s.id = vs.student_id
         WHERE ${whereClause}
         GROUP BY s.id`;
      
      if (noSubmissions) {
        studentsQuery += ` HAVING COUNT(vs.id) = 0`;
      }
      
      studentsQuery += ` ORDER BY s.created_at DESC LIMIT ? OFFSET ?`;
      
      const [students] = (await connection.execute(studentsQuery, [...params, limit, offset])) as any[];

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
