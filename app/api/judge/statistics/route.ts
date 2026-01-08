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
      // Get judge information to check sequence range
      const [judges] = (await connection.execute(`SELECT sequence_from, sequence_to FROM judges WHERE id = ?`, [parseInt(judgeId)])) as any[];

      const judge = judges.length > 0 ? judges[0] : null;
      const sequenceFrom = judge?.sequence_from;
      const sequenceTo = judge?.sequence_to;

      // Build sequence filter condition
      let totalQuery = "";
      let totalParams: any[] = [];

      if (sequenceFrom !== null && sequenceTo !== null) {
        totalQuery = `SELECT COUNT(*) as total 
         FROM video_submissions vs 
         INNER JOIN students s ON vs.student_id = s.id 
         WHERE vs.processing_status = 'completed' AND s.id >= ? AND s.id <= ?`;
        totalParams = [sequenceFrom, sequenceTo];
      } else {
        totalQuery = `SELECT COUNT(*) as total 
         FROM video_submissions vs 
         WHERE vs.processing_status = 'completed'`;
        totalParams = [];
      }

      // Get total submissions for this judge (filtered by sequence range if applicable)
      const [totalResult] = (await connection.execute(totalQuery, totalParams)) as any[];
      const total = totalResult[0]?.total || 0;

      // Get submissions with both A and B scores from this judge (fully scored)
      // Filter by sequence range if applicable
      let scoredQuery = `SELECT COUNT(DISTINCT vs.id) as count
        FROM video_submissions vs
        INNER JOIN students s ON vs.student_id = s.id
        INNER JOIN judge_scores js1 ON vs.id = js1.submission_id AND js1.judge_id = ? AND js1.score_type = 'A'
        INNER JOIN judge_scores js2 ON vs.id = js2.submission_id AND js2.judge_id = ? AND js2.score_type = 'B'
        WHERE vs.processing_status = 'completed'`;

      let scoredParams: any[] = [parseInt(judgeId), parseInt(judgeId)];

      if (sequenceFrom !== null && sequenceTo !== null) {
        scoredQuery += ` AND s.id >= ? AND s.id <= ?`;
        scoredParams.push(sequenceFrom, sequenceTo);
      }

      const [scoredResult] = (await connection.execute(scoredQuery, scoredParams)) as any[];
      const scored = scoredResult[0]?.count || 0;

      // Get submissions with only one score (A or B) from this judge (partial)
      // Filter by sequence range if applicable
      let partialQuery = `SELECT COUNT(DISTINCT js.submission_id) as count
        FROM judge_scores js
        INNER JOIN video_submissions vs ON js.submission_id = vs.id
        INNER JOIN students s ON vs.student_id = s.id
        WHERE js.judge_id = ? AND vs.processing_status = 'completed'
        AND js.submission_id IN (
          SELECT submission_id
          FROM (
            SELECT submission_id, COUNT(DISTINCT score_type) as score_count
            FROM judge_scores
            WHERE judge_id = ?
            GROUP BY submission_id
            HAVING score_count = 1
          ) as partial_scores
        )`;

      let partialParams: any[] = [parseInt(judgeId), parseInt(judgeId)];

      if (sequenceFrom !== null && sequenceTo !== null) {
        partialQuery += ` AND s.id >= ? AND s.id <= ?`;
        partialParams.push(sequenceFrom, sequenceTo);
      }

      const [partialResult] = (await connection.execute(partialQuery, partialParams)) as any[];
      const partial = partialResult[0]?.count || 0;

      // Get submissions with no scores from this judge (pending)
      // Filter by sequence range if applicable
      let pendingQuery = `SELECT COUNT(*) as count
        FROM video_submissions vs
        INNER JOIN students s ON vs.student_id = s.id
        WHERE vs.processing_status = 'completed' AND vs.id NOT IN (
          SELECT DISTINCT submission_id FROM judge_scores WHERE judge_id = ?
        )`;

      let pendingParams: any[] = [parseInt(judgeId)];

      if (sequenceFrom !== null && sequenceTo !== null) {
        pendingQuery += ` AND s.id >= ? AND s.id <= ?`;
        pendingParams.push(sequenceFrom, sequenceTo);
      }

      const [pendingResult] = (await connection.execute(pendingQuery, pendingParams)) as any[];
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
