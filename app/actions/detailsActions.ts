"use server";

import { db } from "@/lib/prisma";
import { Defect } from "@/lib/types";

export async function getDefectById(id: string): Promise<Defect | null> {
  try {
    const result = await db.query<any>(
      `SELECT id, "testCaseId", "dateReported", module, "expectedResult", "actualResult", severity, priority, status, "dateFixed", "qcStatusBbt", "createdAt" 
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
      expectedResult: row.expectedResult || "",
      actualResult: row.actualResult || "",
      severity: row.severity,
      priority: row.priority || "",
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
