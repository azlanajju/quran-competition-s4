-- Migration: Add unique constraint to phone number
-- Run this if your students table doesn't have a unique constraint on phone

USE quran_competition;

-- Check if unique constraint already exists, if not add it
-- Note: This will fail if there are duplicate phone numbers in the table
-- You'll need to clean up duplicates first

ALTER TABLE students 
  ADD UNIQUE KEY unique_phone (phone);

