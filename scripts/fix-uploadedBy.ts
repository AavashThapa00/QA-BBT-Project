import "dotenv/config";
import { db } from "@/lib/prisma";

async function fixUploadedBy() {
  try {
    console.log("Fixing uploadedBy to Aavash...");

    const result = await db.query(
      `UPDATE defect SET "uploadedBy" = 'Aavash' WHERE "sourceFile" IS NOT NULL`
    );

    console.log(`✅ Updated ${result.rowCount} records to Aavash`);
  } catch (error) {
    console.error("❌ Fix failed:", error);
    process.exit(1);
  }
}

fixUploadedBy();
