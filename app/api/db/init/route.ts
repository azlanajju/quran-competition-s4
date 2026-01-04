import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase, testConnection } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Test connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      return NextResponse.json(
        { error: 'Database connection failed. Please check your credentials.' },
        { status: 500 }
      );
    }

    // Initialize schema (creates database and tables)
    await initializeDatabase();

    // Verify tables were created
    const { getPool } = await import('@/lib/db');
    const pool = getPool();
    const connection = await pool.getConnection();
    
    try {
      const [tables] = await connection.execute(
        "SHOW TABLES LIKE 'students'"
      ) as any[];
      const [videoTables] = await connection.execute(
        "SHOW TABLES LIKE 'video_submissions'"
      ) as any[];
      const [judgeTables] = await connection.execute(
        "SHOW TABLES LIKE 'judges'"
      ) as any[];
      const [judgeScoreTables] = await connection.execute(
        "SHOW TABLES LIKE 'judge_scores'"
      ) as any[];
      
      return NextResponse.json({
        success: true,
        message: 'Database initialized successfully',
        tablesCreated: {
          students: tables.length > 0,
          video_submissions: videoTables.length > 0,
          judges: judgeTables.length > 0,
          judge_scores: judgeScoreTables.length > 0,
        },
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Database initialization error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to initialize database', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const isConnected = await testConnection();
    return NextResponse.json({
      connected: isConnected,
      message: isConnected
        ? 'Database connection successful'
        : 'Database connection failed',
    });
  } catch (error: any) {
    return NextResponse.json(
      { connected: false, error: error.message },
      { status: 500 }
    );
  }
}

