import { getPool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const submissionId = parseInt(resolvedParams.id);
    const searchParams = request.nextUrl.searchParams;
    const judgeId = searchParams.get("judgeId");

    if (isNaN(submissionId)) {
      return NextResponse.json({ success: false, error: "Invalid submission ID" }, { status: 400 });
    }

    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      // Get submission with student info
      // Note: For judge view, we exclude phone, city, state for privacy
      const [submissions] = (await connection.execute(
        `SELECT 
          vs.id,
          vs.student_id,
          vs.original_video_key,
          vs.original_video_url,
          vs.created_at,
          s.full_name
         FROM video_submissions vs
         INNER JOIN students s ON vs.student_id = s.id
         WHERE vs.id = ? AND vs.processing_status = 'completed'`,
        [submissionId]
      )) as any[];

      if (submissions.length === 0) {
        return NextResponse.json({ success: false, error: "Submission not found" }, { status: 404 });
      }

      const submission = submissions[0];

      // If judgeId is provided, validate sequence range access
      if (judgeId) {
        const [judges] = (await connection.execute(`SELECT score_type, sequence_from, sequence_to FROM judges WHERE id = ?`, [parseInt(judgeId)])) as any[];

        if (judges.length > 0) {
          const judge = judges[0];
          const sequenceFrom = judge.sequence_from;
          const sequenceTo = judge.sequence_to;

          // Check if judge has sequence restrictions
          if (sequenceFrom !== null && sequenceTo !== null) {
            if (submission.student_id < sequenceFrom || submission.student_id > sequenceTo) {
              return NextResponse.json(
                {
                  success: false,
                  error: `You do not have access to this submission. Your assigned range is S-${String(sequenceFrom).padStart(2, "0")} to S-${String(sequenceTo).padStart(2, "0")}.`,
                },
                { status: 403 }
              );
            }
          }
        }
      }

      return NextResponse.json({
        success: true,
        submission: submission,
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error("Error fetching submission:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch submission", details: error.message }, { status: 500 });
  }
}
