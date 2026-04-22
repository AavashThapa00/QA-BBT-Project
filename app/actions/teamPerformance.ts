"use server";

import { Collection } from "mongodb";
import { mongoCollections } from "@/lib/mongodb";
import { DefectDoc } from "@/lib/mongo-defects";

interface TeamMember {
  assignedTo: string;
  totalDefects: number;
  openDefects: number;
  closedDefects: number;
  avgFixTimeDays: number | null;
  highSeverityCount: number;
}

interface TeamDefect {
  id: string;
  testCaseId: string | null;
  module: string;
  summary: string | null;
  status: string;
  dateReported: string | null;
}

const OPEN_DEFECT_STATUSES = [
  "PENDING",
  "RE_OPENED",
  "HOLD",
  "OPEN",
  "IN_PROGRESS",
  "ON_HOLD",
];

const CLOSED_DEFECT_STATUSES = ["FIXED", "AS_IT_IS", "CLOSED"];

const getDefectsCollection = async () =>
  (await mongoCollections.defects()) as unknown as Collection<DefectDoc>;

export async function getTeamPerformance(): Promise<TeamMember[]> {
  try {
    const defects = await getDefectsCollection();
    const result = await defects
      .aggregate<{
        _id: string;
        total_defects: number;
        open_defects: number;
        closed_defects: number;
        high_severity_count: number;
        avg_fix_time_days: number | null;
      }>([
        {
          $project: {
            assigned_to_normalized: {
              $let: {
                vars: {
                  normalized: {
                    $trim: {
                      input: {
                        $convert: {
                          input: "$assignedTo",
                          to: "string",
                          onError: "",
                          onNull: "",
                        },
                      },
                    },
                  },
                },
                in: {
                  $cond: [
                    { $gt: [{ $strLenCP: "$$normalized" }, 0] },
                    "$$normalized",
                    "Unassigned",
                  ],
                },
              },
            },
            status: 1,
            severity: 1,
            dateReported: 1,
            dateFixed: 1,
          },
        },
        {
          $group: {
            _id: "$assigned_to_normalized",
            total_defects: { $sum: 1 },
            open_defects: {
              $sum: {
                $cond: [{ $in: ["$status", OPEN_DEFECT_STATUSES] }, 1, 0],
              },
            },
            closed_defects: {
              $sum: {
                $cond: [{ $in: ["$status", CLOSED_DEFECT_STATUSES] }, 1, 0],
              },
            },
            high_severity_count: {
              $sum: {
                $cond: [{ $in: ["$severity", ["MAJOR", "HIGH"]] }, 1, 0],
              },
            },
            avg_fix_time_days: {
              $avg: {
                $cond: [
                  {
                    $and: [
                      { $in: ["$status", CLOSED_DEFECT_STATUSES] },
                      { $ne: ["$dateReported", null] },
                      { $ne: ["$dateFixed", null] },
                    ],
                  },
                  {
                    $max: [
                      1,
                      {
                        $divide: [
                          { $subtract: ["$dateFixed", "$dateReported"] },
                          1000 * 60 * 60 * 24,
                        ],
                      },
                    ],
                  },
                  null,
                ],
              },
            },
          },
        },
        { $sort: { closed_defects: -1, total_defects: -1 } },
      ])
      .toArray();

    return result.map((row) => ({
      assignedTo: row._id,
      totalDefects: row.total_defects,
      openDefects: row.open_defects,
      closedDefects: row.closed_defects,
      avgFixTimeDays: row.avg_fix_time_days
        ? parseFloat(row.avg_fix_time_days.toFixed(1))
        : null,
      highSeverityCount: row.high_severity_count,
    }));
  } catch (error) {
    console.error("Error fetching team performance:", error);
    return [];
  }
}

export async function getTeamDefectsByStatus(
  assignedTo: string,
  statusGroup: "open" | "fixed",
): Promise<TeamDefect[]> {
  try {
    const defects = await getDefectsCollection();
    const statusFilter =
      statusGroup === "open" ? OPEN_DEFECT_STATUSES : CLOSED_DEFECT_STATUSES;

    const hasTeamFilter = assignedTo !== "ALL";
    const query: Record<string, unknown> = { status: { $in: statusFilter } };
    if (hasTeamFilter) {
      query.$expr = {
        $eq: [
          { $trim: { input: { $ifNull: ["$assignedTo", ""] } } },
          assignedTo,
        ],
      };
    }

    const result = await defects
      .find(query, {
        projection: {
          id: 1,
          testCaseId: 1,
          module: 1,
          summary: 1,
          status: 1,
          dateReported: 1,
        },
      })
      .sort({ dateReported: -1 })
      .toArray();

    return result.map((row) => ({
      id: row.id,
      testCaseId: row.testCaseId || null,
      module: row.module,
      summary: row.summary || null,
      status: row.status,
      dateReported: row.dateReported
        ? row.dateReported.toISOString().split("T")[0]
        : null,
    }));
  } catch (error) {
    console.error("Error fetching team defects:", error);
    return [];
  }
}
