"use server";

import { randomUUID } from "crypto";
import { Collection, Filter } from "mongodb";
import { mongoCollections } from "@/lib/mongodb";
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
import {
  DefectDoc,
  buildDefectMongoFilter,
  getDefectSort,
  toDefect,
} from "@/lib/mongo-defects";

const getDefectsCollection = async () =>
  (await mongoCollections.defects()) as unknown as Collection<DefectDoc>;

export async function getDefectMetrics(filters?: DefectFilters): Promise<{
  totalDefects: number;
  openDefects: number;
  closedDefects: number;
  highSeverityCount: number;
}> {
  const defects = await getDefectsCollection();
  const baseFilter = buildDefectMongoFilter(filters);

  try {
    const [totalDefects, openDefects, closedDefects, highSeverityCount] =
      await Promise.all([
        defects.countDocuments(baseFilter),
        defects.countDocuments({
          $and: [
            baseFilter,
            {
              status: {
                $in: [
                  StatusEnum.OPEN,
                  StatusEnum.IN_PROGRESS,
                  StatusEnum.ON_HOLD,
                ],
              },
            },
          ],
        } as Filter<DefectDoc>),
        defects.countDocuments({
          $and: [
            baseFilter,
            { status: { $in: [StatusEnum.CLOSED, StatusEnum.AS_IT_IS] } },
          ],
        } as Filter<DefectDoc>),
        defects.countDocuments({
          $and: [baseFilter, { severity: SeverityEnum.MAJOR }],
        } as Filter<DefectDoc>),
      ]);

    return {
      totalDefects,
      openDefects,
      closedDefects,
      highSeverityCount,
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
  const defects = await getDefectsCollection();
  const filter = buildDefectMongoFilter(filters);

  try {
    const result = await defects
      .aggregate<{
        _id: string | null;
        count: number;
      }>([{ $match: filter }, { $group: { _id: "$module", count: { $sum: 1 } } }, { $sort: { count: -1 } }])
      .toArray();

    const moduleMap: Record<string, number> = {};

    result.forEach((row) => {
      const mainModule = extractMainModuleFromName(row._id || "Unknown");
      moduleMap[mainModule] = (moduleMap[mainModule] || 0) + row.count;
    });

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
  if (lowerName.includes("alston") || lowerName.includes("innovatetech"))
    return "Innovatetech";

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
  const defects = await getDefectsCollection();
  const filter = buildDefectMongoFilter(filters);

  try {
    const result = await defects
      .aggregate<{
        _id: Severity | null;
        count: number;
      }>([{ $match: filter }, { $group: { _id: "$severity", count: { $sum: 1 } } }, { $sort: { count: -1 } }])
      .toArray();
    return result
      .filter((row) => !!row._id)
      .map((row) => ({
        severity: row._id as Severity,
        count: row.count,
      }));
  } catch (error) {
    console.error("Error fetching defects by severity:", error);
    throw error;
  }
}

export async function getDefectsTrend(
  filters?: DefectFilters,
  groupBy: "day" | "month" = "day",
): Promise<
  Array<{
    date: string;
    count: number;
  }>
> {
  const defects = await getDefectsCollection();
  const baseFilter = buildDefectMongoFilter(filters);
  const dateFormat = groupBy === "month" ? "%Y-%m" : "%Y-%m-%d";

  try {
    const result = await defects
      .aggregate<{ _id: string; count: number }>([
        {
          $match: {
            $and: [
              baseFilter,
              {
                dateReported: {
                  $exists: true,
                  $ne: null,
                  $type: "date",
                },
              },
            ],
          } as Filter<DefectDoc>,
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: dateFormat,
                date: "$dateReported",
              },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();
    return result.map((row) => ({
      date: row._id,
      count: row.count,
    }));
  } catch (error) {
    console.error("Error fetching defects trend:", error);
    throw error;
  }
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
  const defectsCollection = await getDefectsCollection();
  const filter = buildDefectMongoFilter(filters);
  const pageSize = pagination?.pageSize || 10;
  const page = Math.max(0, (pagination?.page || 1) - 1);
  const offset = page * pageSize;

  const [defectsResult, total] = await Promise.all([
    defectsCollection
      .find(filter)
      .sort(getDefectSort(pagination?.sortBy, pagination?.sortOrder))
      .skip(offset)
      .limit(pageSize)
      .toArray(),
    defectsCollection.countDocuments(filter),
  ]);

  return {
    defects: defectsResult.map(toDefect),
    total,
    page: page + 1,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getAverageResolutionTime(
  filters?: DefectFilters,
): Promise<number> {
  const defects = await getDefectsCollection();
  const filter = buildDefectMongoFilter({
    ...filters,
    status: [StatusEnum.CLOSED],
  });

  try {
    const result = await defects
      .find({
        $and: [
          filter,
          {
            dateFixed: { $exists: true, $ne: null, $type: "date" },
            dateReported: { $exists: true, $ne: null, $type: "date" },
          },
        ],
      } as Filter<DefectDoc>)
      .project({ dateReported: 1, dateFixed: 1 })
      .toArray();

    if (result.length === 0) return 0;

    const totalDays = result.reduce((sum, row) => {
      const reported =
        row.dateReported instanceof Date ? row.dateReported : null;
      const fixed = row.dateFixed instanceof Date ? row.dateFixed : null;
      if (!reported || !fixed) return sum;
      const diffDays = Math.floor(
        (fixed.getTime() - reported.getTime()) / (1000 * 60 * 60 * 24),
      );
      return sum + (Number.isFinite(diffDays) ? diffDays : 0);
    }, 0);
    return Math.round(totalDays / result.length);
  } catch (error) {
    console.error("Error fetching average resolution time:", error);
    throw error;
  }
}

export async function exportAllDefects(
  filters?: DefectFilters,
): Promise<Defect[]> {
  const defects = await getDefectsCollection();
  const filter = buildDefectMongoFilter(filters);

  try {
    const result = await defects
      .find(filter)
      .sort({ dateReported: -1 })
      .toArray();
    return result.map(toDefect);
  } catch (error) {
    console.error("Error exporting all defects:", error);
    throw error;
  }
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
  const defects = await getDefectsCollection();
  const safeLimit = Math.max(1, Math.min(limit, 1000));
  const result = await defects
    .find({})
    .sort({ dateReported: -1, createdAt: -1 })
    .limit(safeLimit)
    .toArray();
  return result.map(toDefect);
}

export async function createManualDefect(
  input: ManualDefectInput,
): Promise<{ success: boolean; message: string; id?: string }> {
  const defects = await getDefectsCollection();
  const moduleName = input.module?.trim();
  const expectedResult = input.expectedResult?.trim();
  const actualResult = input.actualResult?.trim();
  const priority = input.priority?.trim();

  if (!moduleName) return { success: false, message: "Module is required" };
  if (!expectedResult)
    return { success: false, message: "Expected Result is required" };
  if (!actualResult)
    return { success: false, message: "Actual Result is required" };
  if (!priority) return { success: false, message: "Priority is required" };
  if (!input.issueTestDate)
    return { success: false, message: "Issue Test Date is required" };
  if (!isValidSeverity(input.severity))
    return { success: false, message: "Invalid severity" };
  if (!isValidStatus(input.status))
    return { success: false, message: "Invalid status" };
  if (!isValidQcStatus(input.qcStatusBbt))
    return { success: false, message: "Invalid QC status" };
  if ((input.testType || "smoke") === "cycle" && !input.testScenario?.trim()) {
    return {
      success: false,
      message: "Test scenario is required for cycle test",
    };
  }
  if ((input.testType || "smoke") === "cycle" && !input.testSteps?.trim()) {
    return {
      success: false,
      message: "Test steps are required for cycle test",
    };
  }

  try {
    const id = randomUUID();
    const issueTestDate = parseDateInput(input.issueTestDate);
    const fixedDate = input.fixedDate ? parseDateInput(input.fixedDate) : null;

    await defects.insertOne({
      id,
      testCaseId: input.testCaseId?.trim() || null,
      dateReported: issueTestDate,
      module: moduleName,
      descriptionSteps: input.descriptionSteps?.trim() || null,
      summary: input.summary?.trim() || null,
      expectedResult,
      actualResult,
      remarks: input.remarks?.trim() || null,
      testType: input.testType || "smoke",
      testScenario: input.testScenario?.trim() || null,
      testSteps: input.testSteps?.trim() || null,
      severity: input.severity,
      priority,
      status: input.status,
      dateFixed: fixedDate,
      qcStatusBbt: input.qcStatusBbt,
      sourceFile: input.sheetType || "Smoke Testing Sheet",
      createdAt: new Date(),
    });

    return { success: true, message: "Issue added successfully", id };
  } catch (error) {
    console.error("Error creating manual defect:", error);
    return { success: false, message: "Failed to add issue" };
  }
}

export async function updateManualDefect(
  id: string,
  updates: ManualDefectUpdateInput,
): Promise<{ success: boolean; message: string }> {
  const defects = await getDefectsCollection();
  if (!id) {
    return { success: false, message: "Defect ID is required" };
  }

  const setData: Partial<DefectDoc> = {};

  if (updates.issueTestDate !== undefined) {
    setData.dateReported = parseDateInput(updates.issueTestDate);
  }

  if (updates.fixedDate !== undefined) {
    setData.dateFixed =
      updates.fixedDate === null || updates.fixedDate === ""
        ? null
        : parseDateInput(updates.fixedDate);
  }

  if (updates.priority !== undefined) {
    const priority = updates.priority.trim();
    if (!priority) {
      return { success: false, message: "Priority cannot be empty" };
    }
    setData.priority = priority;
  }

  if (updates.severity !== undefined) {
    if (!isValidSeverity(updates.severity)) {
      return { success: false, message: "Invalid severity" };
    }
    setData.severity = updates.severity;
  }

  if (updates.status !== undefined) {
    if (!isValidStatus(updates.status)) {
      return { success: false, message: "Invalid status" };
    }
    setData.status = updates.status;
  }

  if (updates.qcStatusBbt !== undefined) {
    if (!isValidQcStatus(updates.qcStatusBbt)) {
      return { success: false, message: "Invalid QC status" };
    }
    setData.qcStatusBbt = updates.qcStatusBbt;
  }

  if (Object.keys(setData).length === 0) {
    return { success: false, message: "No fields to update" };
  }

  try {
    const result = await defects.updateOne({ id }, { $set: setData });

    if (!result.matchedCount) {
      return { success: false, message: "Issue not found" };
    }

    return { success: true, message: "Issue updated successfully" };
  } catch (error) {
    console.error("Error updating manual defect:", error);
    return { success: false, message: "Failed to update issue" };
  }
}

export async function deleteManualDefect(
  id: string,
): Promise<{ success: boolean; message: string }> {
  const defects = await getDefectsCollection();
  if (!id) {
    return { success: false, message: "Defect ID is required" };
  }

  try {
    const result = await defects.deleteOne({ id });

    if (!result.deletedCount) {
      return { success: false, message: "Issue not found" };
    }

    return { success: true, message: "Issue removed successfully" };
  } catch (error) {
    console.error("Error deleting manual defect:", error);
    return { success: false, message: "Failed to remove issue" };
  }
}
