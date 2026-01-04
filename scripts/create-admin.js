/**
 * Script to create an admin user
 * Usage: node scripts/create-admin.js <email> <password> <fullName>
 * Example: node scripts/create-admin.js admin@example.com password123 "Admin Name"
 */

const bcrypt = require("bcrypt");
const mysql = require("mysql2/promise");
require("dotenv").config({ path: ".env.local" });

async function createAdmin() {
  const email = process.argv[2];
  const password = process.argv[3];
  const fullName = process.argv[4];

  if (!email || !password || !fullName) {
    console.error("Usage: node scripts/create-admin.js <email> <password> <fullName>");
    process.exit(1);
  }

  try {
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    console.log("Password hashed successfully");

    // Connect to database
    const connection = await mysql.createConnection({
      host: process.env.DATABASE_HOST || "localhost",
      port: parseInt(process.env.DATABASE_PORT || "3306"),
      user: process.env.DATABASE_USER || "root",
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME || "quran_competition",
    });

    // Check if admin already exists
    const [existing] = await connection.execute("SELECT id FROM admins WHERE email = ?", [email.toLowerCase().trim()]);

    if (existing.length > 0) {
      console.error(`Admin with email ${email} already exists`);
      await connection.end();
      process.exit(1);
    }

    // Insert admin
    await connection.execute("INSERT INTO admins (email, password_hash, full_name, is_active) VALUES (?, ?, ?, TRUE)", [email.toLowerCase().trim(), passwordHash, fullName]);

    console.log(`Admin created successfully: ${email}`);
    await connection.end();
  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  }
}

createAdmin();
