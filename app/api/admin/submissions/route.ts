import { getPool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const studentId = searchParams.get("studentId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

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

      if (dateFrom) {
        whereClause += " AND DATE(vs.created_at) >= ?";
        params.push(dateFrom);
      }

      if (dateTo) {
        whereClause += " AND DATE(vs.created_at) <= ?";
        params.push(dateTo);
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

      // Ensure original_video_key and hls_master_playlist_key are included
      const submissionsWithKeys = submissions.map((sub: any) => ({
        ...sub,
        original_video_key: sub.original_video_key || null,
        hls_master_playlist_key: sub.hls_master_playlist_key || null,
        hls_master_playlist_url: sub.hls_master_playlist_url || null,
      }));

      // Get scores for each submission (get ALL scores, not just one of each type)
      const submissionsWithScores = await Promise.all(
        submissionsWithKeys.map(async (submission: any) => {
          const [scores] = (await connection.execute(
            `SELECT js.*, j.full_name as judge_full_name, j.username as judge_username
             FROM judge_scores js
             LEFT JOIN judges j ON js.judge_id = j.id
             WHERE js.submission_id = ?
             ORDER BY js.score_type, js.created_at DESC`,
            [submission.id]
          )) as any[];

          // Organize scores by type (get latest of each type for display)
          const scoreA = scores.find((s: any) => s.score_type === "A");
          const scoreB = scores.find((s: any) => s.score_type === "B");
          
          // Get all scores of each type for detailed view
          const allScoresA = scores.filter((s: any) => s.score_type === "A");
          const allScoresB = scores.filter((s: any) => s.score_type === "B");
          
          // Calculate average - use both scores if available, otherwise use single score
          let averageScore = null;
          if (scoreA && scoreB) {
            const scoreAValue = typeof scoreA.score === 'string' ? parseFloat(scoreA.score) : scoreA.score;
            const scoreBValue = typeof scoreB.score === 'string' ? parseFloat(scoreB.score) : scoreB.score;
            if (!isNaN(scoreAValue) && !isNaN(scoreBValue)) {
              const avg = (scoreAValue + scoreBValue) / 2;
              averageScore = avg % 1 === 0 ? avg.toString() : avg.toFixed(2);
            }
          } else if (scoreA) {
            // If only scoreA exists, use it as average
            const scoreAValue = typeof scoreA.score === 'string' ? parseFloat(scoreA.score) : scoreA.score;
            if (!isNaN(scoreAValue)) {
              averageScore = scoreAValue % 1 === 0 ? scoreAValue.toString() : scoreAValue.toFixed(2);
            }
          } else if (scoreB) {
            // If only scoreB exists, use it as average
            const scoreBValue = typeof scoreB.score === 'string' ? parseFloat(scoreB.score) : scoreB.score;
            if (!isNaN(scoreBValue)) {
              averageScore = scoreBValue % 1 === 0 ? scoreBValue.toString() : scoreBValue.toFixed(2);
            }
          }

          return {
            ...submission,
            scores: {
              scoreA: scoreA || null,
              scoreB: scoreB || null,
              allScoresA: allScoresA || [],
              allScoresB: allScoresB || [],
              average: averageScore,
              totalScores: scores.length,
            },
          };
        })
      );

      return NextResponse.json({
        success: true,
        submissions: submissionsWithScores,
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
