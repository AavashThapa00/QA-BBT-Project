import "dotenv/config";
import { db } from "@/lib/prisma";

async function addUploadedByColumn() {
  try {
    console.log("Adding uploadedBy column to defect table...");

    await db.query(`
      ALTER TABLE defect
      ADD COLUMN IF NOT EXISTS "uploadedBy" VARCHAR(255)
    `);

    console.log("✅ uploadedBy column added successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

addUploadedByColumn();
