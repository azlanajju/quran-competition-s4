import { getPool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get("submissionId");
    const studentId = searchParams.get("studentId");

    if (!submissionId && !studentId) {
      return NextResponse.json({ error: "Either submissionId or studentId is required" }, { status: 400 });
    }

    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      let query: string;
      let params: any[];

      if (submissionId) {
        query = `SELECT 
          id,
          student_id,
          processing_status,
          processing_error,
          video_resolution,
          hls_master_playlist_key,
          hls_master_playlist_url,
          created_at,
          updated_at
        FROM video_submissions 
        WHERE id = ?`;
        params = [parseInt(submissionId)];
      } else {
        query = `SELECT 
          id,
          student_id,
          processing_status,
          processing_error,
          video_resolution,
          hls_master_playlist_key,
          hls_master_playlist_url,
          created_at,
          updated_at
        FROM video_submissions 
        WHERE student_id = ? 
        ORDER BY created_at DESC 
        LIMIT 1`;
        params = [parseInt(studentId!)];
      }

      const [rows] = (await connection.execute(query, params)) as any[];
      const submissions = rows;

      if (submissions.length === 0) {
        return NextResponse.json({ error: "Video submission not found" }, { status: 404 });
      }

      const submission = submissions[0];

      return NextResponse.json({
        success: true,
        submission: {
          id: submission.id,
          studentId: submission.student_id,
          status: submission.processing_status,
          error: submission.processing_error,
          resolution: submission.video_resolution,
          hlsMasterPlaylistKey: submission.hls_master_playlist_key,
          hlsMasterPlaylistUrl: submission.hls_master_playlist_url,
          createdAt: submission.created_at,
          updatedAt: submission.updated_at,
        },
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error("Error fetching video status:", error);
    return NextResponse.json({ error: "Failed to fetch video status", details: error.message }, { status: 500 });
  }
}

