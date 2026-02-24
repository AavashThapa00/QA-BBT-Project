import "dotenv/config";
import { db } from "@/lib/prisma";
import fs from "fs";
import path from "path";

interface CSVRecord {
  fileName: string;
  testCaseIds: Set<string>;
}

async function backfillSourceFile() {
  console.log("Backfilling sourceFile column...");

  // Define the CSV files and their identifiable test case ID patterns
  const csvFiles: CSVRecord[] = [
    {
      fileName: "29th Dec - 30th Dec (Whole Cycle Test Cases) - DEFECT LOG.csv",
      testCaseIds: new Set([
        "FP003", "LG008", "LG009", "DH001", "DH002", "DH003", "DH004",
        "RS001", "RS002", "RS003", "UI001", "UI002", "UI003", "AP001",
        "AP002", "AP003", "AP004", "AP005", "DB001", "DB002", "DB003",
        "DB004", "DB005", "DB006", "DB007", "DB008", "DB009", "DB010",
        "PF001", "PF002", "PF003", "SC001", "SC002", "SC003", "SC004",
        "SC005", "SC006", "SC007"
      ])
    },
    {
      fileName: "Smoke Test Sheet - Issue Log.csv",
      testCaseIds: new Set([
        "ST-01", "ST-02", "ST-03", "ST-04", "ST-05", "ST-06", "ST-07",
        "ST-08", "ST-09", "ST-10", "ST-11", "ST-12", "ST-13", "ST-14",
        "ST-15", "ST-16", "ST-17", "ST-18", "ST-19", "ST-20", "ST-21",
        "ST-22", "ST-23", "ST-24", "ST-25", "ST-26", "ST-27", "ST-28",
        "ST-29", "ST-30", "ST-31", "ST-32", "ST-33", "ST-34", "ST-35",
        "ST-36", "ST-37", "ST-38", "ST-39", "ST-40", "ST-41", "ST-42",
        "ST-43", "ST-44", "KFQ"
      ])
    },
    {
      fileName: "KFQ- 5th Feb (BBT Cycle) - DEFECT LOG (3).csv",
      testCaseIds: new Set([
        "SP005", "DB005", "DJ006", "DJ012", "NB003", "RE004", "RE009",
        "FP009", "LG007", "SS003", "AR003"
      ])
    }
  ];

  try {
    for (const csv of csvFiles) {
      // Parse the CSV file to get actual test case IDs
      const csvPath = path.join(process.cwd(), csv.fileName);
      
      if (!fs.existsSync(csvPath)) {
        console.log(`⚠️  CSV file not found: ${csv.fileName}`);
        continue;
      }

      const fileContent = fs.readFileSync(csvPath, "utf-8");
      const lines = fileContent.split("\n");
      
      // Get test case IDs from the CSV
      const actualTestCaseIds = new Set<string>();
      
      for (let i = 0; i < Math.min(lines.length, 150); i++) {
        const line = lines[i];
        if (!line.trim() || i === 0) continue; // Skip header and empty lines
        
        const parts = line.split(",");
        if (parts.length > 1) {
          const testCaseId = parts[1]?.trim();
          if (testCaseId && testCaseId.length > 0) {
            actualTestCaseIds.add(testCaseId);
          }
        }
      }

      // Update defects matching these test case IDs
      const updateResult = await db.query(
        `UPDATE defect 
         SET "sourceFile" = $1 
         WHERE "testCaseId" IN (${Array.from(actualTestCaseIds)
           .map((_, i) => `$${i + 2}`)
           .join(",")})
         AND "sourceFile" IS NULL`,
        [csv.fileName, ...Array.from(actualTestCaseIds)]
      );

      console.log(`✅ ${csv.fileName}: Updated ${updateResult.rowCount} records`);
    }

    // Check remaining defects with NULL sourceFile
    const remaining = await db.query(
      `SELECT COUNT(*) as count FROM defect WHERE "sourceFile" IS NULL`
    );

    if (remaining.rows[0]?.count > 0) {
      console.log(
        `⚠️  ${remaining.rows[0].count} defects still have NULL sourceFile (may be from manual entries or other sources)`
      );
    }

    console.log("✅ Backfill completed!");
  } catch (error) {
    console.error("❌ Backfill failed:", error);
    process.exit(1);
  }
}

backfillSourceFile();
