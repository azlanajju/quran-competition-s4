import { getPool } from "@/lib/db";
import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, videoKey } = body;

    if (!studentId || !videoKey) {
      return NextResponse.json({ error: "Student ID and video key are required" }, { status: 400 });
    }

    // Verify student exists
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      const [students] = (await connection.execute(`SELECT id FROM students WHERE id = ?`, [parseInt(studentId)])) as any[];

      if (students.length === 0) {
        return NextResponse.json({ error: "Student not found" }, { status: 404 });
      }
    } catch (dbError) {
      connection.release();
      return NextResponse.json({ error: "Failed to verify student", details: (dbError as Error).message }, { status: 500 });
    }

    // Verify video exists in S3
    try {
      const headCommand = new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: videoKey,
      });
      await s3Client.send(headCommand);
    } catch (s3Error: any) {
      connection.release();
      if (s3Error.name === "NotFound" || s3Error.$metadata?.httpStatusCode === 404) {
        return NextResponse.json({ error: "Video not found in S3. Upload may have failed." }, { status: 404 });
      }
      return NextResponse.json({ error: "Failed to verify video in S3", details: s3Error.message }, { status: 500 });
    }

    // Create database record
    let submissionId: number | null = null;
    const s3Url = `s3://${BUCKET_NAME}/${videoKey}`;

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

    return NextResponse.json({
      success: true,
      message: "Video upload completed successfully",
      submissionId: submissionId,
      videoKey: videoKey,
      videoUrl: s3Url,
      status: "completed",
    });
  } catch (error: any) {
    console.error("Upload completion error:", error);
    return NextResponse.json(
      {
        error: "Failed to complete upload",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
