"use server";

import { db } from "@/lib/prisma";
import { Defect, Severity, Status, DefectFilters, PaginationParams, StatusEnum, SeverityEnum } from "@/lib/types";

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
            // openDefects should count only Pending (ON_HOLD)
            db.query<{ count: string }>(buildCountQuery(`status = $${paramOffset + 1}`), [...baseParams, StatusEnum.ON_HOLD]),
            // closedDefects should include Fixed (CLOSED) and As it is (AS_IT_IS)
            db.query<{ count: string }>(
                buildCountQuery(`status IN ($${paramOffset + 1}, $${paramOffset + 2})`),
                [...baseParams, StatusEnum.CLOSED, StatusEnum.AS_IT_IS]
            ),
            db.query<{ count: string }>(buildCountQuery(`severity = $${paramOffset + 1}`), [...baseParams, SeverityEnum.CRITICAL]),
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
        return result.rows.map((row: { module: string; count: string }) => ({
            module: row.module,
            count: parseInt(row.count, 10),
        }));
    } catch (error) {
        console.error("Error fetching defects by module:", error);
        throw error;
    }
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

interface WhereClause {
    clause: string;
    values: any[];
}

function buildWhereClause(filters?: DefectFilters): WhereClause {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (filters?.dateFrom || filters?.dateTo) {
        if (filters.dateFrom) {
            conditions.push(`"dateReported" >= $${paramCount}`);
            values.push(filters.dateFrom);
            paramCount++;
        }
        if (filters.dateTo) {
            conditions.push(`"dateReported" <= $${paramCount}`);
            values.push(filters.dateTo);
            paramCount++;
        }
    }

    if (filters?.severity && filters.severity.length > 0) {
        const placeholders = filters.severity.map(() => `$${paramCount++}`).join(", ");
        conditions.push(`severity IN (${placeholders})`);
        values.push(...filters.severity);
    }

    if (filters?.module && filters.module.length > 0) {
        const placeholders = filters.module.map(() => `$${paramCount++}`).join(", ");
        conditions.push(`module IN (${placeholders})`);
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
