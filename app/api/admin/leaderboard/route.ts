import { getPool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10"); // Default to top 10

    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      // Get all submissions with their scores
      const [submissions] = (await connection.execute(
        `SELECT 
          vs.id as submission_id,
          vs.student_id,
          vs.created_at as submission_date,
          s.full_name,
          s.phone,
          s.city,
          s.state,
          s.date_of_birth
        FROM video_submissions vs
        JOIN students s ON vs.student_id = s.id
        WHERE vs.processing_status = 'completed'
        ORDER BY vs.created_at DESC`
      )) as any[];

      // Get scores for each submission and calculate averages
      const leaderboardEntries = await Promise.all(
        submissions.map(async (submission: any) => {
          const [scores] = (await connection.execute(
            `SELECT js.*, j.full_name as judge_full_name
             FROM judge_scores js
             LEFT JOIN judges j ON js.judge_id = j.id
             WHERE js.submission_id = ?
             ORDER BY js.score_type, js.created_at DESC`,
            [submission.submission_id]
          )) as any[];

          // Get latest scores of each type
          const scoreA = scores.find((s: any) => s.score_type === "A");
          const scoreB = scores.find((s: any) => s.score_type === "B");

          // Calculate average - use both scores if available, otherwise use single score
          let averageScore = null;
          if (scoreA && scoreB) {
            const scoreAValue = typeof scoreA.score === 'string' ? parseFloat(scoreA.score) : scoreA.score;
            const scoreBValue = typeof scoreB.score === 'string' ? parseFloat(scoreB.score) : scoreB.score;
            if (!isNaN(scoreAValue) && !isNaN(scoreBValue)) {
              const avg = (scoreAValue + scoreBValue) / 2;
              averageScore = avg % 1 === 0 ? avg : parseFloat(avg.toFixed(2));
            }
          } else if (scoreA) {
            // If only scoreA exists, use it as average
            const scoreAValue = typeof scoreA.score === 'string' ? parseFloat(scoreA.score) : scoreA.score;
            if (!isNaN(scoreAValue)) {
              averageScore = scoreAValue % 1 === 0 ? scoreAValue : parseFloat(scoreAValue.toFixed(2));
            }
          } else if (scoreB) {
            // If only scoreB exists, use it as average
            const scoreBValue = typeof scoreB.score === 'string' ? parseFloat(scoreB.score) : scoreB.score;
            if (!isNaN(scoreBValue)) {
              averageScore = scoreBValue % 1 === 0 ? scoreBValue : parseFloat(scoreBValue.toFixed(2));
            }
          }

          // Safely convert scores to numbers
          const scoreAValue = scoreA ? (typeof scoreA.score === 'string' ? parseFloat(scoreA.score) : scoreA.score) : null;
          const scoreBValue = scoreB ? (typeof scoreB.score === 'string' ? parseFloat(scoreB.score) : scoreB.score) : null;

          return {
            submission_id: submission.submission_id,
            student_id: submission.student_id,
            full_name: submission.full_name,
            phone: submission.phone,
            city: submission.city,
            state: submission.state,
            date_of_birth: submission.date_of_birth,
            submission_date: submission.submission_date,
            scoreA: scoreAValue !== null && !isNaN(scoreAValue) ? (scoreAValue % 1 === 0 ? scoreAValue : parseFloat(scoreAValue.toFixed(2))) : null,
            scoreB: scoreBValue !== null && !isNaN(scoreBValue) ? (scoreBValue % 1 === 0 ? scoreBValue : parseFloat(scoreBValue.toFixed(2))) : null,
            averageScore: averageScore,
            hasBothScores: !!(scoreA && scoreB),
          };
        })
      );

      // Filter out entries without scores and sort by average score (descending)
      const rankedEntries = leaderboardEntries
        .filter((entry) => entry.averageScore !== null)
        .sort((a, b) => {
          // Sort by average score descending
          if (b.averageScore! > a.averageScore!) return 1;
          if (b.averageScore! < a.averageScore!) return -1;
          // If scores are equal, sort by submission date (earlier is better)
          return new Date(a.submission_date).getTime() - new Date(b.submission_date).getTime();
        })
        .map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }))
        .slice(0, limit); // Limit results

      return NextResponse.json({
        success: true,
        leaderboard: rankedEntries,
        total: rankedEntries.length,
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error("Leaderboard error:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard", details: error.message }, { status: 500 });
  }
}

