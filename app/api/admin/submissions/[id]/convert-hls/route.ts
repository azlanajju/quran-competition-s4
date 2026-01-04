import { getPool } from "@/lib/db";
import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { exec } from "child_process";
import { promises as fs } from "fs";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { promisify } from "util";
import { v4 as uuidv4 } from "uuid";
import { clearConversionProgress, updateConversionProgress } from "./status/route";

const execAsync = promisify(exec);

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = await Promise.resolve(params);
  const submissionId = resolvedParams.id;

  if (!submissionId) {
    return NextResponse.json({ success: false, error: "Submission ID is required" }, { status: 400 });
  }

  const pool = getPool();
  const connection = await pool.getConnection();
  const tempDir = path.join(process.cwd(), "temp", `hls-${uuidv4()}`);
  let originalVideoPath = "";
  let hlsOutputDir = "";

  try {
    // Get submission details
    const [submissions] = (await connection.execute(
      `SELECT id, original_video_key, original_video_url, hls_master_playlist_key
       FROM video_submissions 
       WHERE id = ?`,
      [parseInt(submissionId)]
    )) as any[];

    if (submissions.length === 0) {
      return NextResponse.json({ success: false, error: "Submission not found" }, { status: 404 });
    }

    const submission = submissions[0];

    if (!submission.original_video_key) {
      return NextResponse.json({ success: false, error: "Original video not found" }, { status: 404 });
    }

    if (submission.hls_master_playlist_key) {
      return NextResponse.json({ success: false, error: "Video already converted to HLS" }, { status: 400 });
    }

    // Create temp directory
    await fs.mkdir(tempDir, { recursive: true });
    hlsOutputDir = path.join(tempDir, "hls");
    await fs.mkdir(hlsOutputDir, { recursive: true });

    // Download original video from S3 with progress tracking
    updateConversionProgress(parseInt(submissionId), "downloading", 5, "Starting download from S3...");
    console.log(`Downloading video from S3: ${submission.original_video_key}`);

    // First, get the object metadata to know the file size
    const headCommand = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: submission.original_video_key,
    });

    let totalSize = 0;
    try {
      const headResponse = await s3Client.send(headCommand);
      totalSize = headResponse.ContentLength || 0;
      updateConversionProgress(parseInt(submissionId), "downloading", 5, `File size: ${(totalSize / (1024 * 1024)).toFixed(2)} MB`);
    } catch (err) {
      console.warn("Could not get file size, proceeding without progress tracking");
    }

    const getObjectCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: submission.original_video_key,
    });

    const s3Response = await s3Client.send(getObjectCommand);

    // Download with progress tracking
    updateConversionProgress(parseInt(submissionId), "downloading", 10, "Downloading video...");
    const videoBuffer = await streamToBufferWithProgress(s3Response.Body as any, totalSize, (progress, downloaded) => {
      const percentage = totalSize > 0 ? Math.floor((downloaded / totalSize) * 100) : 0;
      const progressValue = 10 + Math.floor((percentage / 100) * 10); // 10-20% range
      updateConversionProgress(parseInt(submissionId), "downloading", progressValue, `Downloading: ${percentage}% (${(downloaded / (1024 * 1024)).toFixed(2)} MB / ${(totalSize / (1024 * 1024)).toFixed(2)} MB)`);
    });

    originalVideoPath = path.join(tempDir, "original.mp4");
    await fs.writeFile(originalVideoPath, videoBuffer);

    updateConversionProgress(parseInt(submissionId), "downloading", 20, "Video downloaded successfully");
    console.log(`Video downloaded, converting to HLS...`);

    // Convert to HLS using FFmpeg
    updateConversionProgress(parseInt(submissionId), "converting", 30, "Starting HLS conversion...");
    const masterPlaylistPath = path.join(hlsOutputDir, "master.m3u8");
    const segmentPattern = path.join(hlsOutputDir, "segment_%03d.ts");

    // FFmpeg command to create HLS
    const ffmpegCommand = `ffmpeg -i "${originalVideoPath}" \
      -c:v libx264 -c:a aac \
      -hls_time 10 \
      -hls_playlist_type vod \
      -hls_segment_filename "${segmentPattern}" \
      -hls_list_size 0 \
      -f hls \
      "${masterPlaylistPath}"`;

    try {
      updateConversionProgress(parseInt(submissionId), "converting", 40, "Processing video with FFmpeg...");
      await execAsync(ffmpegCommand);
      updateConversionProgress(parseInt(submissionId), "converting", 50, "HLS conversion completed");
      console.log("HLS conversion completed");
    } catch (ffmpegError: any) {
      console.error("FFmpeg error:", ffmpegError);
      updateConversionProgress(parseInt(submissionId), "error", 0, "FFmpeg conversion failed", ffmpegError.message);
      throw new Error(`FFmpeg conversion failed: ${ffmpegError.message}`);
    }

    // Upload HLS files to S3
    updateConversionProgress(parseInt(submissionId), "uploading", 60, "Preparing HLS files for upload...");
    const hlsBaseKey = `hls/${submissionId}/${uuidv4()}`;
    const uploadedFiles: string[] = [];

    const files = await fs.readdir(hlsOutputDir);
    const totalFiles = files.filter((f) => {
      const filePath = path.join(hlsOutputDir, f);
      return fs
        .stat(filePath)
        .then((stat) => stat.isFile())
        .catch(() => false);
    }).length;

    let uploadedCount = 0;
    for (const file of files) {
      const filePath = path.join(hlsOutputDir, file);
      const stat = await fs.stat(filePath);

      if (stat.isFile()) {
        const fileContent = await fs.readFile(filePath);
        const s3Key = `${hlsBaseKey}/${file}`;

        let contentType = "application/octet-stream";
        if (file.endsWith(".m3u8")) {
          contentType = "application/vnd.apple.mpegurl";
        } else if (file.endsWith(".ts")) {
          contentType = "video/mp2t";
        }

        const putCommand = new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: s3Key,
          Body: fileContent,
          ContentType: contentType,
        });

        await s3Client.send(putCommand);
        uploadedFiles.push(s3Key);
        uploadedCount++;
        const uploadProgress = 60 + Math.floor((uploadedCount / totalFiles) * 20);
        updateConversionProgress(parseInt(submissionId), "uploading", uploadProgress, `Uploading ${uploadedCount}/${totalFiles} files to S3...`);
        console.log(`Uploaded ${file} to S3`);
      }
    }

    // Find master playlist
    const masterPlaylistKey = uploadedFiles.find((key) => key.endsWith("master.m3u8"));
    if (!masterPlaylistKey) {
      throw new Error("Master playlist not found after conversion");
    }

    const masterPlaylistUrl = `s3://${BUCKET_NAME}/${masterPlaylistKey}`;

    // Update database with HLS info - change video_resolution from 'original' to 'hls'
    updateConversionProgress(parseInt(submissionId), "cleaning", 85, "Updating database...");
    await connection.execute(
      `UPDATE video_submissions 
       SET hls_master_playlist_key = ?, 
           hls_master_playlist_url = ?,
           original_video_key = NULL,
           original_video_url = NULL,
           video_resolution = 'hls'
       WHERE id = ?`,
      [masterPlaylistKey, masterPlaylistUrl, parseInt(submissionId)]
    );

    // Delete original video from S3
    updateConversionProgress(parseInt(submissionId), "cleaning", 90, "Deleting original video from S3...");
    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: submission.original_video_key,
      });

      await s3Client.send(deleteCommand);
      console.log(`Deleted original video from S3: ${submission.original_video_key}`);
      updateConversionProgress(parseInt(submissionId), "cleaning", 92, "Original video deleted from S3");
    } catch (deleteError: any) {
      console.error(`Error deleting original video from S3: ${deleteError.message}`);
      // Continue even if deletion fails - the video is already converted
      updateConversionProgress(parseInt(submissionId), "cleaning", 92, "Warning: Could not delete original video from S3");
    }

    updateConversionProgress(parseInt(submissionId), "completed", 100, "Conversion completed successfully!");

    // Clear progress after a longer delay (to allow final status to be read multiple times)
    // Keep it for 30 seconds so the popup can detect completion
    setTimeout(() => {
      clearConversionProgress(parseInt(submissionId));
    }, 30000);

    return NextResponse.json({
      success: true,
      message: "Video converted to HLS successfully",
      hlsMasterPlaylistKey: masterPlaylistKey,
      uploadedFiles: uploadedFiles.length,
    });
  } catch (error: any) {
    console.error("HLS conversion error:", error);
    updateConversionProgress(parseInt(submissionId), "error", 0, "Conversion failed", error.message || "Unknown error occurred");
    return NextResponse.json(
      {
        success: false,
        error: "Failed to convert video to HLS",
        details: error.message,
      },
      { status: 500 }
    );
  } finally {
    connection.release();

    // Cleanup temp files (including downloaded original video)
    try {
      // Delete the downloaded original video file first (if it exists)
      if (originalVideoPath) {
        try {
          await fs.unlink(originalVideoPath);
          console.log(`Deleted local original video: ${originalVideoPath}`);
        } catch (unlinkError) {
          // File might already be deleted or not exist
          console.warn(`Could not delete local original video (may not exist): ${unlinkError}`);
        }
      }

      // Delete the entire temp directory (including HLS output)
      if (
        tempDir &&
        (await fs
          .access(tempDir)
          .then(() => true)
          .catch(() => false))
      ) {
        await fs.rm(tempDir, { recursive: true, force: true });
        console.log(`Cleaned up temp directory: ${tempDir}`);
      }
    } catch (cleanupError) {
      console.error("Error cleaning up temp files:", cleanupError);
    }

    // Clear progress on error (if not already cleared)
    try {
      clearConversionProgress(parseInt(submissionId));
    } catch (e) {
      // Ignore errors when clearing
    }
  }
}

// Helper function to convert stream to buffer
async function streamToBuffer(stream: any): Promise<Buffer> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

// Helper function to convert stream to buffer with progress tracking
async function streamToBufferWithProgress(stream: any, totalSize: number, onProgress: (progress: number, downloaded: number) => void): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let downloaded = 0;

  return new Promise((resolve, reject) => {
    stream.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
      downloaded += chunk.length;
      onProgress((downloaded / totalSize) * 100, downloaded);
    });
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
}
