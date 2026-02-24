import "dotenv/config";
import { db } from "@/lib/prisma";

async function addSourceFileColumn() {
  try {
    console.log("Adding sourceFile column to defect table...");

    await db.query(`
      ALTER TABLE defect
      ADD COLUMN IF NOT EXISTS "sourceFile" VARCHAR(255)
    `);

    console.log("✅ sourceFile column added successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

addSourceFileColumn();
