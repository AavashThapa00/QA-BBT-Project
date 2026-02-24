import "dotenv/config";
import { readFileSync } from "fs";
import { join } from "path";
import { uploadCSV } from "@/app/actions/csv";

async function run() {
  const fileName = process.argv[2] || "Upload Test Sheet.csv";
  const filePath = join(process.cwd(), fileName);

  try {
    console.log(`📁 Reading file: ${fileName}`);
    const csvData = readFileSync(filePath, "utf-8");
    
    console.log("⬆️  Uploading CSV data...");
    const result = await uploadCSV(csvData, fileName);

    if (result.success) {
      console.log("✅ Upload successful!");
      console.log(`   Inserted: ${result.inserted} records`);
      console.log(`   Skipped: ${result.skipped} records`);
      if (result.modules && result.modules.length > 0) {
        console.log(`   Modules: ${result.modules.join(", ")}`);
      }
    } else {
      console.log("❌ Upload failed:", result.message);
    }

    if (result.errors.length > 0) {
      console.log(`\n⚠️  Errors (${result.errors.length}):`);
      result.errors.forEach((err) => {
        console.log(`   Row ${err.row}: ${err.reason}`);
      });
    }
  } catch (error) {
    console.error("❌ Failed to upload CSV:", error);
    process.exit(1);
  }
}

run();
