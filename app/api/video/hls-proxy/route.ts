import { getPool } from "@/lib/db";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

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
        query = `SELECT hls_master_playlist_key FROM video_submissions WHERE id = ?`;
        params = [parseInt(submissionId)];
      } else {
        query = `SELECT hls_master_playlist_key FROM video_submissions WHERE student_id = ? ORDER BY created_at DESC LIMIT 1`;
        params = [parseInt(studentId!)];
      }

      const [rows] = (await connection.execute(query, params)) as any[];
      const submissions = rows;

      if (submissions.length === 0) {
        return NextResponse.json({ error: "Video submission not found" }, { status: 404 });
      }

      const masterPlaylistKey = submissions[0].hls_master_playlist_key;

      // Get the master playlist from S3
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: masterPlaylistKey,
      });

      const response = await s3Client.send(command);
      const playlistContent = await response.Body?.transformToString();

      if (!playlistContent) {
        return NextResponse.json({ error: "Failed to read playlist" }, { status: 500 });
      }

      // Get the base path (directory) of the master playlist
      const basePath = masterPlaylistKey.substring(0, masterPlaylistKey.lastIndexOf("/") + 1);

      // Process playlist lines and convert relative segment paths to proxy URLs
      const lines = playlistContent.split("\n");
      const processedLines: string[] = [];

      for (const line of lines) {
        const trimmedLine = line.trim();

        // Skip comments and empty lines (but keep them in the playlist)
        if (trimmedLine.startsWith("#") || trimmedLine === "") {
          processedLines.push(line);
          continue;
        }

        // If it's a segment file (.ts), use our segment proxy endpoint
        // This avoids CORS issues and ensures segments are accessible
        if (trimmedLine.endsWith(".ts") || (trimmedLine.endsWith(".m3u8") && !trimmedLine.includes("master.m3u8"))) {
          const segmentKey = basePath + trimmedLine;
          // Use absolute URL for segment proxy based on request origin
          const url = new URL(request.url);
          const baseUrl = `${url.protocol}//${url.host}`;
          const proxyUrl = `${baseUrl}/api/video/segment-proxy?key=${encodeURIComponent(segmentKey)}`;
          processedLines.push(proxyUrl);
        } else {
          processedLines.push(line);
        }
      }

      const processedPlaylist = processedLines.join("\n");

      return new NextResponse(processedPlaylist, {
        headers: {
          "Content-Type": "application/vnd.apple.mpegurl",
          "Cache-Control": "no-cache",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error("HLS proxy error:", error);
    return NextResponse.json({ error: "Failed to proxy HLS playlist", details: error.message }, { status: 500 });
  }
}
