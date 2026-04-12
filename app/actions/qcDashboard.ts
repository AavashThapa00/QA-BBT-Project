"use server";

import { Collection } from "mongodb";
import { mongoCollections } from "@/lib/mongodb";
import { DefectDoc } from "@/lib/mongo-defects";

interface QCStatus {
  status: string;
  count: number;
}

interface QCSummary {
  totalQC: number;
  pendingQC: number;
  doneQC: number;
}

interface QCRecentDefect {
  id: string;
  testCaseId: string | null;
  module: string;
  status: string;
  qcStatusBbt: string;
  dateReported: string | null;
}

const getDefectsCollection = async () =>
  (await mongoCollections.defects()) as unknown as Collection<DefectDoc>;

export async function getQCStatusCounts(): Promise<QCStatus[]> {
  try {
    const defects = await getDefectsCollection();
    const result = await defects
      .aggregate<{ _id: string; count: number }>([
        {
          $group: {
            _id: {
              $cond: [{ $eq: ["$qcStatusBbt", "PASSED"] }, "Done", "Pending"],
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    return result.map((row) => ({
      status: row._id || "UNKNOWN",
      count: row.count,
    }));
  } catch (error) {
    console.error("Error fetching QC status counts:", error);
    return [];
  }
}

export async function getQCSummary(): Promise<QCSummary> {
  try {
    const defects = await getDefectsCollection();
    const [row] = await defects
      .aggregate<{ total_qc: number; done_qc: number; pending_qc: number }>([
        {
          $group: {
            _id: null,
            total_qc: { $sum: 1 },
            done_qc: {
              $sum: { $cond: [{ $eq: ["$qcStatusBbt", "PASSED"] }, 1, 0] },
            },
            pending_qc: {
              $sum: { $cond: [{ $ne: ["$qcStatusBbt", "PASSED"] }, 1, 0] },
            },
          },
        },
        { $project: { _id: 0, total_qc: 1, done_qc: 1, pending_qc: 1 } },
      ])
      .toArray();

    return {
      totalQC: row?.total_qc || 0,
      pendingQC: row?.pending_qc || 0,
      doneQC: row?.done_qc || 0,
    };
  } catch (error) {
    console.error("Error fetching QC summary:", error);
    return {
      totalQC: 0,
      pendingQC: 0,
      doneQC: 0,
    };
  }
}

export async function getRecentQCDefects(): Promise<QCRecentDefect[]> {
  try {
    const defects = await getDefectsCollection();
    const result = await defects
      .find(
        {},
        {
          projection: {
            id: 1,
            testCaseId: 1,
            module: 1,
            status: 1,
            qcStatusBbt: 1,
            dateReported: 1,
          },
        },
      )
      .sort({ dateReported: -1 })
      .limit(10)
      .toArray();

    return result.map((row) => ({
      id: row.id,
      testCaseId: row.testCaseId || null,
      module: row.module,
      status: row.status,
      qcStatusBbt: row.qcStatusBbt || "UNKNOWN",
      dateReported: row.dateReported
        ? row.dateReported.toISOString().split("T")[0]
        : null,
    }));
  } catch (error) {
    console.error("Error fetching recent QC defects:", error);
    return [];
  }
}
