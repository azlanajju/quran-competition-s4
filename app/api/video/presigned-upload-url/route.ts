import { getPool } from "@/lib/db";
import { getPresignedUploadUrl } from "@/lib/s3-upload";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, fileName, fileType, fileSize } = body;

    if (!studentId) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
    }

    if (!fileName || !fileType) {
      return NextResponse.json({ error: "File name and type are required" }, { status: 400 });
    }

    // Validate student exists
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      const [students] = (await connection.execute(`SELECT id FROM students WHERE id = ?`, [parseInt(studentId)])) as any[];

      if (students.length === 0) {
        return NextResponse.json({ error: "Student not found" }, { status: 404 });
      }
    } finally {
      connection.release();
    }

    // Validate file type
    const allowedMimeTypes = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo", "video/avi", "video/x-matroska", "video/3gpp", "video/x-flv", "application/octet-stream"];

    const allowedExtensions = [".mp4", ".webm", ".mov", ".avi", ".mkv", ".3gp", ".flv", ".m4v"];
    const fileExtension = fileName.includes(".") ? "." + fileName.split(".").pop()?.toLowerCase() : "";
    const isValidMimeType = !fileType || allowedMimeTypes.includes(fileType);
    const isValidExtension = fileExtension && allowedExtensions.includes(fileExtension);

    if (!isValidMimeType && !isValidExtension) {
      return NextResponse.json(
        {
          error: "Invalid file type. Only video files are allowed.",
          details: `File type: ${fileType || "unknown"}, Extension: ${fileExtension || "none"}`,
        },
        { status: 400 }
      );
    }

    // Validate file size (max 500MB)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (fileSize && fileSize > maxSize) {
      return NextResponse.json({ error: "File size exceeds maximum allowed size of 500MB" }, { status: 400 });
    }

    // Generate unique S3 key
    const fileExtensionForKey = fileName.split(".").pop()?.toLowerCase() || "mp4";
    const videoKey = `students/${studentId}/upload/${uuidv4()}.${fileExtensionForKey}`;

    // Generate presigned URL (valid for 1 hour)
    const presignedUrl = await getPresignedUploadUrl(
      videoKey,
      fileType || "video/mp4",
      3600 // 1 hour expiry
    );

    return NextResponse.json({
      success: true,
      presignedUrl,
      videoKey,
      expiresIn: 3600,
    });
  } catch (error: any) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json(
      {
        error: "Failed to generate upload URL",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
