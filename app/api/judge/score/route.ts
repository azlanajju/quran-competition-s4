import { getPool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET: Fetch existing score for a submission by a judge (optionally filtered by scoreType)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const submissionId = searchParams.get("submissionId");
    const judgeId = searchParams.get("judgeId");
    const scoreType = searchParams.get("scoreType");

    if (!submissionId || !judgeId) {
      return NextResponse.json({ success: false, error: "submissionId and judgeId are required" }, { status: 400 });
    }

    // Validate scoreType if provided
    if (scoreType && !["A", "B"].includes(scoreType)) {
      return NextResponse.json({ success: false, error: "scoreType must be either 'A' or 'B'" }, { status: 400 });
    }

    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      let query = `SELECT * FROM judge_scores 
                   WHERE submission_id = ? AND judge_id = ?`;
      const params: any[] = [parseInt(submissionId), parseInt(judgeId)];

      if (scoreType) {
        query += ` AND score_type = ?`;
        params.push(scoreType);
      }

      const [scores] = (await connection.execute(query, params)) as any[];

      if (scores.length > 0) {
        return NextResponse.json({
          success: true,
          score: scores[0],
        });
      } else {
        return NextResponse.json({
          success: true,
          score: null,
        });
      }
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error("Error fetching score:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch score", details: error.message }, { status: 500 });
  }
}

