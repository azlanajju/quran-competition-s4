import { getPool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      // Get total students count
      const [studentsCount] = (await connection.execute("SELECT COUNT(*) as total FROM students")) as any[];

      // Get students by status
      const [studentsByStatus] = (await connection.execute("SELECT status, COUNT(*) as count FROM students GROUP BY status")) as any[];

      // Get total video submissions
      const [submissionsCount] = (await connection.execute("SELECT COUNT(*) as total FROM video_submissions")) as any[];

      // Get submissions by processing status
      const [submissionsByStatus] = (await connection.execute("SELECT processing_status, COUNT(*) as count FROM video_submissions GROUP BY processing_status")) as any[];

      // Get recent registrations (last 7 days)
      const [recentRegistrations] = (await connection.execute(
        `SELECT COUNT(*) as count FROM students 
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
      )) as any[];

      // Get recent video submissions (last 7 days)
      const [recentSubmissions] = (await connection.execute(
        `SELECT COUNT(*) as count FROM video_submissions 
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
      )) as any[];

      // Get students with video submissions
      const [studentsWithVideos] = (await connection.execute(
        `SELECT COUNT(DISTINCT student_id) as count FROM video_submissions 
         WHERE processing_status = 'completed'`
      )) as any[];

      // Get registrations over time (last 30 days)
      const [registrationsOverTime] = (await connection.execute(
        `SELECT DATE(created_at) as date, COUNT(*) as count 
         FROM students 
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
         GROUP BY DATE(created_at)
         ORDER BY date ASC`
      )) as any[];

      // Get submissions over time (last 30 days)
      const [submissionsOverTime] = (await connection.execute(
        `SELECT DATE(created_at) as date, COUNT(*) as count 
         FROM video_submissions 
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
         GROUP BY DATE(created_at)
         ORDER BY date ASC`
      )) as any[];

      return NextResponse.json({
        success: true,
        stats: {
          totalRegistrations: studentsCount[0]?.total || 0,
          totalSubmissions: submissionsCount[0]?.total || 0,
          completedSubmissions: submissionsByStatus.find((s: any) => s.processing_status === 'completed')?.count || 0,
          recentActivity: recentRegistrations[0]?.count + recentSubmissions[0]?.count || 0,
          recentRegistrations: recentRegistrations[0]?.count || 0,
          recentSubmissions: recentSubmissions[0]?.count || 0,
          studentsWithVideos: studentsWithVideos[0]?.count || 0,
          studentsByStatus: studentsByStatus.reduce((acc: any, row: any) => {
            acc[row.status] = row.count;
            return acc;
          }, {}),
          submissionsByStatus: submissionsByStatus.reduce((acc: any, row: any) => {
            acc[row.processing_status] = row.count;
            return acc;
          }, {}),
          registrationsOverTime: registrationsOverTime || [],
          submissionsOverTime: submissionsOverTime || [],
        },
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data", details: error.message }, { status: 500 });
  }
}
