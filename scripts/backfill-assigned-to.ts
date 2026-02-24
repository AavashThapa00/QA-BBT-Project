import "dotenv/config";
import fs from "fs";
import path from "path";
import Papa from "papaparse";
import { db } from "@/lib/prisma";
import { parseCSVDate } from "@/lib/utils";

interface CsvRow {
  [key: string]: string;
}

const CSV_PATH = path.resolve(
  "app",
  "Smoke Test Sheet - Issue Log (4).csv"
);

const normalizeAssignedTo = (value: string | undefined) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  if (lower.includes("front")) return "Frontend";
  if (lower.includes("dev")) return "Devs";
  return trimmed;
};

const getValue = (row: CsvRow, keys: string[]) => {
  for (const key of keys) {
    if (row[key] && row[key].trim().length > 0) return row[key].trim();
  }
  return "";
};

async function backfillAssignedTo() {
  if (!fs.existsSync(CSV_PATH)) {
    throw new Error(`CSV file not found: ${CSV_PATH}`);
  }

  const csvContent = fs.readFileSync(CSV_PATH, "utf8");
  const parsed = Papa.parse<CsvRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    console.error("CSV parse errors:", parsed.errors);
  }

  let updatedByTestCaseId = 0;
  let updatedByComposite = 0;

  for (const row of parsed.data) {
    const testCaseId = getValue(row, ["Test Case ID", "test case id", "testCaseId"]);
    const assignedToRaw = getValue(row, ["Assigned To", "assigned to", "assignedTo"]);
    const assignedTo = normalizeAssignedTo(assignedToRaw);

    if (!assignedTo) {
      continue;
    }

    if (testCaseId) {
      const res = await db.query(
        `UPDATE defect SET "assignedTo" = $2 WHERE "testCaseId" = $1`,
        [testCaseId, assignedTo]
      );
      if (res.rowCount && res.rowCount > 0) {
        updatedByTestCaseId += res.rowCount;
      }
      continue;
    }

    const dateReportedStr = getValue(row, ["Date Reported", "date reported", "dateReported"]);
    const dateReported = dateReportedStr ? parseCSVDate(dateReportedStr) : null;
    const module = getValue(row, ["Fork and Module", "Module / Component", "module"]);
    const expectedResult = getValue(row, ["Expected Result", "expected result", "expectedResult"]) || "N/A";
    const actualResult = getValue(row, ["Actual Result", "actual result", "actualResult"]) || "N/A";

    const res = await db.query(
      `UPDATE defect
       SET "assignedTo" = $5
       WHERE "dateReported" = $1
         AND module = $2
         AND "expectedResult" = $3
         AND "actualResult" = $4`,
      [dateReported, module, expectedResult, actualResult, assignedTo]
    );

    if (res.rowCount && res.rowCount > 0) {
      updatedByComposite += res.rowCount;
    }
  }

  console.log("Backfill completed:");
  console.log(`- Updated by Test Case ID: ${updatedByTestCaseId}`);
  console.log(`- Updated by date/module/expected/actual: ${updatedByComposite}`);
}

backfillAssignedTo().catch((error) => {
  console.error("Backfill failed:", error);
  process.exit(1);
});
