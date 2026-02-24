"use server";

import { db } from "@/lib/prisma";
import { CreateDefectSchema, CSVRowSchema } from "@/lib/validators";
import { parseCSVDate, normalizeEnumValue, extractColumnValue } from "@/lib/utils";
import { Severity, Status, SeverityEnum, StatusEnum } from "@/lib/types";
import { ZodError } from "zod";
import { randomUUID } from "crypto";

export interface UploadResult {
    success: boolean;
    message: string;
    inserted: number;
    skipped: number;
    errors: Array<{
        row: number;
        reason: string;
    }>;
    modules?: string[];
    debug?: {
        csvHeaders?: string[];
    };
}

export async function uploadCSV(csvData: string): Promise<UploadResult> {
    const errors: Array<{ row: number; reason: string }> = [];
    let inserted = 0;
    let skipped = 0;

    try {
        // Parse CSV properly handling quoted multiline cells
        const rows = parseCSVContent(csvData);
        const modulesSet = new Set<string>();

        if (rows.length < 2) {
            return {
                success: false,
                message: "CSV file is empty or contains only headers",
                inserted: 0,
                skipped: 0,
                errors: [],
            };
        }

        const headers = rows[0];
        
        // Log the headers found (for debugging)
        console.log("CSV Headers found:", headers);

        for (let i = 1; i < rows.length; i++) {
            const values = rows[i];

            // Skip rows where all values are empty or whitespace-only
            const hasAnyData = values.some(v => v && v.trim().length > 0);
            if (!hasAnyData) {
                skipped++;
                continue;
            }

            try {
                const row: Record<string, string> = {};

                headers.forEach((header, index) => {
                    row[header] = values[index] || "";
                });

                // Validate and normalize the row
                const validatedRow = CSVRowSchema.parse(row) as Record<string, string>;

                // Extract and normalize values
                const dateReportedStr = extractColumnValue(
                    validatedRow,
                    [
                        "Date Reported",
                        "date reported",
                        "dateReported",
                        "date_reported",
                    ]
                );
                
                const dateReported = parseCSVDate(dateReportedStr);

                // If Date Reported is missing but row has data, report error so user knows
                if (!dateReported && (validatedRow.module || validatedRow["Fork and Module"] || validatedRow.expectedResult || validatedRow.actualResult)) {
                    const errorMsg = !dateReportedStr 
                        ? `Row has data but missing valid 'Date Reported' - got: "${dateReportedStr}"`
                        : `Invalid date format: "${dateReportedStr}" (expected: MM/DD/YYYY or YYYY-MM-DD)`;
                    
                    errors.push({
                        row: i + 1,
                        reason: errorMsg,
                    });
                    skipped++;
                    continue;
                } else if (!dateReported) {
                    // Row is empty or has minimal data - silently skip
                    skipped++;
                    continue;
                }

                const finalDateReported = dateReported;

                const testCaseId = extractColumnValue(
                    validatedRow,
                    [
                        "Test Case ID",
                        "test case id",
                        "testCaseId",
                        "test_case_id",
                    ]
                );

                const module = extractColumnValue(
                    validatedRow,
                    [
                        "Fork and Module",
                        "Module / Component",
                        "module",
                        "Module",
                        "Component",
                    ]
                );

                if (module && module.trim().length > 0) {
                    modulesSet.add(module.trim());
                }

                // Use "Unknown" if module is missing
                const finalModule = module || "Unknown";

                const summary = extractColumnValue(
                    validatedRow,
                    [
                        "Summary / Title",
                        "Summary",
                        "Title",
                        "summary",
                        "title",
                    ]
                );

                const expectedResult = extractColumnValue(
                    validatedRow,
                    [
                        "Expected Result",
                        "expected result",
                        "expectedResult",
                        "expected_result",
                    ]
                );

                const actualResult = extractColumnValue(
                    validatedRow,
                    [
                        "Actual Result",
                        "actual result",
                        "actualResult",
                        "actual_result",
                    ]
                );

                const severityStr = extractColumnValue(
                    validatedRow,
                    ["Severity", "severity"]
                );

                // Map custom severity values to standard enums
                let severity: Severity;
                if (severityStr) {
                    const lowerSeverity = severityStr.toLowerCase().trim();
                    if (lowerSeverity === "major" || lowerSeverity === "critical") {
                        severity = SeverityEnum.MAJOR;
                    } else if (lowerSeverity === "high") {
                        severity = SeverityEnum.HIGH;
                    } else if (lowerSeverity === "medium") {
                        severity = SeverityEnum.MEDIUM;
                    } else if (lowerSeverity === "low") {
                        severity = SeverityEnum.LOW;
                    } else {
                        severity = (normalizeEnumValue(severityStr, Object.values(SeverityEnum)) as Severity) || SeverityEnum.MEDIUM;
                    }
                } else {
                    severity = SeverityEnum.MEDIUM; // Default to MEDIUM
                }

                const priority = extractColumnValue(
                    validatedRow,
                    ["Priority", "priority"]
                ) || "Medium";

                const statusStr = extractColumnValue(
                    validatedRow,
                    ["Status", "status"]
                );

                // Map custom status values to standard enums
                let status: Status;
                if (statusStr) {
                    const lowerStatus = statusStr.toLowerCase().trim();
                    if (lowerStatus.includes("fix") || lowerStatus.includes("closed")) {
                        status = StatusEnum.CLOSED;
                    } else if (lowerStatus.includes("progress") || lowerStatus.includes("in progress")) {
                        status = StatusEnum.IN_PROGRESS;
                    } else if (lowerStatus === "as it is") {
                        status = StatusEnum.AS_IT_IS;
                    } else if (lowerStatus.includes("hold") || lowerStatus === "pending") {
                        status = StatusEnum.ON_HOLD;
                    } else {
                        const normalized = normalizeEnumValue(statusStr, Object.values(StatusEnum));
                        status = (normalized as Status) || StatusEnum.OPEN;
                    }
                } else {
                    status = StatusEnum.OPEN; // Default to OPEN if no status provided
                }

                const dateFixedStr = extractColumnValue(
                    validatedRow,
                    [
                        "Date Fixed ",
                        "Date Fixed",
                        "date fixed",
                        "dateFixed",
                        "date_fixed",
                    ]
                );
                const dateFixed = dateFixedStr ? parseCSVDate(dateFixedStr) : null;

                // QC Status by BBT removed from parsing; use DB default value
                const qcStatusBbt = 'PENDING';

                // Final validation with Zod schema
                const defectData = {
                    dateReported: finalDateReported,
                    module: finalModule,
                    expectedResult: expectedResult || "N/A",
                    actualResult: actualResult || "N/A",
                    severity,
                    priority,
                    status,
                    dateFixed,
                };

                CreateDefectSchema.parse(defectData);

                // Check for true duplicate based on date, module, expected result, and actual result
                const duplicateCheck = await db.query(
                    `SELECT id, "testCaseId" FROM defect WHERE 
                     "dateReported" = $1 AND 
                     module = $2 AND 
                     "expectedResult" = $3 AND 
                     "actualResult" = $4 
                     LIMIT 1`,
                    [finalDateReported === "N/A" ? null : finalDateReported, finalModule, expectedResult || "N/A", actualResult || "N/A"]
                );

                if (duplicateCheck.rows.length > 0) {
                    // Skip true duplicate and log it
                    const existingTestCaseId = duplicateCheck.rows[0].testCaseId;
                    errors.push({
                        row: i + 1,
                        reason: `Duplicate defect (Test Case ID: ${testCaseId || 'N/A'} matches existing defect: ${existingTestCaseId || 'Unknown'})`,
                    });
                    skipped++;
                    continue;
                }

                // Insert into database using raw SQL
                const id = randomUUID();
                const now = new Date();

                await db.query(
                    `INSERT INTO defect (id, "testCaseId", "dateReported", module, summary, "expectedResult", "actualResult", severity, priority, status, "dateFixed", "qcStatusBbt", "createdAt")
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
                    [
                        id,
                        testCaseId || null,
                        finalDateReported === "N/A" ? null : finalDateReported,
                        finalModule,
                        summary || null,
                        expectedResult || "N/A",
                        actualResult || "N/A",
                        severity,
                        priority,
                        status,
                        dateFixed,
                        qcStatusBbt,
                        now,
                    ]
                );

                inserted++;
            } catch (error) {
                let reason = "Unknown error";
                if (error instanceof ZodError) {
                    // Get detailed field errors
                    const fieldErrors = error.issues.map((e: any) => {
                        const path = e.path.join(".");
                        return `${path}: ${e.message}`;
                    }).join("; ");
                    reason = fieldErrors || "Validation failed";
                } else if (error instanceof Error) {
                    reason = error.message;
                }
                
                // Only report errors for rows that actually have data
                if (values.some(v => v && v.trim().length > 0)) {
                    console.error(`Row ${i + 1} validation error:`, reason);
                    console.error(`Row data:`, values);
                    errors.push({
                        row: i + 1,
                        reason,
                    });
                }
                skipped++;
            }
        }

        return {
            success: true,
            message: `CSV upload completed. Inserted: ${inserted}, Skipped: ${skipped}`,
            inserted,
            skipped,
            errors: errors, // Return ALL errors, not just first 10
            modules: Array.from(modulesSet).sort(),
            debug: {
                csvHeaders: headers,
            },
        };
    } catch (error) {
        return {
            success: false,
            message: `Failed to process CSV: ${error instanceof Error ? error.message : "Unknown error"}`,
            inserted: 0,
            skipped: 0,
            errors: [],
        };
    }
}

function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
            if (insideQuotes && nextChar === '"') {
                current += '"';
                i++; // Skip the next quote
            } else {
                insideQuotes = !insideQuotes;
            }
        } else if (char === "," && !insideQuotes) {
            result.push(current.trim());
            current = "";
        } else {
            current += char;
        }
    }

    result.push(current.trim());
    return result;
}

function parseCSVContent(content: string): string[][] {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = "";
    let insideQuotes = false;

    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        const nextChar = content[i + 1];

        if (char === '"') {
            if (insideQuotes && nextChar === '"') {
                // Escaped quote
                currentCell += '"';
                i++; // Skip next quote
            } else {
                // Toggle quote mode
                insideQuotes = !insideQuotes;
            }
        } else if (char === "," && !insideQuotes) {
            // End of cell
            currentRow.push(currentCell.trim());
            currentCell = "";
        } else if ((char === "\n" || char === "\r") && !insideQuotes) {
            // End of row
            if (currentCell || currentRow.length > 0) {
                currentRow.push(currentCell.trim());
                if (currentRow.some(cell => cell.length > 0)) {
                    rows.push(currentRow);
                }
                currentRow = [];
                currentCell = "";
            }
            // Skip \r\n sequence
            if (char === "\r" && nextChar === "\n") {
                i++;
            }
        } else {
            currentCell += char;
        }
    }

    // Add last cell and row
    if (currentCell || currentRow.length > 0) {
        currentRow.push(currentCell.trim());
        if (currentRow.some(cell => cell.length > 0)) {
            rows.push(currentRow);
        }
    }

    return rows;
}
