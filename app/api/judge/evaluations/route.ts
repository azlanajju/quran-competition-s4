import { getPool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const judgeId = searchParams.get("judgeId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    if (!judgeId) {
      return NextResponse.json({ success: false, error: "judgeId is required" }, { status: 400 });
    }

    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      // Get all unique submissions that this judge has scored with their scores
      const [submissionsWithScores] = (await connection.execute(
        `SELECT 
          vs.id as submission_id,
          s.full_name as student_name,
          s.phone as student_phone,
          s.city as student_city,
          s.state as student_state,
          vs.created_at as submitted_at,
          js.score_type,
          js.score,
          js.description,
          js.created_at as score_created_at
        FROM judge_scores js
        INNER JOIN video_submissions vs ON js.submission_id = vs.id
        INNER JOIN students s ON vs.student_id = s.id
        WHERE js.judge_id = ?
        ORDER BY js.created_at DESC`,
        [parseInt(judgeId)]
      )) as any[];

      // Group by submission_id and aggregate scores
      const submissionMap = new Map<number, any>();

      submissionsWithScores.forEach((row: any) => {
        if (!submissionMap.has(row.submission_id)) {
          submissionMap.set(row.submission_id, {
            submission_id: row.submission_id,
            student_name: row.student_name,
            student_phone: row.student_phone,
            student_city: row.student_city,
            student_state: row.student_state,
            submitted_at: row.submitted_at,
            score_a: null,
            score_b: null,
            description_a: null,
            description_b: null,
            created_at: row.score_created_at,
          });
        }

        const evaluation = submissionMap.get(row.submission_id)!;
        if (row.score_type === "A") {
          evaluation.score_a = typeof row.score === "string" ? parseFloat(row.score) : row.score;
          evaluation.description_a = row.description;
        } else if (row.score_type === "B") {
          evaluation.score_b = typeof row.score === "string" ? parseFloat(row.score) : row.score;
          evaluation.description_b = row.description;
        }

        // Update created_at to earliest score date
        if (new Date(row.score_created_at) < new Date(evaluation.created_at)) {
          evaluation.created_at = row.score_created_at;
        }
      });

      const allEvaluations = Array.from(submissionMap.values());

      // Get total count
      const total = allEvaluations.length;
      const totalPages = Math.ceil(total / limit);

      // Apply pagination
      const evaluations = allEvaluations.slice(offset, offset + limit);

      return NextResponse.json({
        success: true,
        evaluations,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error("Error fetching evaluations:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch evaluations", details: error.message }, { status: 500 });
  }
}

