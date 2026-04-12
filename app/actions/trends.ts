"use server";

import { Collection } from "mongodb";
import { mongoCollections } from "@/lib/mongodb";
import { DefectDoc } from "@/lib/mongo-defects";

interface MonthlyTrend {
  month: string;
  reported: number;
  fixed: number;
}

interface SeverityTrend {
  severity: string;
  count: number;
}

interface ModuleTrend {
  module: string;
  count: number;
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

export async function getMonthlyTrends(): Promise<MonthlyTrend[]> {
  try {
    const defects = await getDefectsCollection();
    const result = await defects
      .aggregate<{ _id: string; reported: number; fixed: number }>([
        { $match: { dateReported: { $ne: null, $type: "date" } } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m",
                date: "$dateReported",
              },
            },
            reported: { $sum: 1 },
            fixed: {
              $sum: {
                $cond: [{ $in: ["$status", ["CLOSED", "AS_IT_IS"]] }, 1, 0],
              },
            },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    return result.map((row) => ({
      month: row._id,
      reported: row.reported,
      fixed: row.fixed,
    }));
  } catch (error) {
    console.error("Error fetching monthly trends:", error);
    return [];
  }
}

export async function getSeverityTrends(): Promise<SeverityTrend[]> {
  try {
    const defects = await getDefectsCollection();
    const result = await defects
      .aggregate<{
        _id: string;
        count: number;
      }>([{ $group: { _id: "$severity", count: { $sum: 1 } } }, { $sort: { count: -1 } }])
      .toArray();

    return result.map((row) => ({
      severity: row._id,
      count: row.count,
    }));
  } catch (error) {
    console.error("Error fetching severity trends:", error);
    return [];
  }
}

export async function getModuleTrends(): Promise<ModuleTrend[]> {
  try {
    const defects = await getDefectsCollection();
    const result = await defects
      .aggregate<{
        _id: string;
        count: number;
      }>([{ $project: { main_module: moduleExpr } }, { $group: { _id: "$main_module", count: { $sum: 1 } } }, { $sort: { count: -1 } }])
      .toArray();

    return result.map((row) => ({
      module: row._id,
      count: row.count,
    }));
  } catch (error) {
    console.error("Error fetching module trends:", error);
    return [];
  }
}
