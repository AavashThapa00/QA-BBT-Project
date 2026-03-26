import "dotenv/config";
import { readFileSync } from "fs";
import { join } from "path";
import Papa from "papaparse";
import { db } from "../lib/prisma";
import { parseCSVDate, extractColumnValue } from "../lib/utils";
import { uploadCSV } from "../app/actions/csv";

type CSVRecord = Record<string, string>;

function normalizeRowKey(row: CSVRecord) {
  const dateReportedStr = extractColumnValue(row, [
    "Date Reported",
    "date reported",
    "dateReported",
    "date_reported",
  ]);

  const dateReported = parseCSVDate(dateReportedStr);
  if (!dateReported || typeof dateReported === "string") return null;

  const module =
    extractColumnValue(row, [
      "Fork and Module",
      "Module / Component",
      "module",
      "Module",
      "Component",
    ]) || "Unknown";

  const expectedResult =
    extractColumnValue(row, [
      "Expected Result",
      "expected result",
      "expectedResult",
      "expected_result",
    ]) || "N/A";

  const actualResult =
    extractColumnValue(row, [
      "Actual Result",
      "actual result",
      "actualResult",
      "actual_result",
    ]) || "N/A";

  return {
    dateReported: dateReported.toISOString().slice(0, 10),
    module,
    expectedResult,
    actualResult,
  };
}

async function main() {
  const fileName = process.argv[2];
  if (!fileName) {
    throw new Error("Usage: npx tsx scripts/strict-reupload-source.ts \"<csv-file-name>\"");
  }

  const filePath = join(process.cwd(), fileName);
  const csvData = readFileSync(filePath, "utf-8");

  const parsed = Papa.parse<CSVRecord>(csvData, {
    header: true,
    skipEmptyLines: false,
  });

  const keys = new Map<string, { dateReported: string; module: string; expectedResult: string; actualResult: string }>();

  for (const row of parsed.data) {
    const keyObj = normalizeRowKey(row);
    if (!keyObj) continue;
    const mapKey = `${keyObj.dateReported}|${keyObj.module}|${keyObj.expectedResult}|${keyObj.actualResult}`;
    if (!keys.has(mapKey)) {
      keys.set(mapKey, keyObj);
    }
  }

  const beforeSource = await db.query<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM defect WHERE "sourceFile" = $1`,
    [fileName]
  );

  console.log(`Deleting current rows for source: ${fileName}`);
  const deleteSourceRes = await db.query(`DELETE FROM defect WHERE "sourceFile" = $1`, [fileName]);
  console.log(`Deleted from source: ${deleteSourceRes.rowCount ?? 0}`);

  const keyRows = Array.from(keys.values());
  let deletedConflicts = 0;

  if (keyRows.length > 0) {
    const values: string[] = [];
    const params: Array<string> = [];
    let param = 1;

    for (const item of keyRows) {
      values.push(`($${param++}::date, $${param++}::text, $${param++}::text, $${param++}::text)`);
      params.push(item.dateReported, item.module, item.expectedResult, item.actualResult);
    }

    params.push(fileName);

    const deleteConflictsSql = `
      DELETE FROM defect d
      USING (VALUES ${values.join(",")}) AS k(date_reported, module, expected_result, actual_result)
      WHERE d."sourceFile" <> $${param}
        AND d."dateReported" = k.date_reported
        AND d.module = k.module
        AND d."expectedResult" = k.expected_result
        AND d."actualResult" = k.actual_result
    `;

    const deleteConflictsRes = await db.query(deleteConflictsSql, params);
    deletedConflicts = deleteConflictsRes.rowCount ?? 0;
  }

  console.log(`Deleted duplicate conflicts from other sources: ${deletedConflicts}`);

  const uploadResult = await uploadCSV(csvData, fileName);
  if (!uploadResult.success) {
    throw new Error(uploadResult.message);
  }

  const afterSource = await db.query<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM defect WHERE "sourceFile" = $1`,
    [fileName]
  );

  console.log("Strict reupload completed:");
  console.log(`Before source count: ${beforeSource.rows[0]?.count ?? 0}`);
  console.log(`Inserted: ${uploadResult.inserted}`);
  console.log(`Skipped: ${uploadResult.skipped}`);
  console.log(`After source count: ${afterSource.rows[0]?.count ?? 0}`);
  console.log(`Errors reported by importer: ${uploadResult.errors.length}`);
}

main()
  .catch((error) => {
    console.error("Strict reupload failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.pool.end();
  });
