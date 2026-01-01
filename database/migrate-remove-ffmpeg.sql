-- Migration: Remove FFmpeg requirements
-- Run this if your video_submissions table has hls_master_playlist_key as NOT NULL

USE quran_competition;

-- Make HLS fields nullable (if they're currently NOT NULL)
ALTER TABLE video_submissions 
  MODIFY COLUMN hls_master_playlist_key VARCHAR(500) NULL,
  MODIFY COLUMN hls_master_playlist_url VARCHAR(500) NULL;

