import mysql, { Pool } from "mysql2/promise";

// Database connection pool
let pool: Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DATABASE_HOST || "localhost",
      port: parseInt(process.env.DATABASE_PORT || "3306"),
      user: process.env.DATABASE_USER || "root",
      password: process.env.DATABASE_PASSWORD || "",
      database: process.env.DATABASE_NAME || "quran_competition",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });
  }
  return pool;
}

// Initialize database schema
export async function initializeDatabase(): Promise<void> {
  // First, create database if it doesn't exist (connect without database)
  const dbName = process.env.DATABASE_NAME || "quran_competition";
  const tempPool = mysql.createPool({
    host: process.env.DATABASE_HOST || "localhost",
    port: parseInt(process.env.DATABASE_PORT || "3306"),
    user: process.env.DATABASE_USER || "root",
    password: process.env.DATABASE_PASSWORD || "",
    waitForConnections: true,
    connectionLimit: 1,
  });

  try {
    const tempConnection = await tempPool.getConnection();
    try {
      // Create database if it doesn't exist
      await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      console.log(`Database '${dbName}' created or already exists`);
    } finally {
      tempConnection.release();
    }
  } finally {
    await tempPool.end();
  }

  // Now connect to the database and create tables
  const connection = await getPool().getConnection();

  try {
    // Create students table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS students (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL UNIQUE,
        date_of_birth DATE NOT NULL,
        address TEXT NOT NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        zip_code VARCHAR(20) NOT NULL,
        id_card_key VARCHAR(500),
        id_card_url VARCHAR(500),
        status ENUM('pending', 'submitted', 'reviewed', 'approved', 'rejected') DEFAULT 'submitted',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_phone (phone),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("Students table created or already exists");

    // Create video_submissions table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS video_submissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        original_video_key VARCHAR(500),
        original_video_url VARCHAR(500),
        hls_master_playlist_key VARCHAR(500),
        hls_master_playlist_url VARCHAR(500),
        video_resolution VARCHAR(20) DEFAULT '360p',
        processing_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
        processing_error TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        INDEX idx_student_id (student_id),
        INDEX idx_processing_status (processing_status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("Video submissions table created or already exists");

    console.log("Database schema initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  } finally {
    connection.release();
  }
}

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    const connection = await getPool().getConnection();
    await connection.ping();
    connection.release();
    return true;
  } catch (error) {
    console.error("Database connection test failed:", error);
    return false;
  }
}
