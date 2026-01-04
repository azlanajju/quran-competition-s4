import { getPool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET: Fetch all scores for a submission (both A and B from all judges)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const submissionId = resolvedParams.id;

    if (!submissionId) {
      return NextResponse.json({ success: false, error: "submissionId is required" }, { status: 400 });
    }

    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      // Fetch all scores for this submission
      const [scores] = (await connection.execute(
        `SELECT 
          js.id,
          js.submission_id,
          js.judge_id,
          js.judge_name,
          js.score_type,
          js.score,
          js.description,
          js.created_at,
          js.updated_at,
          j.username as judge_username,
          j.full_name as judge_full_name
        FROM judge_scores js
        LEFT JOIN judges j ON js.judge_id = j.id
        WHERE js.submission_id = ?
        ORDER BY js.score_type, js.created_at DESC`,
        [parseInt(submissionId)]
      )) as any[];

      // Separate scores by type
      const scoreA = scores.filter((s: any) => s.score_type === "A");
      const scoreB = scores.filter((s: any) => s.score_type === "B");

      return NextResponse.json({
        success: true,
        scores: {
          A: scoreA,
          B: scoreB,
        },
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error("Error fetching scores:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch scores", details: error.message }, { status: 500 });
  }
}

