-- Create admins table if it doesn't exist
CREATE TABLE IF NOT EXISTS `admins` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(255) NOT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_email` (`email`),
  INDEX `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Note: To create an admin user, you'll need to hash the password using bcrypt
-- Example: Use Node.js to hash password
-- const bcrypt = require('bcrypt');
-- const hashedPassword = await bcrypt.hash('your_password', 10);
-- Then insert: INSERT INTO admins (email, password_hash, full_name) VALUES ('admin@example.com', hashedPassword, 'Admin Name');

