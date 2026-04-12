"use server";

import { Collection } from "mongodb";
import { mongoCollections } from "@/lib/mongodb";
import { Status } from "@/lib/types";
import { DefectDoc } from "@/lib/mongo-defects";

interface StatusCount {
  status: Status;
  count: number;
}

interface ModuleFixTime {
  module: string;
  avgDays: number | null;
  totalFixed: number;
  uncertainCount: number;
}

const moduleExpr = {
  $switch: {
    branches: [
      {
        case: { $regexMatch: { input: "$module", regex: /^HSA/i } },
        then: "HSA",
      },
      {
        case: { $regexMatch: { input: "$module", regex: /^KFQ/i } },
        then: "KFQ",
      },
      {
        case: { $regexMatch: { input: "$module", regex: /^(GMST|GGMST)/i } },
        then: "GMST",
      },
      {
        case: { $regexMatch: { input: "$module", regex: /^NMST/i } },
        then: "NMST",
      },
      {
        case: { $regexMatch: { input: "$module", regex: /^MST/i } },
        then: "GMST",
      },
      {
        case: { $regexMatch: { input: "$module", regex: /(Innovatetech)/i } },
        then: "Innovatetech",
      },
      {
        case: { $regexMatch: { input: "$module", regex: /(Alston)/i } },
        then: "Alston",
      },
    ],
    default: "Other",
  },
};

const getDefectsCollection = async () =>
  (await mongoCollections.defects()) as unknown as Collection<DefectDoc>;

export async function getDefectsByStatus(): Promise<StatusCount[]> {
  try {
    const defects = await getDefectsCollection();
    const result = await defects
      .aggregate<{
        _id: Status;
        count: number;
      }>([{ $group: { _id: "$status", count: { $sum: 1 } } }, { $sort: { _id: 1 } }])
      .toArray();

    return result.map((row) => ({
      status: row._id as Status,
      count: row.count,
    }));
  } catch (error) {
    console.error("Error fetching defects by status:", error);
    return [];
  }
}

export async function getAverageFixTimeByModule(): Promise<ModuleFixTime[]> {
  try {
    const defects = await getDefectsCollection();
    const result = await defects
      .aggregate<{
        _id: string;
        total_fixed: number;
        uncertain_count: number;
        avg_days: number | null;
      }>([
        { $match: { status: { $in: ["CLOSED", "AS_IT_IS"] } } },
        {
          $project: {
            main_module: moduleExpr,
            dateReported: 1,
            dateFixed: 1,
          },
        },
        {
          $group: {
            _id: "$main_module",
            total_fixed: { $sum: 1 },
            uncertain_count: {
              $sum: {
                $cond: [{ $eq: ["$dateFixed", null] }, 1, 0],
              },
            },
            avg_days: {
              $avg: {
                $cond: [
                  {
                    $and: [
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
        { $sort: { _id: 1 } },
      ])
      .toArray();

    const mappedData = result.map((row) => ({
      module: row._id,
      avgDays: row.avg_days ? parseFloat(row.avg_days.toFixed(1)) : null,
      totalFixed: row.total_fixed,
      uncertainCount: row.uncertain_count,
    }));
    return mappedData;
  } catch (error) {
    console.error("[SERVER] Error fetching average fix time by module:", error);
    return [];
  }
}
