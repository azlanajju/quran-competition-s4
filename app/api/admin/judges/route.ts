import { getPool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";

// GET: List all judges with scoring progress
export async function GET(request: NextRequest) {
  try {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      const [judges] = (await connection.execute(
        `SELECT id, username, full_name, is_active, score_type, sequence_from, sequence_to, created_at, updated_at 
         FROM judges 
         ORDER BY created_at DESC`
      )) as any[];

      // For each judge, calculate their scoring progress
      const judgesWithProgress = await Promise.all(
        (judges || []).map(async (judge: any) => {
          let totalAssigned = 0;
          let totalScored = 0;

          // Only calculate if judge has a sequence range assigned
          if (judge.sequence_from !== null && judge.sequence_to !== null) {
            // Count total submissions within the judge's assigned range
            // The student_id corresponds to sequence number
            const [totalResult] = (await connection.execute(
              `SELECT COUNT(DISTINCT vs.id) as total
               FROM video_submissions vs
               JOIN students s ON vs.student_id = s.id
               WHERE s.id >= ? AND s.id <= ?
               AND vs.processing_status = 'completed'`,
              [judge.sequence_from, judge.sequence_to]
            )) as any[];
            
            totalAssigned = totalResult[0]?.total || 0;

            // Count how many submissions this judge has scored within their range
            // A submission is considered "scored" by this judge if they have given at least one score (A or B)
            // If judge has a specific score_type, only count that type
            if (judge.score_type) {
              // Judge can only give one type of score (A or B)
              const [scoredResult] = (await connection.execute(
                `SELECT COUNT(DISTINCT js.submission_id) as scored
                 FROM judge_scores js
                 JOIN video_submissions vs ON js.submission_id = vs.id
                 JOIN students s ON vs.student_id = s.id
                 WHERE js.judge_id = ?
                 AND js.score_type = ?
                 AND s.id >= ? AND s.id <= ?`,
                [judge.id, judge.score_type, judge.sequence_from, judge.sequence_to]
              )) as any[];
              
              totalScored = scoredResult[0]?.scored || 0;
            } else {
              // Judge can give both A and B scores
              // Count as scored if they've given at least one score (A or B) for a submission
              const [scoredResult] = (await connection.execute(
                `SELECT COUNT(DISTINCT js.submission_id) as scored
                 FROM judge_scores js
                 JOIN video_submissions vs ON js.submission_id = vs.id
                 JOIN students s ON vs.student_id = s.id
                 WHERE js.judge_id = ?
                 AND s.id >= ? AND s.id <= ?`,
                [judge.id, judge.sequence_from, judge.sequence_to]
              )) as any[];
              
              totalScored = scoredResult[0]?.scored || 0;
            }
          }

          return {
            ...judge,
            total_assigned: totalAssigned,
            total_scored: totalScored,
          };
        })
      );

      return NextResponse.json({
        success: true,
        judges: judgesWithProgress,
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error("Error fetching judges:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch judges", details: error.message }, { status: 500 });
  }
}

// POST: Create a new judge
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, fullName, scoreType, sequenceFrom, sequenceTo } = body;

    if (!username || !password || !fullName) {
      return NextResponse.json({ success: false, error: "Username, password, and full name are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ success: false, error: "Password must be at least 6 characters long" }, { status: 400 });
    }

    // Validate scoreType
    if (scoreType && !["A", "B"].includes(scoreType)) {
      return NextResponse.json({ success: false, error: "scoreType must be either 'A' or 'B'" }, { status: 400 });
    }

    // Validate sequence range
    if (sequenceFrom !== undefined && sequenceFrom !== null) {
      const from = parseInt(sequenceFrom);
      if (isNaN(from) || from < 1) {
        return NextResponse.json({ success: false, error: "sequenceFrom must be a positive integer" }, { status: 400 });
      }
    }

    if (sequenceTo !== undefined && sequenceTo !== null) {
      const to = parseInt(sequenceTo);
      if (isNaN(to) || to < 1) {
        return NextResponse.json({ success: false, error: "sequenceTo must be a positive integer" }, { status: 400 });
      }
    }

    // Validate sequence range logic
    if (sequenceFrom !== undefined && sequenceFrom !== null && sequenceTo !== undefined && sequenceTo !== null) {
      if (parseInt(sequenceFrom) > parseInt(sequenceTo)) {
        return NextResponse.json({ success: false, error: "sequenceFrom must be less than or equal to sequenceTo" }, { status: 400 });
      }
    }

    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      // Check if username already exists
      const [existing] = (await connection.execute(`SELECT id FROM judges WHERE username = ?`, [username])) as any[];

      if (existing.length > 0) {
        return NextResponse.json({ success: false, error: "Username already exists" }, { status: 409 });
      }

      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Insert judge with new fields
      await connection.execute(
        `INSERT INTO judges (username, password_hash, full_name, score_type, sequence_from, sequence_to) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          username,
          passwordHash,
          fullName,
          scoreType || null,
          sequenceFrom ? parseInt(sequenceFrom) : null,
          sequenceTo ? parseInt(sequenceTo) : null,
        ]
      );

      return NextResponse.json({
        success: true,
        message: "Judge created successfully",
      });
    } catch (error: any) {
      if (error.code === "ER_DUP_ENTRY") {
        return NextResponse.json({ success: false, error: "Username already exists" }, { status: 409 });
      }
      throw error;
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error("Error creating judge:", error);
    return NextResponse.json({ success: false, error: "Failed to create judge", details: error.message }, { status: 500 });
  }
}

// PUT: Update judge
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, username, password, fullName, isActive, scoreType, sequenceFrom, sequenceTo } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Judge ID is required" }, { status: 400 });
    }

    // Validate scoreType
    if (scoreType !== undefined && scoreType !== null && !["A", "B"].includes(scoreType)) {
      return NextResponse.json({ success: false, error: "scoreType must be either 'A' or 'B'" }, { status: 400 });
    }

    // Validate sequence range
    if (sequenceFrom !== undefined && sequenceFrom !== null) {
      const from = parseInt(sequenceFrom);
      if (isNaN(from) || from < 1) {
        return NextResponse.json({ success: false, error: "sequenceFrom must be a positive integer" }, { status: 400 });
      }
    }

    if (sequenceTo !== undefined && sequenceTo !== null) {
      const to = parseInt(sequenceTo);
      if (isNaN(to) || to < 1) {
        return NextResponse.json({ success: false, error: "sequenceTo must be a positive integer" }, { status: 400 });
      }
    }

    // Validate sequence range logic
    if (sequenceFrom !== undefined && sequenceFrom !== null && sequenceTo !== undefined && sequenceTo !== null) {
      if (parseInt(sequenceFrom) > parseInt(sequenceTo)) {
        return NextResponse.json({ success: false, error: "sequenceFrom must be less than or equal to sequenceTo" }, { status: 400 });
      }
    }

    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      // Check if judge exists
      const [existing] = (await connection.execute(`SELECT id FROM judges WHERE id = ?`, [id])) as any[];

      if (existing.length === 0) {
        return NextResponse.json({ success: false, error: "Judge not found" }, { status: 404 });
      }

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];

      if (username !== undefined) {
        // Check if new username conflicts
        const [conflict] = (await connection.execute(`SELECT id FROM judges WHERE username = ? AND id != ?`, [username, id])) as any[];
        if (conflict.length > 0) {
          return NextResponse.json({ success: false, error: "Username already exists" }, { status: 409 });
        }
        updates.push("username = ?");
        values.push(username);
      }

      if (password !== undefined) {
        if (password.length < 6) {
          return NextResponse.json({ success: false, error: "Password must be at least 6 characters long" }, { status: 400 });
        }
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        updates.push("password_hash = ?");
        values.push(passwordHash);
      }

      if (fullName !== undefined) {
        updates.push("full_name = ?");
        values.push(fullName);
      }

      if (isActive !== undefined) {
        updates.push("is_active = ?");
        values.push(isActive);
      }

      if (scoreType !== undefined) {
        updates.push("score_type = ?");
        values.push(scoreType || null);
      }

      if (sequenceFrom !== undefined) {
        updates.push("sequence_from = ?");
        values.push(sequenceFrom ? parseInt(sequenceFrom) : null);
      }

      if (sequenceTo !== undefined) {
        updates.push("sequence_to = ?");
        values.push(sequenceTo ? parseInt(sequenceTo) : null);
      }

      if (updates.length === 0) {
        return NextResponse.json({ success: false, error: "No fields to update" }, { status: 400 });
      }

      values.push(id);
      await connection.execute(`UPDATE judges SET ${updates.join(", ")} WHERE id = ?`, values);

      return NextResponse.json({
        success: true,
        message: "Judge updated successfully",
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error("Error updating judge:", error);
    return NextResponse.json({ success: false, error: "Failed to update judge", details: error.message }, { status: 500 });
  }
}

// DELETE: Delete judge
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Judge ID is required" }, { status: 400 });
    }

    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      await connection.execute(`DELETE FROM judges WHERE id = ?`, [parseInt(id)]);

      return NextResponse.json({
        success: true,
        message: "Judge deleted successfully",
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error("Error deleting judge:", error);
    return NextResponse.json({ success: false, error: "Failed to delete judge", details: error.message }, { status: 500 });
  }
}

