import { getPool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const submissionId = parseInt(resolvedParams.id);

    if (isNaN(submissionId)) {
      return NextResponse.json({ success: false, error: "Invalid submission ID" }, { status: 400 });
    }

    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      // Get submission with student info
      const [submissions] = (await connection.execute(
        `SELECT 
          vs.id,
          vs.student_id,
          vs.original_video_key,
          vs.original_video_url,
          vs.created_at,
          s.full_name,
          s.phone,
          s.city,
          s.state
         FROM video_submissions vs
         INNER JOIN students s ON vs.student_id = s.id
         WHERE vs.id = ? AND vs.processing_status = 'completed'`,
        [submissionId]
      )) as any[];

      if (submissions.length === 0) {
        return NextResponse.json({ success: false, error: "Submission not found" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        submission: submissions[0],
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error("Error fetching submission:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch submission", details: error.message }, { status: 500 });
  }
}
