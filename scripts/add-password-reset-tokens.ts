import "dotenv/config";
import { db } from "../lib/prisma";

async function main() {
  console.log("Adding password reset token table...");

  await db.query(`
    CREATE TABLE IF NOT EXISTS password_reset_token (
      id UUID PRIMARY KEY,
      "userId" UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL,
      "expiresAt" TIMESTAMP NOT NULL,
      "usedAt" TIMESTAMP NULL,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await db.query(`CREATE INDEX IF NOT EXISTS password_reset_user_idx ON password_reset_token("userId")`);
  await db.query(`CREATE INDEX IF NOT EXISTS password_reset_expires_idx ON password_reset_token("expiresAt")`);
  await db.query(`CREATE UNIQUE INDEX IF NOT EXISTS password_reset_token_hash_unique ON password_reset_token(token_hash)`);

  console.log("Password reset token table created successfully.");
}

main()
  .catch((error) => {
    console.error("Failed to create password reset token table:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.pool.end();
  });
