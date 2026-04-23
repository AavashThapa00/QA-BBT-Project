"use server";

import { backendJson } from "@/lib/backend/request";
import {
  Defect,
  DefectFilters,
  PaginationParams,
  DashboardMetrics,
  DefectByModule,
  DefectByPriority,
  DefectTrend,
  Severity,
  QCStatusBBT,
  SeverityEnum,
  StatusEnum,
  QCStatusBBTEnum,
  Status,
} from "@/lib/types";
import { normalizeEnumValue } from "@/lib/utils";

interface DefectListResponse {
  defects: Defect[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface TrendRow {
  date: string;
  count: number;
}

const MAX_BACKEND_PAGE_SIZE = 200;

interface ManualDefectInput {
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

interface ManualDefectUpdateInput {
  issueTestDate?: string;
  fixedDate?: string | null;
  priority?: string;
  severity?: Severity;
  status?: Status;
  qcStatusBbt?: QCStatusBBT;
}

function buildQuery(filters?: DefectFilters, pagination?: PaginationParams) {
  const query = new URLSearchParams();

  if (pagination?.page) query.set("page", String(pagination.page));
  if (pagination?.pageSize) {
    query.set("pageSize", String(Math.min(pagination.pageSize, MAX_BACKEND_PAGE_SIZE)));
  }
  if (pagination?.sortBy) query.set("sortBy", pagination.sortBy);
  if (pagination?.sortOrder) query.set("sortOrder", pagination.sortOrder);

  if (filters) {
    if (filters.dateFrom instanceof Date) query.set("dateFrom", filters.dateFrom.toISOString());
    if (filters.dateTo instanceof Date) query.set("dateTo", filters.dateTo.toISOString());
    if (filters.searchTerm) query.set("search", filters.searchTerm);
    if (filters.severity?.length) query.set("severity", filters.severity.join(","));
    if (filters.priority?.length) query.set("priority", filters.priority.join(","));
    if (filters.status?.length) query.set("status", filters.status.join(","));
    if (filters.module?.length) query.set("module", filters.module.join(","));
  }

  return query.toString();
}

async function fetchAllDefects(filters?: DefectFilters) {
  const firstPage = await getDefects(filters, {
    page: 1,
    pageSize: MAX_BACKEND_PAGE_SIZE,
    sortBy: "date",
    sortOrder: "desc",
  });

  if (firstPage.totalPages <= 1) {
    return firstPage.defects;
  }

  const allDefects = [...firstPage.defects];

  for (let page = 2; page <= firstPage.totalPages; page++) {
    const nextPage = await getDefects(filters, {
      page,
      pageSize: MAX_BACKEND_PAGE_SIZE,
      sortBy: "date",
      sortOrder: "desc",
    });
    allDefects.push(...nextPage.defects);
  }

  return allDefects;
}

function normalizeStoredPriority(priority: string): string {
  return (
    normalizeEnumValue(priority, Object.values(SeverityEnum)) || priority.trim()
  );
}

function parseDateInput(dateValue: string): string {
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date value: ${dateValue}`);
  }
  return parsed.toISOString();
}

export async function getDefectMetrics(filters?: DefectFilters): Promise<{
  totalDefects: number;
  openDefects: number;
  closedDefects: number;
  highSeverityCount: number;
}> {
  const defects = await fetchAllDefects(filters);
  const openStatuses = new Set<Status>(["PENDING", "RE_OPENED", "HOLD"]);
  const closedStatuses = new Set<Status>(["FIXED", "AS_IT_IS"]);
  const highSeverities = new Set<Severity>(["MAJOR", "HIGH"]);
  return {
    totalDefects: defects.length,
    openDefects: defects.filter((defect: Defect) => openStatuses.has(defect.status)).length,
    closedDefects: defects.filter((defect: Defect) => closedStatuses.has(defect.status)).length,
    highSeverityCount: defects.filter((defect: Defect) => highSeverities.has(defect.severity)).length,
  };
}

export async function getDefectsByModule(filters?: DefectFilters): Promise<DefectByModule[]> {
  const grouped: Record<string, number> = {};
  const rows = await fetchAllDefects(filters);

  for (const row of rows) {
    const normalized = row.module.toLowerCase();
    let mainModule = row.module;
    if (normalized.includes("hsa")) mainModule = "HSA";
    else if (normalized.includes("kfq")) mainModule = "KFQ";
    else if (normalized.includes("gmst") || normalized.includes("ggmst")) mainModule = "GMST";
    else if (normalized.includes("nmst")) mainModule = "NMST";
    else if (normalized.includes("mst")) mainModule = "GMST";
    else if (normalized.includes("alston") || normalized.includes("innovatetech")) mainModule = "Innovatetech";

    grouped[mainModule] = (grouped[mainModule] || 0) + 1;
  }

  return Object.entries(grouped)
    .map(([module, count]) => ({ module, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getDefectsBySeverity(filters?: DefectFilters): Promise<
  Array<{ severity: Severity; count: number }>
> {
  const rows = await fetchAllDefects(filters);
  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.severity] = (counts[row.severity] || 0) + 1;
  }
  return Object.entries(counts).map(([severity, count]) => ({ severity: severity as Severity, count }));
}

export async function getDefectsByPriority(filters?: DefectFilters): Promise<
  Array<{ priority: string; count: number }>
> {
  const rows = await fetchAllDefects(filters);
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const priority = String(row.priority || "UNKNOWN").trim().toUpperCase() || "UNKNOWN";
    counts[priority] = (counts[priority] || 0) + 1;
  }
  return Object.entries(counts).map(([priority, count]) => ({ priority, count }));
}

export async function getDefectsTrend(
  filters?: DefectFilters,
  groupBy: "day" | "month" = "day",
): Promise<DefectTrend[]> {
  const rows = (await fetchAllDefects(filters)).filter((defect: Defect) => Boolean(defect.dateReported));
  const map = new Map<string, number>();

  for (const defect of rows) {
    const date = defect.dateReported instanceof Date ? defect.dateReported : new Date(defect.dateReported as unknown as string);
    if (Number.isNaN(date.getTime())) continue;
    const key =
      groupBy === "month"
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        : date.toISOString().slice(0, 10);
    map.set(key, (map.get(key) || 0) + 1);
  }

  return Array.from(map.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getDefects(
  filters?: DefectFilters,
  pagination?: PaginationParams,
): Promise<{
  defects: Defect[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const query = buildQuery(filters, pagination);
  const response = await backendJson<{ items: Defect[]; total: number; page: number; pageSize: number; totalPages: number }>(`/api/defects${query ? `?${query}` : ""}`, {
    method: "GET",
  });

  return {
    defects: response.items,
    total: response.total,
    page: response.page,
    pageSize: response.pageSize,
    totalPages: response.totalPages,
  };
}

export async function getAverageResolutionTime(
  filters?: DefectFilters,
): Promise<number> {
  const defects = await fetchAllDefects(filters);
  const fixedRows = defects.filter((defect: Defect) => defect.status === "FIXED" && defect.dateReported && defect.dateFixed);
  if (!fixedRows.length) return 0;

  const totalDays = fixedRows.reduce((sum: number, defect: Defect) => {
    const reported = defect.dateReported ? new Date(defect.dateReported) : null;
    const fixed = defect.dateFixed ? new Date(defect.dateFixed) : null;
    if (!reported || !fixed || Number.isNaN(reported.getTime()) || Number.isNaN(fixed.getTime())) {
      return sum;
    }
    const diffDays = Math.floor((fixed.getTime() - reported.getTime()) / (1000 * 60 * 60 * 24));
    return sum + (Number.isFinite(diffDays) ? diffDays : 0);
  }, 0);

  return Math.round(totalDays / fixedRows.length);
}

export async function exportAllDefects(
  filters?: DefectFilters,
): Promise<Defect[]> {
  return fetchAllDefects(filters);
}

export async function getManualDefects(limit = 200): Promise<Defect[]> {
  const response = await getDefects(undefined, { page: 1, pageSize: Math.max(1, Math.min(limit, MAX_BACKEND_PAGE_SIZE)), sortBy: "date", sortOrder: "desc" });
  return response.defects;
}

export async function createManualDefect(
  input: ManualDefectInput,
): Promise<{ success: boolean; message: string; id?: string }> {
  try {
    const payload = {
      testCaseId: input.testCaseId?.trim() || null,
      dateReported: parseDateInput(input.issueTestDate),
      module: input.module.trim(),
      summary: input.summary?.trim() || null,
      expectedResult: input.expectedResult.trim(),
      actualResult: input.actualResult.trim(),
      severity: input.severity,
      priority: normalizeStoredPriority(input.priority),
      assignedTo: null,
      status: input.status,
      dateFixed: input.fixedDate ? parseDateInput(input.fixedDate) : null,
      qcStatusBbt: input.qcStatusBbt,
      sourceFile: input.sheetType || "Smoke Testing Sheet",
    };

    const defect = await backendJson<Defect>("/api/defects", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });

    return { success: true, message: "Issue added successfully", id: defect.id };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to add issue",
    };
  }
}

export async function updateManualDefect(
  id: string,
  updates: ManualDefectUpdateInput,
): Promise<{ success: boolean; message: string }> {
  if (!id) {
    return { success: false, message: "Defect ID is required" };
  }

  const setData: Record<string, unknown> = {};

  if (updates.issueTestDate !== undefined) {
    setData.dateReported = parseDateInput(updates.issueTestDate);
  }

  if (updates.fixedDate !== undefined) {
    setData.dateFixed = updates.fixedDate === null || updates.fixedDate === "" ? null : parseDateInput(updates.fixedDate);
  }

  if (updates.priority !== undefined) {
    setData.priority = normalizeStoredPriority(updates.priority);
  }

  if (updates.severity !== undefined) {
    setData.severity = updates.severity;
  }

  if (updates.status !== undefined) {
    setData.status = updates.status;
  }

  if (updates.qcStatusBbt !== undefined) {
    setData.qcStatusBbt = updates.qcStatusBbt;
  }

  if (Object.keys(setData).length === 0) {
    return { success: false, message: "No fields to update" };
  }

  try {
    await backendJson(`/api/defects/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(setData),
      headers: { "Content-Type": "application/json" },
    });
    return { success: true, message: "Issue updated successfully" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update issue",
    };
  }
}

export async function deleteManualDefect(
  id: string,
): Promise<{ success: boolean; message: string }> {
  if (!id) {
    return { success: false, message: "Defect ID is required" };
  }

  try {
    await backendJson(`/api/defects/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    return { success: true, message: "Issue removed successfully" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to remove issue",
    };
  }
}
