"use server";

import { randomUUID } from "crypto";
import { db } from "@/lib/prisma";
import {
    Defect,
    Severity,
    Status,
    QCStatusBBT,
    DefectFilters,
    PaginationParams,
    StatusEnum,
    SeverityEnum,
    QCStatusBBTEnum,
} from "@/lib/types";

export async function getDefectMetrics(filters?: DefectFilters): Promise<{
    totalDefects: number;
    openDefects: number;
    closedDefects: number;
    highSeverityCount: number;
}> {
    const whereClause = buildWhereClause(filters);

    const buildCountQuery = (additionalCondition?: string): string => {
        const conditions: string[] = [];
        if (whereClause.clause) {
            conditions.push(whereClause.clause);
        }
        if (additionalCondition) {
            conditions.push(additionalCondition);
        }
        const whereSQL = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
        return `SELECT COUNT(*) as count FROM defect ${whereSQL}`;
    };

    try {
        const baseParams = whereClause.values;
        const paramOffset = baseParams.length;

        const [totalResult, openResult, closedResult, highSeverityResult] = await Promise.all([
            db.query<{ count: string }>(buildCountQuery(), baseParams),
            // openDefects should count OPEN, IN_PROGRESS, and ON_HOLD (Pending)
            db.query<{ count: string }>(
                buildCountQuery(`status IN ($${paramOffset + 1}, $${paramOffset + 2}, $${paramOffset + 3})`),
                [...baseParams, StatusEnum.OPEN, StatusEnum.IN_PROGRESS, StatusEnum.ON_HOLD]
            ),
            // closedDefects should include Fixed (CLOSED) and As it is (AS_IT_IS)
            db.query<{ count: string }>(
                buildCountQuery(`status IN ($${paramOffset + 1}, $${paramOffset + 2})`),
                [...baseParams, StatusEnum.CLOSED, StatusEnum.AS_IT_IS]
            ),
            db.query<{ count: string }>(buildCountQuery(`severity = $${paramOffset + 1}`), [...baseParams, SeverityEnum.MAJOR]),
        ]);

        return {
            totalDefects: parseInt(totalResult.rows[0]?.count || "0", 10),
            openDefects: parseInt(openResult.rows[0]?.count || "0", 10),
            closedDefects: parseInt(closedResult.rows[0]?.count || "0", 10),
            highSeverityCount: parseInt(highSeverityResult.rows[0]?.count || "0", 10),
        };
    } catch (error) {
        console.error("Error fetching defect metrics:", error);
        throw error;
    }
}

export async function getDefectsByModule(filters?: DefectFilters): Promise<
    Array<{
        module: string;
        count: number;
    }>
> {
    const whereClause = buildWhereClause(filters);
    const sqlWhere = whereClause.clause ? `WHERE ${whereClause.clause}` : "";

    const query = `
        SELECT module, COUNT(*) as count
        FROM defect
        ${sqlWhere}
        GROUP BY module
        ORDER BY count DESC
    `;

    try {
        const result = await db.query<{ module: string; count: string }>(query, whereClause.values);
        
        // Extract main module prefix and group by it
        const moduleMap: Record<string, number> = {};
        
        result.rows.forEach((row: { module: string; count: string }) => {
            const count = parseInt(row.count, 10);
            const mainModule = extractMainModuleFromName(row.module);
            moduleMap[mainModule] = (moduleMap[mainModule] || 0) + count;
        });
        
        // Convert to array and sort by count
        return Object.entries(moduleMap)
            .map(([module, count]) => ({ module, count }))
            .sort((a, b) => b.count - a.count);
    } catch (error) {
        console.error("Error fetching defects by module:", error);
        throw error;
    }
}

function extractMainModuleFromName(moduleName: string): string {
    if (!moduleName) return "Unknown";
    
    // Try to extract known module prefixes
    const lowerName = moduleName.toLowerCase();
    
    if (lowerName.includes("hsa")) return "HSA";
    if (lowerName.includes("kfq")) return "KFQ";
    if (lowerName.includes("gmst")) return "GMST";
    if (lowerName.includes("nmst")) return "NMST";
    if (lowerName.includes("mst")) return "GMST";
    if (lowerName.includes("alston") || lowerName.includes("innovatetech")) return "Innovatetech";
    
    // If no known prefix, use the first word before "−" or space
    const match = moduleName.match(/^([A-Z0-9]+)/);
    return match ? match[1] : moduleName.substring(0, 20);
}

