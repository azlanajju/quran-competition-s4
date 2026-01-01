import { getPool } from "@/lib/db";
import { getSignedUrlForS3 } from "@/lib/s3-upload";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get("submissionId");
    const studentId = searchParams.get("studentId");
    const type = searchParams.get("type") || "original"; // 'hls' or 'original'

    if (!submissionId && !studentId) {
      return NextResponse.json({ error: "Either submissionId or studentId is required" }, { status: 400 });
    }

    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      let query: string;
      let params: any[];

      if (submissionId) {
        query = `SELECT hls_master_playlist_key, original_video_key, student_id 
                 FROM video_submissions WHERE id = ?`;
        params = [parseInt(submissionId)];
      } else {
        query = `SELECT hls_master_playlist_key, original_video_key, student_id 
                 FROM video_submissions WHERE student_id = ? 
                 ORDER BY created_at DESC LIMIT 1`;
        params = [parseInt(studentId!)];
      }

      const [rows] = await connection.execute(query, params);
      const submissions = rows as any[];

      if (submissions.length === 0) {
        return NextResponse.json({ error: "Video submission not found" }, { status: 404 });
      }

      const submission = submissions[0];
      let s3Key: string;

      if (type === "hls") {
        s3Key = submission.hls_master_playlist_key;
      } else {
        s3Key = submission.original_video_key;
      }

      if (!s3Key) {
        return NextResponse.json({ error: `${type === "hls" ? "HLS" : "Original"} video not found` }, { status: 404 });
      }

      // Generate signed URL (valid for 1 hour)
      const expiresIn = parseInt(searchParams.get("expiresIn") || "3600");
      const signedUrl = await getSignedUrlForS3(s3Key, expiresIn);

      // For HLS, return the signed URL for the master playlist
      // The VideoPlayer component will handle HLS playback using HLS.js
      // HLS.js will automatically request segments, which will need signed URLs
      // We'll need to configure CORS on S3 or use a proxy for segments

      return NextResponse.json({
        success: true,
        signedUrl: signedUrl,
        s3Key: s3Key,
        type: type,
        expiresIn: expiresIn,
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error("Error generating signed URL:", error);
    return NextResponse.json({ error: "Failed to generate signed URL", details: error.message }, { status: 500 });
  }
}

/**
 * Generate signed URLs for HLS segments
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { segmentKeys, expiresIn = 3600 } = body;

    if (!Array.isArray(segmentKeys) || segmentKeys.length === 0) {
      return NextResponse.json({ error: "segmentKeys array is required" }, { status: 400 });
    }

    const signedUrls: Record<string, string> = {};

    for (const segmentKey of segmentKeys) {
      try {
        const signedUrl = await getSignedUrlForS3(segmentKey, expiresIn);
        signedUrls[segmentKey] = signedUrl;
      } catch (error) {
        console.error(`Error generating signed URL for ${segmentKey}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      signedUrls: signedUrls,
      expiresIn: expiresIn,
    });
  } catch (error: any) {
    console.error("Error generating signed URLs:", error);
    return NextResponse.json({ error: "Failed to generate signed URLs", details: error.message }, { status: 500 });
  }
}
