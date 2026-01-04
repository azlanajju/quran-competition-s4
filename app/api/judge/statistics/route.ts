import { getPool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET: Fetch statistics for a judge
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const judgeId = searchParams.get("judgeId");

    if (!judgeId) {
      return NextResponse.json({ success: false, error: "judgeId is required" }, { status: 400 });
    }

    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      // Get total submissions
      const [totalResult] = (await connection.execute(
        `SELECT COUNT(*) as total FROM video_submissions`
      )) as any[];
      const total = totalResult[0]?.total || 0;

      // Get submissions with both A and B scores from this judge (fully scored)
      const [scoredResult] = (await connection.execute(
        `SELECT COUNT(DISTINCT vs.id) as count
        FROM video_submissions vs
        INNER JOIN judge_scores js1 ON vs.id = js1.submission_id AND js1.judge_id = ? AND js1.score_type = 'A'
        INNER JOIN judge_scores js2 ON vs.id = js2.submission_id AND js2.judge_id = ? AND js2.score_type = 'B'
        WHERE js1.judge_id = ? AND js2.judge_id = ?`,
        [parseInt(judgeId), parseInt(judgeId), parseInt(judgeId), parseInt(judgeId)]
      )) as any[];
      const scored = scoredResult[0]?.count || 0;

      // Get submissions with only one score (A or B) from this judge (partial)
      const [partialResult] = (await connection.execute(
        `SELECT COUNT(DISTINCT submission_id) as count
        FROM (
          SELECT submission_id, COUNT(DISTINCT score_type) as score_count
          FROM judge_scores
          WHERE judge_id = ?
          GROUP BY submission_id
          HAVING score_count = 1
        ) as partial_scores`,
        [parseInt(judgeId)]
      )) as any[];
      const partial = partialResult[0]?.count || 0;

      // Get submissions with no scores from this judge (pending)
      const [pendingResult] = (await connection.execute(
        `SELECT COUNT(*) as count
        FROM video_submissions vs
        WHERE vs.id NOT IN (
          SELECT DISTINCT submission_id FROM judge_scores WHERE judge_id = ?
        )`,
        [parseInt(judgeId)]
      )) as any[];
      const pending = pendingResult[0]?.count || 0;

      return NextResponse.json({
        success: true,
        statistics: {
          total,
          scored,
          partial,
          pending,
        },
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error("Error fetching statistics:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch statistics", details: error.message }, { status: 500 });
  }
}

