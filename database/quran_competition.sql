-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jan 04, 2026 at 06:46 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `quran_competition`
--

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`id`, `email`, `password_hash`, `full_name`, `is_active`, `created_at`, `updated_at`) VALUES
(2, 'muhammedazlan11@gmail.com', '$2b$10$IfBNDhGrs6JOcn8Ox9hb0eX1Vn2VJEAky9CRvzVwJZc8ZWA0DcMp.', 'MuhammedAjlan', 1, '2026-01-03 17:35:14', '2026-01-03 17:35:14');

-- --------------------------------------------------------

--
-- Table structure for table `judges`
--

CREATE TABLE `judges` (
  `id` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `judges`
--

INSERT INTO `judges` (`id`, `username`, `password_hash`, `full_name`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'azlanajju', '$2b$10$B95iHSVyE4jJNtVqNV0HVe6jYQz/thuZc1rIdUGYcYzOSoAu/2hWu', 'Azlan', 1, '2026-01-03 14:56:27', '2026-01-03 14:56:27');

-- --------------------------------------------------------

--
-- Table structure for table `judge_scores`
--

CREATE TABLE `judge_scores` (
  `id` int(11) NOT NULL,
  `submission_id` int(11) NOT NULL,
  `judge_id` int(11) NOT NULL,
  `judge_name` varchar(255) NOT NULL,
  `score_type` enum('A','B') NOT NULL,
  `score` decimal(5,2) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `id` int(11) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `date_of_birth` date NOT NULL,
  `address` text NOT NULL,
  `city` varchar(100) NOT NULL,
  `state` varchar(100) NOT NULL,
  `zip_code` varchar(20) NOT NULL,
  `id_card_key` varchar(500) DEFAULT NULL,
  `id_card_url` varchar(500) DEFAULT NULL,
  `status` enum('pending','submitted','reviewed','approved','rejected') DEFAULT 'submitted',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`id`, `full_name`, `phone`, `date_of_birth`, `address`, `city`, `state`, `zip_code`, `id_card_key`, `id_card_url`, `status`, `created_at`, `updated_at`) VALUES
(16, 'muhammad azlan', '06361557581', '2018-01-01', 'thanchibottu house, sajipanadu', 'Dakshina Kannada', 'Karnataka', '574231', 'student-id-cards/9c7c0d8b-cbe1-433d-8712-ea99f4168f83.png', 's3://qirat-media-bucket/student-id-cards/9c7c0d8b-cbe1-433d-8712-ea99f4168f83.png', 'submitted', '2026-01-04 15:24:27', '2026-01-04 15:24:27'),
(17, 'muhammad azlan', '06361557585', '2018-01-01', 'thanchibottu house, sajipanadu', 'Dakshina Kannada', 'Karnataka', '574231', 'student-id-cards/1802c386-7068-45fb-b28d-2d2b379bd9e6.png', 's3://qirat-media-bucket/student-id-cards/1802c386-7068-45fb-b28d-2d2b379bd9e6.png', 'submitted', '2026-01-04 17:35:52', '2026-01-04 17:35:52');

-- --------------------------------------------------------

--
-- Table structure for table `video_submissions`
--

CREATE TABLE `video_submissions` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `original_video_key` varchar(500) DEFAULT NULL,
  `original_video_url` varchar(500) DEFAULT NULL,
  `hls_master_playlist_key` varchar(500) NOT NULL,
  `hls_master_playlist_url` varchar(500) NOT NULL,
  `video_resolution` varchar(20) DEFAULT '360p',
  `processing_status` enum('pending','processing','completed','failed') DEFAULT 'pending',
  `processing_error` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `video_submissions`
--

INSERT INTO `video_submissions` (`id`, `student_id`, `original_video_key`, `original_video_url`, `hls_master_playlist_key`, `hls_master_playlist_url`, `video_resolution`, `processing_status`, `processing_error`, `created_at`, `updated_at`) VALUES
(14, 16, 'students/16/upload/c625b544-27fa-4cfa-8e60-bf4a3caad084.mp4', 's3://qirat-media-bucket/students/16/upload/c625b544-27fa-4cfa-8e60-bf4a3caad084.mp4', 'videos/14/hls/3ae22df8-2962-4ec4-8dad-70e673b604e0/master.m3u8', 's3://qirat-media-bucket/videos/14/hls/3ae22df8-2962-4ec4-8dad-70e673b604e0/master.m3u8', 'original', 'completed', NULL, '2026-01-04 15:24:31', '2026-01-04 16:45:15'),
(15, 17, 'students/17/upload/ab663066-18ea-48ba-973a-08916c8a3390.mp4', 's3://qirat-media-bucket/students/17/upload/ab663066-18ea-48ba-973a-08916c8a3390.mp4', '', '', 'original', 'failed', NULL, '2026-01-04 17:35:57', '2026-01-04 17:42:07');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- Indexes for table `judges`
--
ALTER TABLE `judges`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `idx_username` (`username`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- Indexes for table `judge_scores`
--
ALTER TABLE `judge_scores`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_judge_submission_score_type` (`submission_id`,`judge_id`,`score_type`),
  ADD KEY `idx_submission_id` (`submission_id`),
  ADD KEY `idx_judge_id` (`judge_id`),
  ADD KEY `idx_judge_name` (`judge_name`),
  ADD KEY `idx_score_type` (`score_type`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_phone` (`phone`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `video_submissions`
--
ALTER TABLE `video_submissions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_student_id` (`student_id`),
  ADD KEY `idx_processing_status` (`processing_status`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `judges`
--
ALTER TABLE `judges`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `judge_scores`
--
ALTER TABLE `judge_scores`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `video_submissions`
--
ALTER TABLE `video_submissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `judge_scores`
--
ALTER TABLE `judge_scores`
  ADD CONSTRAINT `judge_scores_ibfk_1` FOREIGN KEY (`submission_id`) REFERENCES `video_submissions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `judge_scores_ibfk_2` FOREIGN KEY (`judge_id`) REFERENCES `judges` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `video_submissions`
--
ALTER TABLE `video_submissions`
  ADD CONSTRAINT `video_submissions_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
