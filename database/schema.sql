-- Quran Competition Portal Database Schema
-- Run this SQL script to create the database and tables manually if needed

CREATE DATABASE IF NOT EXISTS quran_competition CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE quran_competition;

-- Students table
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

-- Video submissions table
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

