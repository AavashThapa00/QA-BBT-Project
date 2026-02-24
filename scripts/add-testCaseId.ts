import "dotenv/config";
import { db } from "@/lib/prisma";

async function runMigration() {
  try {
    console.log("Adding testCaseId column to defect table...");
    
    await db.query(
      `ALTER TABLE defect ADD COLUMN IF NOT EXISTS "testCaseId" VARCHAR(100)`
    );
    
    console.log("✅ Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