export async function getDefectsBySeverity(filters?: DefectFilters): Promise<
    Array<{
        severity: Severity;
        count: number;
    }>
> {
    const whereClause = buildWhereClause(filters);
    const sqlWhere = whereClause.clause ? `WHERE ${whereClause.clause}` : "";

    const query = `
        SELECT severity, COUNT(*) as count
        FROM defect
        ${sqlWhere}
        GROUP BY severity
        ORDER BY count DESC
    `;

    try {
        const result = await db.query<{ severity: Severity; count: string }>(query, whereClause.values);
        return result.rows.map((row: { severity: Severity; count: string }) => ({
            severity: row.severity,
            count: parseInt(row.count, 10),
        }));
    } catch (error) {
        console.error("Error fetching defects by severity:", error);
        throw error;
    }
}

export async function getDefectsTrend(
    filters?: DefectFilters,
    groupBy: "day" | "month" = "day"
): Promise<
    Array<{
        date: string;
        count: number;
    }>
> {
    const whereClause = buildWhereClause(filters);
    const conditions: string[] = [];
    if (whereClause.clause) {
        conditions.push(whereClause.clause);
    }
    conditions.push('"dateReported" IS NOT NULL');
    const sqlWhere = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const dateFormat = groupBy === "month" ? "YYYY-MM" : "YYYY-MM-DD";
    const query = `
        SELECT TO_CHAR("dateReported", '${dateFormat}') as date, COUNT(*) as count
        FROM defect
        ${sqlWhere}
        GROUP BY TO_CHAR("dateReported", '${dateFormat}')
        ORDER BY date ASC
    `;

    try {
        const result = await db.query<{ date: string; count: string }>(query, whereClause.values);
        return result.rows.map((row: { date: string; count: string }) => ({
            date: row.date,
            count: parseInt(row.count, 10),
        }));
    } catch (error) {
        console.error("Error fetching defects trend:", error);
        throw error;
    }
}

