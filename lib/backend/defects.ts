import { randomUUID } from "crypto";
import { db } from "@/lib/prisma";
import { QCStatusBBT, Severity, Status } from "@/lib/types";

export interface DefectListFilters {
  dateFrom?: string;
  dateTo?: string;
  module?: string[];
  severity?: Severity[];
  status?: Status[];
  search?: string;
}

export interface DefectPagination {
  page: number;
  pageSize: number;
  sortBy?: "date" | "severity" | "status";
  sortOrder?: "asc" | "desc";
}

export interface CreateDefectPayload {
  testCaseId?: string | null;
  dateReported: string;
  module: string;
  summary?: string | null;
  expectedResult: string;
  actualResult: string;
  severity: Severity;
  priority: string;
  assignedTo?: string | null;
  status: Status;
  dateFixed?: string | null;
  qcStatusBbt?: QCStatusBBT;
  sourceFile?: string | null;
}

interface WhereClause {
  clause: string;
  values: unknown[];
}

function buildWhereClause(filters?: DefectListFilters): WhereClause {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let index = 1;

  if (filters?.dateFrom) {
    conditions.push(`"dateReported" >= $${index}`);
    values.push(filters.dateFrom);
    index += 1;
  }

  if (filters?.dateTo) {
    conditions.push(`"dateReported" <= $${index}`);
    values.push(filters.dateTo);
    index += 1;
  }

  if (filters?.severity?.length) {
    const placeholders = filters.severity.map(() => `$${index++}`).join(", ");
    conditions.push(`severity IN (${placeholders})`);
    values.push(...filters.severity);
  }

  if (filters?.status?.length) {
    const placeholders = filters.status.map(() => `$${index++}`).join(", ");
    conditions.push(`status IN (${placeholders})`);
    values.push(...filters.status);
  }

  if (filters?.module?.length) {
    const placeholders = filters.module.map(() => `$${index++}`).join(", ");
    conditions.push(`module IN (${placeholders})`);
    values.push(...filters.module);
  }

  if (filters?.search?.trim()) {
    const likeValue = `%${filters.search.trim()}%`;
    conditions.push(`(
      module ILIKE $${index}
      OR COALESCE(summary, '') ILIKE $${index}
      OR "expectedResult" ILIKE $${index}
      OR "actualResult" ILIKE $${index}
      OR COALESCE("testCaseId", '') ILIKE $${index}
    )`);
    values.push(likeValue);
  }

  return {
    clause: conditions.join(" AND "),
    values,
  };
}

function getOrderBy(sortBy?: DefectPagination["sortBy"], sortOrder: DefectPagination["sortOrder"] = "desc"): string {
  const order = sortOrder === "asc" ? "ASC" : "DESC";

  if (sortBy === "severity") {
    return `severity ${order}`;
  }

  if (sortBy === "status") {
    return `status ${order}`;
  }

  return `"dateReported" ${order}`;
}

export async function getDefectsForApi(filters: DefectListFilters, pagination: DefectPagination) {
  const where = buildWhereClause(filters);
  const whereSQL = where.clause ? `WHERE ${where.clause}` : "";
  const orderBy = getOrderBy(pagination.sortBy, pagination.sortOrder);

  const offset = Math.max(0, (pagination.page - 1) * pagination.pageSize);
  const limitParam = where.values.length + 1;
  const offsetParam = where.values.length + 2;

  const [rowsResult, countResult] = await Promise.all([
    db.query(
      `SELECT *
       FROM defect
       ${whereSQL}
       ORDER BY ${orderBy}
       LIMIT $${limitParam} OFFSET $${offsetParam}`,
      [...where.values, pagination.pageSize, offset]
    ),
    db.query<{ total: string }>(
      `SELECT COUNT(*)::text as total
       FROM defect
       ${whereSQL}`,
      where.values
    ),
  ]);

  const total = parseInt(countResult.rows[0]?.total || "0", 10);

  return {
    defects: rowsResult.rows,
    page: pagination.page,
    pageSize: pagination.pageSize,
    total,
    totalPages: Math.ceil(total / pagination.pageSize),
  };
}

export async function getDefectMetricsForApi(filters: DefectListFilters) {
  const where = buildWhereClause(filters);

  const buildCountQuery = (extra?: string) => {
    const parts: string[] = [];
    if (where.clause) {
      parts.push(where.clause);
    }
    if (extra) {
      parts.push(extra);
    }

    const whereSQL = parts.length ? `WHERE ${parts.join(" AND ")}` : "";
    return `SELECT COUNT(*)::text as count FROM defect ${whereSQL}`;
  };

  const base = where.values;
  const start = base.length;

  const [total, open, closed, major] = await Promise.all([
    db.query<{ count: string }>(buildCountQuery(), base),
    db.query<{ count: string }>(
      buildCountQuery(`status IN ($${start + 1}, $${start + 2}, $${start + 3})`),
      [...base, "OPEN", "IN_PROGRESS", "ON_HOLD"]
    ),
    db.query<{ count: string }>(
      buildCountQuery(`status IN ($${start + 1}, $${start + 2})`),
      [...base, "CLOSED", "AS_IT_IS"]
    ),
    db.query<{ count: string }>(buildCountQuery(`severity = $${start + 1}`), [...base, "MAJOR"]),
  ]);

  return {
    totalDefects: parseInt(total.rows[0]?.count || "0", 10),
    openDefects: parseInt(open.rows[0]?.count || "0", 10),
    closedDefects: parseInt(closed.rows[0]?.count || "0", 10),
    highSeverityCount: parseInt(major.rows[0]?.count || "0", 10),
  };
}

export async function createDefectForApi(payload: CreateDefectPayload) {
  const id = randomUUID();

  const result = await db.query(
    `INSERT INTO defect (
      id,
      "testCaseId",
      "dateReported",
      module,
      summary,
      "expectedResult",
      "actualResult",
      severity,
      priority,
      "assignedTo",
      status,
      "dateFixed",
      "qcStatusBbt",
      "sourceFile"
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
    )
    RETURNING *`,
    [
      id,
      payload.testCaseId ?? null,
      payload.dateReported,
      payload.module,
      payload.summary ?? null,
      payload.expectedResult,
      payload.actualResult,
      payload.severity,
      payload.priority,
      payload.assignedTo ?? null,
      payload.status,
      payload.dateFixed ?? null,
      payload.qcStatusBbt ?? "PENDING",
      payload.sourceFile ?? null,
    ]
  );

  return result.rows[0];
}
