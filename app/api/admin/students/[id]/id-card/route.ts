import { getPool } from "@/lib/db";
import { getSignedUrlForS3 } from "@/lib/s3-upload";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const studentId = resolvedParams.id;

    if (!studentId) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
    }

    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      const [students] = (await connection.execute(
        `SELECT id_card_key, id_card_url FROM students WHERE id = ?`,
        [parseInt(studentId)]
      )) as any[];

      if (students.length === 0) {
        return NextResponse.json({ error: "Student not found" }, { status: 404 });
      }

      const student = students[0];

      if (!student.id_card_key) {
        return NextResponse.json({ error: "ID card not found for this student" }, { status: 404 });
      }

      // Generate signed URL (valid for 1 hour)
      const expiresIn = 3600;
      const signedUrl = await getSignedUrlForS3(student.id_card_key, expiresIn);

      return NextResponse.json({
        success: true,
        signedUrl: signedUrl,
        idCardKey: student.id_card_key,
        idCardUrl: student.id_card_url,
        expiresIn: expiresIn,
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error("Error generating ID card signed URL:", error);
    return NextResponse.json({ error: "Failed to generate signed URL", details: error.message }, { status: 500 });
  }
}

