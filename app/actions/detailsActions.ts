"use server";

import { db } from "@/lib/prisma";
import { Defect } from "@/lib/types";

export async function getDefectById(id: string): Promise<Defect | null> {
  try {
    const result = await db.query<any>(
      `SELECT id, "testCaseId", "dateReported", module, "descriptionSteps", summary, "expectedResult", "actualResult", remarks, "testScenario", "testSteps", severity, priority, "assignedTo", status, "dateFixed", "qcStatusBbt", "createdAt" 
       FROM defect WHERE id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
    
    // Transform database row to Defect type
    const defect: Defect = {
      id: row.id,
      testCaseId: row.testCaseId || undefined,
      dateReported: row.dateReported ? new Date(row.dateReported) : null,
      module: row.module,
      descriptionSteps: row.descriptionSteps || undefined,
      summary: row.summary || undefined,
      expectedResult: row.expectedResult || "",
      actualResult: row.actualResult || "",
      remarks: row.remarks || undefined,
      testScenario: row.testScenario || undefined,
      testSteps: row.testSteps || undefined,
      severity: row.severity,
      priority: row.priority || "",
      assignedTo: row.assignedTo || undefined,
      status: row.status,
      dateFixed: row.dateFixed ? new Date(row.dateFixed) : null,
      qcStatusBbt: row.qcStatusBbt,
      createdAt: new Date(row.createdAt),
    };
    
    return defect;
  } catch (error) {
    console.error("Error fetching defect:", error);
    return null;
  }
}
export async function getAllDefectsSorted(): Promise<Defect[]> {
  try {
    // Sort by status priority: ON_HOLD (Pending) and OPEN (Hold) first, then others
    const result = await db.query<any>(
      `SELECT id, "testCaseId", "dateReported", module, summary, "expectedResult", "actualResult", severity, priority, "assignedTo", status, "dateFixed", "qcStatusBbt", "createdAt"
       FROM defect
       ORDER BY 
         CASE 
           WHEN status = 'ON_HOLD' THEN 1
           WHEN status = 'OPEN' THEN 2
           WHEN status = 'IN_PROGRESS' THEN 3
           WHEN status = 'AS_IT_IS' THEN 4
           WHEN status = 'CLOSED' THEN 5
           ELSE 6
         END,
         "dateReported" DESC`
    );
    
    const defects: Defect[] = result.rows.map((row: any) => ({
      id: row.id,
      testCaseId: row.testCaseId || undefined,
      dateReported: row.dateReported ? new Date(row.dateReported) : null,
      module: row.module,
      summary: row.summary || undefined,
      expectedResult: row.expectedResult || "",
      actualResult: row.actualResult || "",
      severity: row.severity,
      priority: row.priority || "",
      assignedTo: row.assignedTo || undefined,
      status: row.status,
      dateFixed: row.dateFixed ? new Date(row.dateFixed) : null,
      qcStatusBbt: row.qcStatusBbt,
      createdAt: new Date(row.createdAt),
    }));
    
    return defects;
  } catch (error) {
    console.error("Error fetching all defects:", error);
    return [];
  }
}

export async function deleteDefectById(id: string): Promise<{ success: boolean; message: string }> {
  if (!id) {
    return { success: false, message: "Issue ID is required" };
  }

  try {
    const result = await db.query(`DELETE FROM defect WHERE id = $1`, [id]);

    if (!result.rowCount) {
      return { success: false, message: "Issue not found" };
    }

    return { success: true, message: "Issue removed successfully" };
  } catch (error) {
    console.error("Error deleting defect:", error);
    return { success: false, message: "Failed to remove issue" };
  }
}