import { getPool } from "@/lib/db";
import { getSignedUrlForS3, uploadBufferToS3 } from "@/lib/s3-upload";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

// Simple direct upload endpoint - no processing
export const maxDuration = 60; // 60 seconds for upload

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

    // Validate file size (100MB max)
    const maxSize = 100 * 1024 * 1024;
    if (videoFile.size > maxSize) {
      return NextResponse.json({ error: "File size exceeds 100MB limit" }, { status: 400 });
    }

    // Upload video directly to S3 in upload folder
    const bytes = await videoFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileExtensionForKey = fileName.split(".").pop()?.toLowerCase() || "mp4";
    const videoKey = `students/${studentId}/upload/${uuidv4()}.${fileExtensionForKey}`;

    let videoUrl: string;
    try {
      await uploadBufferToS3(buffer, videoKey, videoFile.type || "video/mp4");
      // Generate signed URL for the video
      videoUrl = await getSignedUrlForS3(videoKey, 3600 * 24 * 7); // 7 days
    } catch (uploadError) {
      console.error("Error uploading video to S3:", uploadError);
      return NextResponse.json({ error: "Failed to upload video", details: (uploadError as Error).message }, { status: 500 });
    }

    // Create database record with video info
    const pool = getPool();
    const connection = await pool.getConnection();
    let submissionId: number | null = null;

    try {
      const [result] = await connection.execute(
        `INSERT INTO video_submissions (
          student_id, 
          original_video_key,
          original_video_url,
          processing_status,
          video_resolution
        ) VALUES (?, ?, ?, 'completed', 'original')`,
        [parseInt(studentId), videoKey, videoUrl]
      );
      const insertResult = result as any;
      submissionId = insertResult.insertId;
    } catch (dbError) {
      console.error("Error creating submission record:", dbError);
      return NextResponse.json({ error: "Failed to save video record", details: (dbError as Error).message }, { status: 500 });
    } finally {
      connection.release();
    }

    // Return success immediately
    return NextResponse.json({
      success: true,
      message: "Video uploaded successfully",
      submissionId: submissionId,
      videoKey: videoKey,
      videoUrl: videoUrl,
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
