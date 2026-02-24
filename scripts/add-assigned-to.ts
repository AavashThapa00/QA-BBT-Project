import "dotenv/config";
import { db } from "@/lib/prisma";

async function addAssignedToColumn() {
  try {
    console.log("Adding assignedTo column to defect table...");

    await db.query(`
      ALTER TABLE defect
      ADD COLUMN IF NOT EXISTS "assignedTo" VARCHAR(100)
    `);

    console.log("✅ assignedTo column added successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

addAssignedToColumn();
