import { getPool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = ["fullName", "phone", "dateOfBirth", "address", "city", "state", "zipCode", "idCardKey"];

    const missingFields = requiredFields.filter((field) => !body[field]);

    if (missingFields.length > 0) {
      return NextResponse.json({ error: `Missing required fields: ${missingFields.join(", ")}` }, { status: 400 });
    }

    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      // Check if phone number already exists (1 registration per phone number)
      const [existingStudents] = (await connection.execute(`SELECT id FROM students WHERE phone = ?`, [body.phone])) as any[];

      if (existingStudents.length > 0) {
        return NextResponse.json({ error: "A registration with this phone number already exists. Each phone number can only register once." }, { status: 409 });
      }

      // Insert student registration
      const [result] = await connection.execute(
        `INSERT INTO students (
          full_name, phone, date_of_birth, address, city, state, zip_code, 
          id_card_key, id_card_url, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted')`,
        [body.fullName, body.phone, body.dateOfBirth, body.address, body.city, body.state, body.zipCode, body.idCardKey, body.idCardUrl || `s3://${process.env.AWS_S3_BUCKET_NAME}/${body.idCardKey}`]
      );

      const insertResult = result as any;
      const studentId = insertResult.insertId;

      return NextResponse.json({
        success: true,
        message: "Registration successful",
        studentId: studentId,
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error("Registration error:", error);

    // Handle duplicate entry (if phone has unique constraint in database)
    if (error.code === "ER_DUP_ENTRY" || error.message?.includes("Duplicate entry")) {
      return NextResponse.json({ error: "A registration with this phone number already exists. Each phone number can only register once." }, { status: 409 });
    }

    return NextResponse.json({ error: "Failed to complete registration", details: error.message }, { status: 500 });
  }
}
