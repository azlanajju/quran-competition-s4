import { getPool } from "@/lib/db";
import { getSignedUrlForS3, uploadBufferToS3 } from "@/lib/s3-upload";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import { uploadBufferToS3WithProgress } from "@/lib/s3-upload-progress";
import { uploadProgressStore } from "@/lib/upload-progress-store";

// Simple direct upload endpoint - no processing
export const maxDuration = 300; // 5 minutes for large file uploads

export async function POST(request: NextRequest) {
  let studentId: string | null = null;

  try {
    const formData = await request.formData();
    const videoFile = formData.get("video") as File;
    studentId = formData.get("studentId") as string;

    if (!videoFile) {
      return NextResponse.json({ error: "Video file is required" }, { status: 400 });
    }

    if (!studentId) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
    }

    // Validate file type - check both MIME type and file extension
    const allowedMimeTypes = [
      "video/mp4",
      "video/webm",
      "video/quicktime",
      "video/x-msvideo",
      "video/avi",
      "video/x-matroska",
      "video/3gpp",
      "video/x-flv",
      "application/octet-stream", // Sometimes compressed files have this type
    ];

    const allowedExtensions = [".mp4", ".webm", ".mov", ".avi", ".mkv", ".3gp", ".flv", ".m4v"];
    const fileName = videoFile.name.toLowerCase();
    const fileExtension = fileName.includes(".") ? "." + fileName.split(".").pop() : "";

    // Check if MIME type is valid OR file extension is valid
    const isValidMimeType = !videoFile.type || allowedMimeTypes.includes(videoFile.type);
    const isValidExtension = fileExtension && allowedExtensions.includes(fileExtension);

    if (!isValidMimeType && !isValidExtension) {
      return NextResponse.json(
        {
          error: "Invalid file type. Only video files are allowed.",
          details: `File type: ${videoFile.type || "unknown"}, Extension: ${fileExtension || "none"}, File name: ${videoFile.name}`,
        },
        { status: 400 }
      );
    }

    // Upload video directly to S3 using streaming (more efficient for large files)
    const fileExtensionForKey = fileName.split(".").pop()?.toLowerCase() || "mp4";
    const videoKey = `students/${studentId}/upload/${uuidv4()}.${fileExtensionForKey}`;
    const uploadId = uuidv4(); // Unique ID for tracking this upload

    // Get file size for ContentLength header (required for streaming)
    const fileSize = videoFile.size;

    // Initialize progress tracking BEFORE starting upload
    uploadProgressStore.set(uploadId, { uploaded: 0, total: fileSize, percentage: 0, status: 'uploading' });

    // Start S3 upload in background (don't await yet - return uploadId first)
    // But we need to wait for it to complete before returning, so we'll do it synchronously
    // The progress will be tracked and can be polled during the upload
    try {
      // Convert File stream to Node.js Readable stream for S3
      const fileStream = videoFile.stream();
      const nodeStream = Readable.fromWeb(fileStream as any);

      // Upload with progress tracking - this will update the store as it progresses
      const uploadStartTime = Date.now();
      await uploadBufferToS3WithProgress(
        nodeStream,
        videoKey,
        videoFile.type || "video/mp4",
        fileSize,
        (uploaded, total, percentage) => {
          // Update progress in store - this happens during upload
          uploadProgressStore.set(uploadId, { uploaded, total, percentage, status: 'uploading' });
        }
      );
      const uploadDuration = ((Date.now() - uploadStartTime) / 1000).toFixed(2);
      console.log(`Video uploaded successfully to S3: ${videoKey} (${(fileSize / (1024 * 1024)).toFixed(2)} MB) in ${uploadDuration}s`);
      
      // Mark as completed
      uploadProgressStore.set(uploadId, { uploaded: fileSize, total: fileSize, percentage: 100, status: 'completed' });
      
      // Clean up progress tracking after 5 minutes
      setTimeout(() => {
        uploadProgressStore.delete(uploadId);
      }, 5 * 60 * 1000);
    } catch (uploadError) {
      uploadProgressStore.set(uploadId, { uploaded: 0, total: fileSize, percentage: 0, status: 'error', error: (uploadError as Error).message });
      setTimeout(() => {
        uploadProgressStore.delete(uploadId);
      }, 5 * 60 * 1000);
      console.error("Error uploading video to S3:", uploadError);
      return NextResponse.json({ error: "Failed to upload video", details: (uploadError as Error).message }, { status: 500 });
    }

    // Create database record with video info (without waiting for signed URL)
    const pool = getPool();
    const connection = await pool.getConnection();
    let submissionId: number | null = null;

    // Use S3 URL format for now, signed URL will be generated on-demand
    const s3Url = `s3://${process.env.AWS_S3_BUCKET_NAME}/${videoKey}`;

    try {
      const [result] = await connection.execute(
        `INSERT INTO video_submissions (
          student_id, 
          original_video_key,
          original_video_url,
          processing_status,
          video_resolution
        ) VALUES (?, ?, ?, 'completed', 'original')`,
        [parseInt(studentId), videoKey, s3Url]
      );
      const insertResult = result as any;
      submissionId = insertResult.insertId;
    } catch (dbError) {
      console.error("Error creating submission record:", dbError);
      connection.release();
      return NextResponse.json({ error: "Failed to save video record", details: (dbError as Error).message }, { status: 500 });
    } finally {
      connection.release();
    }

    // Generate signed URL asynchronously (don't wait for it)
    getSignedUrlForS3(videoKey, 3600 * 24 * 7).catch((err) => {
      console.error("Error generating signed URL (non-blocking):", err);
    });

    // Return success immediately after upload and database insert
    return NextResponse.json({
      success: true,
      message: "Video uploaded successfully",
      submissionId: submissionId,
      videoKey: videoKey,
      videoUrl: s3Url, // Return S3 URL format, signed URL can be generated on-demand
      status: "completed",
    });
  } catch (error: any) {
    console.error("Video upload error:", error);

    return NextResponse.json(
      {
        error: "Failed to upload video",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
