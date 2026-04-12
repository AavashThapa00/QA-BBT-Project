import { randomUUID } from "crypto";
import { Collection, Filter } from "mongodb";
import { mongoCollections } from "@/lib/mongodb";
import { DefectDoc } from "@/lib/mongo-defects";
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

const getDefectsCollection = async () =>
  (await mongoCollections.defects()) as unknown as Collection<DefectDoc>;

function buildApiFilter(filters?: DefectListFilters): Filter<DefectDoc> {
  const andClauses: Filter<DefectDoc>[] = [];

  if (filters?.dateFrom || filters?.dateTo) {
    const range: Record<string, Date> = {};
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      from.setHours(0, 0, 0, 0);
      range.$gte = from;
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59, 999);
      range.$lte = to;
    }
    andClauses.push({ dateReported: range as never });
  }

  if (filters?.severity?.length) {
    andClauses.push({ severity: { $in: filters.severity } as never });
  }

  if (filters?.status?.length) {
    andClauses.push({ status: { $in: filters.status } as never });
  }

  if (filters?.module?.length) {
    andClauses.push({ module: { $in: filters.module } as never });
  }

  if (filters?.search?.trim()) {
    const q = filters.search.trim();
    andClauses.push({
      $or: [
        { module: { $regex: q, $options: "i" } },
        { summary: { $regex: q, $options: "i" } },
        { expectedResult: { $regex: q, $options: "i" } },
        { actualResult: { $regex: q, $options: "i" } },
        { testCaseId: { $regex: q, $options: "i" } },
      ],
    } as never);
  }

  if (!andClauses.length) return {};
  return { $and: andClauses } as Filter<DefectDoc>;
}

function getSort(
  sortBy?: DefectPagination["sortBy"],
  sortOrder: DefectPagination["sortOrder"] = "desc",
) {
  const dir = sortOrder === "asc" ? 1 : -1;
  if (sortBy === "severity") return { severity: dir };
  if (sortBy === "status") return { status: dir };
  return { dateReported: dir };
}

export async function getDefectsForApi(
  filters: DefectListFilters,
  pagination: DefectPagination,
) {
  const defects = await getDefectsCollection();
  const where = buildApiFilter(filters);
  const offset = Math.max(0, (pagination.page - 1) * pagination.pageSize);

  const [rows, total] = await Promise.all([
    defects
      .find(where)
      .sort(getSort(pagination.sortBy, pagination.sortOrder) as never)
      .skip(offset)
      .limit(pagination.pageSize)
      .toArray(),
    defects.countDocuments(where),
  ]);

  return {
    defects: rows,
    page: pagination.page,
    pageSize: pagination.pageSize,
    total,
    totalPages: Math.ceil(total / pagination.pageSize),
  };
}

export async function getDefectMetricsForApi(filters: DefectListFilters) {
  const defects = await getDefectsCollection();
  const where = buildApiFilter(filters);

  const [totalDefects, openDefects, closedDefects, highSeverityCount] =
    await Promise.all([
      defects.countDocuments(where),
      defects.countDocuments({
        $and: [
          where as never,
          { status: { $in: ["OPEN", "IN_PROGRESS", "ON_HOLD"] } },
        ],
      } as never),
      defects.countDocuments({
        $and: [where as never, { status: { $in: ["CLOSED", "AS_IT_IS"] } }],
      } as never),
      defects.countDocuments({
        $and: [where as never, { severity: "MAJOR" }],
      } as never),
    ]);

  return {
    totalDefects,
    openDefects,
    closedDefects,
    highSeverityCount,
  };
}

export async function createDefectForApi(payload: CreateDefectPayload) {
  const defects = await getDefectsCollection();
  const id = randomUUID();

  const doc: DefectDoc = {
    id,
    testCaseId: payload.testCaseId ?? null,
    dateReported: new Date(payload.dateReported),
    module: payload.module,
    summary: payload.summary ?? null,
    expectedResult: payload.expectedResult,
    actualResult: payload.actualResult,
    severity: payload.severity,
    priority: payload.priority,
    assignedTo: payload.assignedTo ?? null,
    status: payload.status,
    dateFixed: payload.dateFixed ? new Date(payload.dateFixed) : null,
    qcStatusBbt: payload.qcStatusBbt ?? "PENDING",
    sourceFile: payload.sourceFile ?? null,
    createdAt: new Date(),
  };

  await defects.insertOne(doc);
  return doc;
}