// POST: Submit or update a score
export async function POST(request: NextRequest) {
  let submissionId: string | undefined;
  let judgeId: string | undefined;
  let scoreType: string | undefined;
  
  try {
    const body = await request.json();
    ({ submissionId, judgeId, scoreType } = body);
    const { score, description } = body;

    // Validate required fields
    if (!submissionId || !judgeId || !scoreType || score === undefined || score === null) {
      return NextResponse.json({ success: false, error: "submissionId, judgeId, scoreType, and score are required" }, { status: 400 });
    }

    if (!["A", "B"].includes(scoreType)) {
      return NextResponse.json({ success: false, error: "scoreType must be either 'A' or 'B'" }, { status: 400 });
    }

    const scoreValue = parseFloat(score);
    if (isNaN(scoreValue) || scoreValue < 0 || scoreValue > 10) {
      return NextResponse.json({ success: false, error: "score must be a valid number between 0 and 10" }, { status: 400 });
    }

    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      // Get judge information including score_type restriction
      const [judges] = (await connection.execute(
        `SELECT username, full_name, score_type FROM judges WHERE id = ?`,
        [parseInt(judgeId)]
      )) as any[];
      if (judges.length === 0) {
        return NextResponse.json({ success: false, error: "Judge not found" }, { status: 404 });
      }
      const judge = judges[0];
      const judgeName = judge.full_name || judge.username;
      const judgeScoreType = judge.score_type;

      // Validate that judge can only score their assigned type
      if (judgeScoreType && judgeScoreType !== scoreType) {
        return NextResponse.json({
          success: false,
          error: `This judge can only evaluate Score ${judgeScoreType}. You are attempting to submit Score ${scoreType}.`,
        }, { status: 403 });
      }

      // Check if score already exists for this judge, submission, AND score_type (A and B are independent)
      const [existing] = (await connection.execute(
        `SELECT * FROM judge_scores 
         WHERE submission_id = ? AND judge_id = ? AND score_type = ?`,
        [parseInt(submissionId), parseInt(judgeId), scoreType]
      )) as any[];

      let result;
      if (existing.length > 0) {
        // Update existing score for this specific score_type
        await connection.execute(
          `UPDATE judge_scores 
           SET score = ?, description = ?, updated_at = CURRENT_TIMESTAMP
           WHERE submission_id = ? AND judge_id = ? AND score_type = ?`,
          [scoreValue, description || null, parseInt(submissionId), parseInt(judgeId), scoreType]
        );

        // Fetch updated score
        const [updated] = (await connection.execute(
          `SELECT * FROM judge_scores 
           WHERE submission_id = ? AND judge_id = ? AND score_type = ?`,
          [parseInt(submissionId), parseInt(judgeId), scoreType]
        )) as any[];

        result = updated[0];
      } else {
        // Insert new score (A and B are completely independent)
        // If database constraint fails, try to update instead (handles case where constraint doesn't include score_type)
        try {
          const [insertResult] = await connection.execute(
            `INSERT INTO judge_scores (submission_id, judge_id, judge_name, score_type, score, description)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [parseInt(submissionId), parseInt(judgeId), judgeName, scoreType, scoreValue, description || null]
          );

          const insertId = (insertResult as any).insertId;

          // Fetch the inserted score
          const [inserted] = (await connection.execute(`SELECT * FROM judge_scores WHERE id = ?`, [insertId])) as any[];
          result = inserted[0];
        } catch (insertError: any) {
          // If insert fails due to unique constraint, check if it's the same score_type
          if (insertError.code === "ER_DUP_ENTRY") {
            // Check if there's an existing score with different score_type
            const [checkExisting] = (await connection.execute(
              `SELECT * FROM judge_scores 
               WHERE submission_id = ? AND judge_id = ? AND score_type = ?`,
              [parseInt(submissionId), parseInt(judgeId), scoreType]
            )) as any[];

            if (checkExisting.length > 0) {
              // Same score_type exists, update it
              await connection.execute(
                `UPDATE judge_scores 
                 SET score = ?, description = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE submission_id = ? AND judge_id = ? AND score_type = ?`,
                [scoreValue, description || null, parseInt(submissionId), parseInt(judgeId), scoreType]
              );

              const [updated] = (await connection.execute(
                `SELECT * FROM judge_scores 
                 WHERE submission_id = ? AND judge_id = ? AND score_type = ?`,
                [parseInt(submissionId), parseInt(judgeId), scoreType]
              )) as any[];

              result = updated[0];
            } else {
              // Different score_type exists but constraint doesn't allow both
              // This means the database constraint needs to be fixed, but we'll throw a helpful error
              throw new Error(`Database constraint prevents having both Score A and Score B for the same judge. Please contact administrator to update the unique constraint to include score_type.`);
            }
          } else {
            throw insertError;
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: existing.length > 0 ? "Score updated successfully" : "Score submitted successfully",
        score: result,
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error("Error submitting score:", error);

    // Handle duplicate entry error - check which score type already exists
    if (error.code === "ER_DUP_ENTRY" && submissionId && judgeId && scoreType) {
      // Try to fetch the existing score to determine which type
      try {
        const pool = getPool();
        const connection = await pool.getConnection();
        try {
          const [existing] = (await connection.execute(
            `SELECT score_type FROM judge_scores 
             WHERE submission_id = ? AND judge_id = ? AND score_type = ?`,
            [parseInt(submissionId), parseInt(judgeId), scoreType]
          )) as any[];
          
          if (existing.length > 0) {
            return NextResponse.json({ 
              success: false, 
              error: `Score ${scoreType} already exists for this submission by this judge` 
            }, { status: 409 });
          } else {
            // Check if there's a score with different type
            const [otherType] = (await connection.execute(
              `SELECT score_type FROM judge_scores 
               WHERE submission_id = ? AND judge_id = ?`,
              [parseInt(submissionId), parseInt(judgeId)]
            )) as any[];
            
            if (otherType.length > 0) {
              const existingType = otherType[0].score_type;
              return NextResponse.json({ 
                success: false, 
                error: `Database constraint prevents having both Score ${existingType} and Score ${scoreType} for the same judge. The unique constraint 'unique_judge_submission' needs to include 'score_type'. Please contact administrator to update the database schema.` 
              }, { status: 409 });
            }
          }
        } finally {
          connection.release();
        }
      } catch (checkError) {
        // Fallback to generic message if check fails
      }
      return NextResponse.json({ 
        success: false, 
        error: `Score ${scoreType} already exists for this submission by this judge` 
      }, { status: 409 });
    }

    return NextResponse.json({ success: false, error: "Failed to submit score", details: error.message }, { status: 500 });
  }
}

