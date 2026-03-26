import "dotenv/config";
import { db } from "../lib/prisma";

async function main() {
  console.log("Adding login verification code table...");

  await db.query(`
    CREATE TABLE IF NOT EXISTS login_verification_code (
      id UUID PRIMARY KEY,
      "userId" UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      code_hash TEXT NOT NULL,
      "expiresAt" TIMESTAMP NOT NULL,
      "usedAt" TIMESTAMP NULL,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await db.query(`CREATE INDEX IF NOT EXISTS login_verification_user_idx ON login_verification_code("userId")`);
  await db.query(`CREATE INDEX IF NOT EXISTS login_verification_expires_idx ON login_verification_code("expiresAt")`);

  console.log("Login verification code table created successfully.");
}

main()
  .catch((error) => {
    console.error("Failed to create login verification code table:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.pool.end();
  });
