"use server";

import { db } from "@/lib/prisma";

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

export async function getQCStatusCounts(): Promise<QCStatus[]> {
  try {
    const result = await db.query(
      `SELECT 
        CASE 
          WHEN "qcStatusBbt" = 'PASSED' THEN 'Done'
          ELSE 'Pending'
        END as status,
        COUNT(*)::int as count
       FROM defect
       GROUP BY status
       ORDER BY status`
    );

    return result.rows.map(row => ({
      status: row.status || "UNKNOWN",
      count: row.count,
    }));
  } catch (error) {
    console.error("Error fetching QC status counts:", error);
    return [];
  }
}

export async function getQCSummary(): Promise<QCSummary> {
  try {
    const result = await db.query(
      `SELECT
        COUNT(*)::int as total_qc,
        COUNT(*) FILTER (WHERE "qcStatusBbt" = 'PASSED')::int as done_qc,
        COUNT(*) FILTER (WHERE "qcStatusBbt" <> 'PASSED')::int as pending_qc
       FROM defect`
    );

    const row = result.rows[0];
    return {
      totalQC: row.total_qc || 0,
      pendingQC: row.pending_qc || 0,
      doneQC: row.done_qc || 0,
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
    const result = await db.query(
      `SELECT id, "testCaseId", module, status, "qcStatusBbt", "dateReported"
       FROM defect
       ORDER BY "dateReported" DESC NULLS LAST
       LIMIT 10`
    );

    return result.rows.map(row => ({
      id: row.id,
      testCaseId: row.testCaseId,
      module: row.module,
      status: row.status,
      qcStatusBbt: row.qcStatusBbt || "UNKNOWN",
      dateReported: row.dateReported ? row.dateReported.toISOString().split('T')[0] : null,
    }));
  } catch (error) {
    console.error("Error fetching recent QC defects:", error);
    return [];
  }
}
