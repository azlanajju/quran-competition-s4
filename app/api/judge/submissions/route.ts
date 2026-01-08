import { getPool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;
    const filter = searchParams.get("filter") || "all"; // all, pending, partial, scored
    const judgeId = searchParams.get("judgeId");

    if (!judgeId) {
      return NextResponse.json({ success: false, error: "judgeId is required" }, { status: 400 });
    }

    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      // Get judge information to check sequence range and score type
      const [judges] = (await connection.execute(`SELECT score_type, sequence_from, sequence_to FROM judges WHERE id = ?`, [parseInt(judgeId)])) as any[];

      if (judges.length === 0) {
        return NextResponse.json({ success: false, error: "Judge not found" }, { status: 404 });
      }

      const judge = judges[0];
      const sequenceFrom = judge.sequence_from;
      const sequenceTo = judge.sequence_to;

      // Build filter conditions based on filter type
      let filterCondition = "";
      let filterParams: any[] = [];

      // Add sequence range filter if judge has sequence restrictions
      if (sequenceFrom !== null && sequenceTo !== null) {
        filterCondition += ` AND s.id >= ? AND s.id <= ?`;
        filterParams.push(sequenceFrom, sequenceTo);
      }

      if (filter === "scored") {
        // Submissions with both A and B scores
        filterCondition = `AND vs.id IN (
          SELECT submission_id FROM judge_scores WHERE judge_id = ? AND score_type = 'A'
        ) AND vs.id IN (
          SELECT submission_id FROM judge_scores WHERE judge_id = ? AND score_type = 'B'
        )`;
        filterParams = [parseInt(judgeId), parseInt(judgeId)];
      } else if (filter === "partial") {
        // Submissions with only one score (A or B, but not both)
        filterCondition = `AND vs.id IN (
          SELECT submission_id
          FROM (
            SELECT submission_id, COUNT(DISTINCT score_type) as score_count
            FROM judge_scores
            WHERE judge_id = ?
            GROUP BY submission_id
            HAVING score_count = 1
          ) as partial_scores
        )`;
        filterParams = [parseInt(judgeId)];
      } else if (filter === "pending") {
        // Submissions with no scores from this judge
        filterCondition = `AND vs.id NOT IN (
          SELECT DISTINCT submission_id FROM judge_scores WHERE judge_id = ?
        )`;
        filterParams = [parseInt(judgeId)];
      }
      // "all" filter doesn't need additional condition, filterParams stays empty

      // Get total count with filter
      const [countResult] = (await connection.execute(
        `SELECT COUNT(*) as total 
         FROM video_submissions vs
         INNER JOIN students s ON vs.student_id = s.id
         WHERE vs.processing_status = 'completed'
         ${filterCondition}`,
        [...filterParams]
      )) as any[];

      const total = countResult[0]?.total || 0;
      const totalPages = Math.ceil(total / limit);

      // Get submissions with student info and filter, including score status
      // Note: For judge view, we exclude phone, city, state for privacy
      const [submissions] = (await connection.execute(
        `SELECT 
          vs.id,
          vs.student_id,
          vs.original_video_key,
          vs.original_video_url,
          vs.created_at,
          s.full_name,
          CASE
            WHEN vs.id IN (
              SELECT submission_id FROM judge_scores WHERE judge_id = ? AND score_type = 'A'
            ) AND vs.id IN (
              SELECT submission_id FROM judge_scores WHERE judge_id = ? AND score_type = 'B'
            ) THEN 'scored'
            WHEN vs.id IN (
              SELECT submission_id FROM judge_scores WHERE judge_id = ?
            ) THEN 'partial'
            ELSE 'pending'
          END as score_status
         FROM video_submissions vs
         INNER JOIN students s ON vs.student_id = s.id
         WHERE vs.processing_status = 'completed'
         ${filterCondition}
         ORDER BY vs.created_at DESC
         LIMIT ? OFFSET ?`,
        [parseInt(judgeId), parseInt(judgeId), parseInt(judgeId), ...filterParams, limit, offset]
      )) as any[];

      // Return judge info along with submissions
      return NextResponse.json({
        success: true,
        submissions: submissions || [],
        judgeInfo: {
          scoreType: judge.score_type,
          sequenceFrom: judge.sequence_from,
          sequenceTo: judge.sequence_to,
        },
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
    console.error("Error fetching submissions:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch submissions", details: error.message }, { status: 500 });
  }
}
