import "dotenv/config";
import { db } from "@/lib/prisma";

async function backfillUploadedBy() {
  try {
    console.log("Backfilling uploadedBy column...");

    // For files that have sourceFile but no uploadedBy, set to Aavash for existing uploads
    await db.query(`
      UPDATE defect
      SET "uploadedBy" = 'Aavash'
      WHERE "sourceFile" IS NOT NULL AND "uploadedBy" IS NULL
    `);

    console.log("✅ Backfill completed!");
  } catch (error) {
    console.error("❌ Backfill failed:", error);
    process.exit(1);
  }
}

backfillUploadedBy();
