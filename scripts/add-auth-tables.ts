import "dotenv/config";
import { db } from "@/lib/prisma";

async function addAuthTables() {
  try {
    console.log("Creating auth tables...");

    await db.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    await db.query(`
      CREATE TABLE IF NOT EXISTS "user" (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(120) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(50),
        password_hash TEXT NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'admin',
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await db.query(`
      ALTER TABLE "user"
      ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'admin'
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS session (
        id VARCHAR(128) PRIMARY KEY,
        "userId" uuid NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await db.query(`CREATE INDEX IF NOT EXISTS session_user_id_idx ON session ("userId");`);
    await db.query(`CREATE INDEX IF NOT EXISTS session_expires_idx ON session ("expiresAt");`);

    console.log("✅ Auth tables created");
  } catch (error) {
    console.error("❌ Failed to create auth tables:", error);
    process.exit(1);
  }
}

addAuthTables();
