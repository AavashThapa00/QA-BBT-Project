import "dotenv/config";
import { db } from "../lib/prisma";

async function main() {
  console.log("Adding google_id support...");

  await db.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS google_id VARCHAR(255)`);
  await db.query(`CREATE UNIQUE INDEX IF NOT EXISTS user_google_id_unique ON "user"(google_id) WHERE google_id IS NOT NULL`);

  console.log("google_id support added successfully.");
}

main()
  .catch((error) => {
    console.error("Failed to add Google auth support:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.pool.end();
  });
