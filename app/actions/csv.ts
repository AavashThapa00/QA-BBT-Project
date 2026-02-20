"use server";

import { db } from "@/lib/prisma";
import { CreateDefectSchema, CSVRowSchema } from "@/lib/validators";
import { parseCSVDate, normalizeEnumValue, extractColumnValue } from "@/lib/utils";
import { Severity, Status, QCStatusBBT, SeverityEnum, StatusEnum, QCStatusBBTEnum } from "@/lib/types";
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
}

export async function uploadCSV(csvData: string): Promise<UploadResult> {
    const errors: Array<{ row: number; reason: string }> = [];
    let inserted = 0;
    let skipped = 0;

    try {
        // Parse CSV properly handling quoted multiline cells
        const rows = parseCSVContent(csvData);

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

        for (let i = 1; i < rows.length; i++) {
            const values = rows[i];

            // Skip rows where all values are empty
            if (values.every(v => !v || v.trim() === "")) {
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
                const dateReported = parseCSVDate(
                    extractColumnValue(
                        validatedRow,
                        [
                            "Date Reported",
                            "date reported",
                            "dateReported",
                            "date_reported",
                        ]
                    )
                );

                if (!dateReported) {
                    errors.push({
                        row: i + 1,
                        reason: "Invalid or missing date reported",
                    });
                    skipped++;
                    continue;
                }

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

                if (!module) {
                    errors.push({
                        row: i + 1,
                        reason: "Missing module/component",
                    });
                    skipped++;
                    continue;
                }

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
                let severity: Severity | null = null;
                if (severityStr) {
                    const lowerSeverity = severityStr.toLowerCase().trim();
                    if (lowerSeverity === "major" || lowerSeverity === "critical") {
                        severity = SeverityEnum.CRITICAL;
                    } else if (lowerSeverity === "high") {
                        severity = SeverityEnum.HIGH;
                    } else if (lowerSeverity === "medium") {
                        severity = SeverityEnum.MEDIUM;
                    } else if (lowerSeverity === "low") {
                        severity = SeverityEnum.LOW;
                    } else {
                        severity = normalizeEnumValue(severityStr, Object.values(SeverityEnum)) as Severity | null;
                    }
                }

                if (!severity) {
                    errors.push({
                        row: i + 1,
                        reason: `Invalid severity: ${severityStr}`,
                    });
                    skipped++;
                    continue;
                }

                const priority = extractColumnValue(
                    validatedRow,
                    ["Priority", "priority"]
                );

                if (!priority) {
                    errors.push({
                        row: i + 1,
                        reason: "Missing priority",
                    });
                    skipped++;
                    continue;
                }

                const statusStr = extractColumnValue(
                    validatedRow,
                    ["Status", "status"]
                );

                // Map custom status values to standard enums
                let status: Status | null = null;
                if (statusStr) {
                    const lowerStatus = statusStr.toLowerCase().trim();
                    if (lowerStatus.includes("fix") || lowerStatus.includes("closed")) {
                        status = StatusEnum.CLOSED;
                    } else if (lowerStatus.includes("progress") || lowerStatus.includes("in progress")) {
                        status = StatusEnum.IN_PROGRESS;
                    } else if (lowerStatus.includes("hold") || lowerStatus === "as it is") {
                        status = StatusEnum.ON_HOLD;
                    } else {
                        const normalized = normalizeEnumValue(statusStr, Object.values(StatusEnum));
                        status = normalized as Status | null;
                    }
                } else {
                    status = StatusEnum.OPEN; // Default to OPEN if no status provided
                }

                if (!status) {
                    errors.push({
                        row: i + 1,
                        reason: `Invalid status: ${statusStr}`,
                    });
                    skipped++;
                    continue;
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

                const qcStatusStr = extractColumnValue(
                    validatedRow,
                    [
                        "QC Status by BBT",
                        "qc status by bbt",
                        "qcStatusBBT",
                        "qc_status_bbt",
                    ]
                );

                // Map TRUE/FALSE to QC status
                let qcStatusBbt: QCStatusBBT | null = null;
                if (qcStatusStr) {
                    const lowerQC = qcStatusStr.toLowerCase().trim();
                    if (lowerQC === "true") {
                        qcStatusBbt = QCStatusBBTEnum.PASSED;
                    } else if (lowerQC === "false") {
                        qcStatusBbt = QCStatusBBTEnum.FAILED;
                    } else {
                        qcStatusBbt = normalizeEnumValue(qcStatusStr, Object.values(QCStatusBBTEnum)) as QCStatusBBT | null;
                    }
                }

                if (!qcStatusBbt) {
                    errors.push({
                        row: i + 1,
                        reason: `Invalid QC status: ${qcStatusStr}`,
                    });
                    skipped++;
                    continue;
                }

                // Final validation with Zod schema
                const defectData = {
                    dateReported,
                    module,
                    expectedResult,
                    actualResult,
                    severity: severity as Severity,
                    priority,
                    status: status as Status,
                    dateFixed,
                    qcStatusBbt: qcStatusBbt as QCStatusBBT,
                };

                CreateDefectSchema.parse(defectData);

                // Insert into database using raw SQL
                const id = randomUUID();
                const now = new Date();

                await db.query(
                    `INSERT INTO defect (id, "dateReported", module, "expectedResult", "actualResult", severity, priority, status, "dateFixed", "qcStatusBbt", "createdAt")
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                    [
                        id,
                        dateReported,
                        module,
                        expectedResult || "",
                        actualResult || "",
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
                    reason = error.issues.map((e: any) => e.message).join(", ");
                } else if (error instanceof Error) {
                    reason = error.message;
                }
                errors.push({
                    row: i + 1,
                    reason,
                });
                skipped++;
            }
        }

        return {
            success: true,
            message: `CSV upload completed. Inserted: ${inserted}, Skipped: ${skipped}`,
            inserted,
            skipped,
            errors: errors.slice(0, 10), // Return only first 10 errors
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
