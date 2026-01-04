import { getPool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// In-memory store for conversion progress (in production, use Redis or database)
const conversionProgress = new Map<number, {
  status: string;
  progress: number;
  message: string;
  error?: string;
}>();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = await Promise.resolve(params);
  const submissionId = parseInt(resolvedParams.id);

  if (!submissionId) {
    return NextResponse.json({ success: false, error: "Submission ID is required" }, { status: 400 });
  }

  // Check if conversion is in progress
  const progress = conversionProgress.get(submissionId);

  if (!progress) {
    // Check database to see if already converted
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      const [submissions] = (await connection.execute(
        `SELECT hls_master_playlist_key, original_video_key
         FROM video_submissions 
         WHERE id = ?`,
        [submissionId]
      )) as any[];

      if (submissions.length === 0) {
        return NextResponse.json({ success: false, error: "Submission not found" }, { status: 404 });
      }

      const submission = submissions[0];

      if (submission.hls_master_playlist_key) {
        return NextResponse.json({
          success: true,
          status: "completed",
          progress: 100,
          message: "Video already converted to HLS",
        });
      }

      return NextResponse.json({
        success: true,
        status: "idle",
        progress: 0,
        message: "No conversion in progress",
      });
    } finally {
      connection.release();
    }
  }

  return NextResponse.json({
    success: true,
    ...progress,
  });
}

// Export function to update progress (used by conversion route)
export function updateConversionProgress(
  submissionId: number,
  status: string,
  progress: number,
  message: string,
  error?: string
) {
  conversionProgress.set(submissionId, {
    status,
    progress,
    message,
    error,
  });
}

// Export function to clear progress
export function clearConversionProgress(submissionId: number) {
  conversionProgress.delete(submissionId);
}

