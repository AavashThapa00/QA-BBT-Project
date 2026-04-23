import { Filter, ObjectId, Sort } from "mongodb";
import { Defect, DefectFilters } from "@/lib/types";

export type DefectDoc = Omit<
  Defect,
  | "testCaseId"
  | "descriptionSteps"
  | "summary"
  | "remarks"
  | "testType"
  | "testScenario"
  | "testSteps"
  | "assignedTo"
  | "sourceFile"
> & {
  testCaseId?: string | null;
  descriptionSteps?: string | null;
  summary?: string | null;
  remarks?: string | null;
  testType?: "smoke" | "cycle" | null;
  testScenario?: string | null;
  testSteps?: string | null;
  assignedTo?: string | null;
  sourceFile?: string | null;
  uploadedBy?: string | null;
  _id?: ObjectId;
};

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildDefectMongoFilter(
  filters?: DefectFilters,
): Filter<DefectDoc> {
  const andClauses: Filter<DefectDoc>[] = [];

  if (filters?.dateFrom || filters?.dateTo) {
    const dateRange: Record<string, Date> = {};
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      from.setHours(0, 0, 0, 0);
      dateRange.$gte = from;
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59, 999);
      dateRange.$lte = to;
    }
    andClauses.push({
      dateReported: dateRange as Filter<DefectDoc>["dateReported"],
    });
  }

  if (filters?.severity?.length) {
    andClauses.push({
      severity: { $in: filters.severity },
    } as Filter<DefectDoc>);
  }

  if (filters?.priority?.length) {
    andClauses.push({
      priority: { $in: filters.priority },
    } as Filter<DefectDoc>);
  }

  if (filters?.status?.length) {
    andClauses.push({ status: { $in: filters.status } } as Filter<DefectDoc>);
  }

  if (filters?.module?.length) {
    andClauses.push({
      $or: filters.module.map((m) => ({
        module: { $regex: escapeRegex(m), $options: "i" },
      })),
    } as Filter<DefectDoc>);
  }

  if (filters?.searchTerm?.trim()) {
    const value = filters.searchTerm.trim();
    andClauses.push({
      $or: [
        { module: { $regex: escapeRegex(value), $options: "i" } },
        { expectedResult: { $regex: escapeRegex(value), $options: "i" } },
        { actualResult: { $regex: escapeRegex(value), $options: "i" } },
        { summary: { $regex: escapeRegex(value), $options: "i" } },
      ],
    } as Filter<DefectDoc>);
  }

  if (andClauses.length === 0) {
    return {};
  }

  return { $and: andClauses } as Filter<DefectDoc>;
}

export function getDefectSort(
  sortBy?: "date" | "severity" | "status",
  sortOrder?: "asc" | "desc",
): Sort {
  const direction = sortOrder === "asc" ? 1 : -1;
  if (sortBy === "severity") return { severity: direction };
  if (sortBy === "status") return { status: direction };
  return { dateReported: direction };
}

export function toDefect(doc: DefectDoc): Defect {
  return {
    id: doc.id,
    testCaseId: doc.testCaseId ?? undefined,
    dateReported: doc.dateReported ? new Date(doc.dateReported) : null,
    module: doc.module,
    descriptionSteps: doc.descriptionSteps ?? undefined,
    summary: doc.summary ?? undefined,
    expectedResult: doc.expectedResult,
    actualResult: doc.actualResult,
    remarks: doc.remarks ?? undefined,
    testType: doc.testType ?? undefined,
    testScenario: doc.testScenario ?? undefined,
    testSteps: doc.testSteps ?? undefined,
    severity: doc.severity,
    priority: doc.priority,
    assignedTo: doc.assignedTo ?? undefined,
    status: doc.status,
    dateFixed: doc.dateFixed ? new Date(doc.dateFixed) : null,
    qcStatusBbt: doc.qcStatusBbt,
    sourceFile: doc.sourceFile ?? undefined,
    createdAt: new Date(doc.createdAt),
  };
}
