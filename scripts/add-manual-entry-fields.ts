import "dotenv/config";
import { db } from "../lib/prisma";

async function main() {
  console.log("Adding manual entry metadata columns...");

  await db.query(`
    ALTER TABLE defect
      ADD COLUMN IF NOT EXISTS "descriptionSteps" TEXT,
      ADD COLUMN IF NOT EXISTS remarks TEXT,
      ADD COLUMN IF NOT EXISTS "testType" VARCHAR(20),
      ADD COLUMN IF NOT EXISTS "testScenario" TEXT,
      ADD COLUMN IF NOT EXISTS "testSteps" TEXT
  `);

  await db.query(`
    UPDATE defect
    SET "testType" = COALESCE("testType", 'smoke')
    WHERE "testType" IS NULL
  `);

  console.log("Manual entry metadata columns added successfully.");
}

main()
  .catch((error) => {
    console.error("Failed to add manual entry metadata columns:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.pool.end();
  });
