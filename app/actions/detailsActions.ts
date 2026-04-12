"use server";

import { Collection } from "mongodb";
import { mongoCollections } from "@/lib/mongodb";
import { Defect } from "@/lib/types";
import { DefectDoc, toDefect } from "@/lib/mongo-defects";

const getDefectsCollection = async () =>
  (await mongoCollections.defects()) as unknown as Collection<DefectDoc>;

export async function getDefectById(id: string): Promise<Defect | null> {
  try {
    const defects = await getDefectsCollection();
    const row = await defects.findOne(
      { id },
      {
        projection: {
          id: 1,
          testCaseId: 1,
          dateReported: 1,
          module: 1,
          descriptionSteps: 1,
          summary: 1,
          expectedResult: 1,
          actualResult: 1,
          remarks: 1,
          testScenario: 1,
          testSteps: 1,
          severity: 1,
          priority: 1,
          assignedTo: 1,
          status: 1,
          dateFixed: 1,
          qcStatusBbt: 1,
          createdAt: 1,
        },
      },
    );

    if (!row) return null;
    return toDefect(row);
  } catch (error) {
    console.error("Error fetching defect:", error);
    return null;
  }
}
export async function getAllDefectsSorted(): Promise<Defect[]> {
  try {
    const defects = await getDefectsCollection();
    const result = await defects
      .aggregate<DefectDoc>([
        {
          $addFields: {
            __statusPriority: {
              $switch: {
                branches: [
                  { case: { $eq: ["$status", "ON_HOLD"] }, then: 1 },
                  { case: { $eq: ["$status", "OPEN"] }, then: 2 },
                  { case: { $eq: ["$status", "IN_PROGRESS"] }, then: 3 },
                  { case: { $eq: ["$status", "AS_IT_IS"] }, then: 4 },
                  { case: { $eq: ["$status", "CLOSED"] }, then: 5 },
                ],
                default: 6,
              },
            },
          },
        },
        { $sort: { __statusPriority: 1, dateReported: -1 } },
        { $project: { __statusPriority: 0 } },
      ])
      .toArray();

    return result.map(toDefect);
  } catch (error) {
    console.error("Error fetching all defects:", error);
    return [];
  }
}

export async function deleteDefectById(
  id: string,
): Promise<{ success: boolean; message: string }> {
  if (!id) {
    return { success: false, message: "Issue ID is required" };
  }

  try {
    const defects = await getDefectsCollection();
    const result = await defects.deleteOne({ id });

    if (!result.deletedCount) {
      return { success: false, message: "Issue not found" };
    }

    return { success: true, message: "Issue removed successfully" };
  } catch (error) {
    console.error("Error deleting defect:", error);
    return { success: false, message: "Failed to remove issue" };
  }
}