export async function getDefects(
    filters?: DefectFilters,
    pagination?: PaginationParams
): Promise<{
    defects: Defect[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}> {
    const whereClause = buildWhereClause(filters);
    const pageSize = pagination?.pageSize || 10;
    const page = Math.max(0, (pagination?.page || 1) - 1);
    const offset = page * pageSize;

    let orderBy = `"dateReported" DESC`;
    if (pagination?.sortBy === "severity") {
        orderBy = `severity ${pagination?.sortOrder || "asc"}`;
    } else if (pagination?.sortBy === "status") {
        orderBy = `status ${pagination?.sortOrder || "asc"}`;
    } else if (pagination?.sortBy === "date") {
        orderBy = `"dateReported" ${(pagination?.sortOrder as "asc" | "desc") || "desc"}`;
    }

    const sqlWhere = whereClause.clause ? `WHERE ${whereClause.clause}` : "";

    const [defectsResult, countResult] = await Promise.all([
        db.query<Defect>(
            `SELECT * FROM defect ${sqlWhere} ORDER BY ${orderBy} LIMIT $${whereClause.values.length + 1} OFFSET $${whereClause.values.length + 2}`,
            [...whereClause.values, pageSize, offset]
        ),
        db.query<{ total: string }>(
            `SELECT COUNT(*) as total FROM defect ${sqlWhere}`,
            whereClause.values
        ),
    ]);

    const total = parseInt(countResult.rows[0]?.total || "0", 10);

    return {
        defects: defectsResult.rows,
        total,
        page: page + 1,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}

export async function getAverageResolutionTime(filters?: DefectFilters): Promise<number> {
    const whereClause = buildWhereClause({
        ...filters,
        status: [StatusEnum.CLOSED],
    });

    const sqlWhere = whereClause.clause ? `WHERE ${whereClause.clause} AND "dateFixed" IS NOT NULL` : `WHERE "dateFixed" IS NOT NULL`;

    const query = `
        SELECT 
            ("dateFixed" - "dateReported")::INTEGER as resolution_days
        FROM defect
        ${sqlWhere}
    `;

    try {
        const result = await db.query<{ resolution_days: number }>(query, whereClause.values);

        if (result.rows.length === 0) return 0;

        const totalDays = result.rows.reduce((sum: number, row: { resolution_days: number }) => sum + (row.resolution_days || 0), 0);
        return Math.round(totalDays / result.rows.length);
    } catch (error) {
        console.error("Error fetching average resolution time:", error);
        throw error;
    }
}

export async function exportAllDefects(filters?: DefectFilters): Promise<Defect[]> {
    const whereClause = buildWhereClause(filters);
    const sqlWhere = whereClause.clause ? `WHERE ${whereClause.clause}` : "";

    const query = `
        SELECT * FROM defect
        ${sqlWhere}
        ORDER BY "dateReported" DESC
    `;

    try {
        const result = await db.query<Defect>(query, whereClause.values);
        return result.rows;
    } catch (error) {
        console.error("Error exporting all defects:", error);
        throw error;
    }
}

interface WhereClause {
    clause: string;
    values: any[];
}

// Helper function to convert Date to YYYY-MM-DD string
function formatDateForSQL(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function buildWhereClause(filters?: DefectFilters): WhereClause {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (filters?.dateFrom || filters?.dateTo) {
        if (filters.dateFrom) {
            conditions.push(`"dateReported" >= $${paramCount}`);
            values.push(formatDateForSQL(filters.dateFrom));
            paramCount++;
        }
        if (filters.dateTo) {
            conditions.push(`"dateReported" <= $${paramCount}`);
            values.push(formatDateForSQL(filters.dateTo));
            paramCount++;
        }
    }

    if (filters?.severity && filters.severity.length > 0) {
        const placeholders = filters.severity.map(() => `$${paramCount++}`).join(", ");
        conditions.push(`severity IN (${placeholders})`);
        values.push(...filters.severity);
    }

    if (filters?.module && filters.module.length > 0) {
        // Use LIKE to match modules that start with the filter value
        // e.g., "HSA" matches "HSA- Mock Exam", "HSA-Mock Exams", etc.
        const conditions_module = filters.module.map(() => `module ILIKE $${paramCount++} || '%'`).join(" OR ");
        conditions.push(`(${conditions_module})`);
        values.push(...filters.module);
    }

    if (filters?.status && filters.status.length > 0) {
        const placeholders = filters.status.map(() => `$${paramCount++}`).join(", ");
        conditions.push(`status IN (${placeholders})`);
        values.push(...filters.status);
    }

    if (filters?.searchTerm) {
        conditions.push(
            `(module ILIKE $${paramCount} OR "expectedResult" ILIKE $${paramCount} OR "actualResult" ILIKE $${paramCount})`
        );
        const searchTerm = `%${filters.searchTerm}%`;
        values.push(searchTerm);
        paramCount++;
    }

    return {
        clause: conditions.length > 0 ? conditions.join(" AND ") : "",
        values,
    };
}

export interface ManualDefectInput {
    testCaseId?: string;
    module: string;
    descriptionSteps?: string;
    summary?: string;
    expectedResult: string;
    actualResult: string;
    remarks?: string;
    testType?: "smoke" | "cycle";
    testScenario?: string;
    testSteps?: string;
    priority: string;
    severity: Severity;
    status: Status;
    qcStatusBbt: QCStatusBBT;
    issueTestDate: string;
    fixedDate?: string;
    sheetType?: string;
}

export interface ManualDefectUpdateInput {
    issueTestDate?: string;
    fixedDate?: string | null;
    priority?: string;
    severity?: Severity;
    status?: Status;
    qcStatusBbt?: QCStatusBBT;
}

function parseDateInput(dateValue: string): Date {
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) {
        throw new Error(`Invalid date value: ${dateValue}`);
    }
    return parsed;
}

function isValidSeverity(value: string): value is Severity {
    return Object.values(SeverityEnum).includes(value as Severity);
}

function isValidStatus(value: string): value is Status {
    return Object.values(StatusEnum).includes(value as Status);
}

function isValidQcStatus(value: string): value is QCStatusBBT {
    return Object.values(QCStatusBBTEnum).includes(value as QCStatusBBT);
}

export async function getManualDefects(limit = 200): Promise<Defect[]> {
    const safeLimit = Math.max(1, Math.min(limit, 1000));
    const query = `
        SELECT * FROM defect
        ORDER BY "dateReported" DESC NULLS LAST, "createdAt" DESC
        LIMIT $1
    `;
    const result = await db.query<Defect>(query, [safeLimit]);
    return result.rows;
}

export async function createManualDefect(input: ManualDefectInput): Promise<{ success: boolean; message: string; id?: string }> {
    const module = input.module?.trim();
    const expectedResult = input.expectedResult?.trim();
    const actualResult = input.actualResult?.trim();
    const priority = input.priority?.trim();

    if (!module) return { success: false, message: "Module is required" };
    if (!expectedResult) return { success: false, message: "Expected Result is required" };
    if (!actualResult) return { success: false, message: "Actual Result is required" };
    if (!priority) return { success: false, message: "Priority is required" };
    if (!input.issueTestDate) return { success: false, message: "Issue Test Date is required" };
    if (!isValidSeverity(input.severity)) return { success: false, message: "Invalid severity" };
    if (!isValidStatus(input.status)) return { success: false, message: "Invalid status" };
    if (!isValidQcStatus(input.qcStatusBbt)) return { success: false, message: "Invalid QC status" };
    if ((input.testType || "smoke") === "cycle" && !input.testScenario?.trim()) {
        return { success: false, message: "Test scenario is required for cycle test" };
    }
    if ((input.testType || "smoke") === "cycle" && !input.testSteps?.trim()) {
        return { success: false, message: "Test steps are required for cycle test" };
    }

    try {
        const id = randomUUID();
        const issueTestDate = parseDateInput(input.issueTestDate);
        const fixedDate = input.fixedDate ? parseDateInput(input.fixedDate) : null;

        await db.query(
            `INSERT INTO defect (
                id,
                "testCaseId",
                "dateReported",
                module,
                "descriptionSteps",
                summary,
                "expectedResult",
                "actualResult",
                remarks,
                "testType",
                "testScenario",
                "testSteps",
                severity,
                priority,
                status,
                "dateFixed",
                "qcStatusBbt",
                "sourceFile"
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
            [
                id,
                input.testCaseId?.trim() || null,
                issueTestDate,
                module,
                input.descriptionSteps?.trim() || null,
                input.summary?.trim() || null,
                expectedResult,
                actualResult,
                input.remarks?.trim() || null,
                input.testType || "smoke",
                input.testScenario?.trim() || null,
                input.testSteps?.trim() || null,
                input.severity,
                priority,
                input.status,
                fixedDate,
                input.qcStatusBbt,
                input.sheetType || "Smoke Testing Sheet",
            ]
        );

        return { success: true, message: "Issue added successfully", id };
    } catch (error) {
        console.error("Error creating manual defect:", error);
        return { success: false, message: "Failed to add issue" };
    }
}

export async function updateManualDefect(id: string, updates: ManualDefectUpdateInput): Promise<{ success: boolean; message: string }> {
    if (!id) {
        return { success: false, message: "Defect ID is required" };
    }

    const setClauses: string[] = [];
    const values: any[] = [];
    let param = 1;

    if (updates.issueTestDate !== undefined) {
        const parsed = parseDateInput(updates.issueTestDate);
        setClauses.push(`"dateReported" = $${param++}`);
        values.push(parsed);
    }

    if (updates.fixedDate !== undefined) {
        if (updates.fixedDate === null || updates.fixedDate === "") {
            setClauses.push(`"dateFixed" = NULL`);
        } else {
            const parsed = parseDateInput(updates.fixedDate);
            setClauses.push(`"dateFixed" = $${param++}`);
            values.push(parsed);
        }
    }

    if (updates.priority !== undefined) {
        const priority = updates.priority.trim();
        if (!priority) {
            return { success: false, message: "Priority cannot be empty" };
        }
        setClauses.push(`priority = $${param++}`);
        values.push(priority);
    }

    if (updates.severity !== undefined) {
        if (!isValidSeverity(updates.severity)) {
            return { success: false, message: "Invalid severity" };
        }
        setClauses.push(`severity = $${param++}`);
        values.push(updates.severity);
    }

    if (updates.status !== undefined) {
        if (!isValidStatus(updates.status)) {
            return { success: false, message: "Invalid status" };
        }
        setClauses.push(`status = $${param++}`);
        values.push(updates.status);
    }

    if (updates.qcStatusBbt !== undefined) {
        if (!isValidQcStatus(updates.qcStatusBbt)) {
            return { success: false, message: "Invalid QC status" };
        }
        setClauses.push(`"qcStatusBbt" = $${param++}`);
        values.push(updates.qcStatusBbt);
    }

    if (setClauses.length === 0) {
        return { success: false, message: "No fields to update" };
    }

    values.push(id);

    try {
        const result = await db.query(
            `UPDATE defect
             SET ${setClauses.join(", ")}
             WHERE id = $${param}`,
            values
        );

        if (!result.rowCount) {
            return { success: false, message: "Issue not found" };
        }

        return { success: true, message: "Issue updated successfully" };
    } catch (error) {
        console.error("Error updating manual defect:", error);
        return { success: false, message: "Failed to update issue" };
    }
}
