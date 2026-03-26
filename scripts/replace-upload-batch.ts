import "dotenv/config";
import { readFileSync } from "fs";
import { join } from "path";
import { db } from "../lib/prisma";
import { uploadCSV } from "../app/actions/csv";

async function main() {
  const fileName = process.argv[2];
  if (!fileName) {
    throw new Error("Usage: npx tsx scripts/replace-upload-batch.ts \"<csv-file-name>\"");
  }

  const beforeResult = await db.query<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM defect WHERE "sourceFile" = $1`,
    [fileName]
  );
  const beforeCount = beforeResult.rows[0]?.count ?? 0;

  console.log(`Deleting existing rows for sourceFile: ${fileName}`);
  const deleteResult = await db.query(
    `DELETE FROM defect WHERE "sourceFile" = $1`,
    [fileName]
  );
  console.log(`Deleted: ${deleteResult.rowCount ?? 0}`);

  const csvPath = join(process.cwd(), fileName);
  const csvData = readFileSync(csvPath, "utf-8");

  console.log(`Reuploading: ${fileName}`);
  const uploadResult = await uploadCSV(csvData, fileName);

  if (!uploadResult.success) {
    throw new Error(`Reupload failed: ${uploadResult.message}`);
  }

  const afterResult = await db.query<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM defect WHERE "sourceFile" = $1`,
    [fileName]
  );
  const afterCount = afterResult.rows[0]?.count ?? 0;

  console.log("Reupload complete:");
  console.log(`Before: ${beforeCount}`);
  console.log(`Inserted: ${uploadResult.inserted}`);
  console.log(`Skipped: ${uploadResult.skipped}`);
  console.log(`After: ${afterCount}`);

  if (uploadResult.errors.length > 0) {
    console.log(`Validation/duplicate notes: ${uploadResult.errors.length}`);
  }
}

main()
  .catch((error) => {
    console.error("Failed to replace upload batch:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.pool.end();
  });
