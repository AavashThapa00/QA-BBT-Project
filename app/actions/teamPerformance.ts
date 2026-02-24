"use server";

import { db } from "@/lib/prisma";

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

export async function getTeamPerformance(): Promise<TeamMember[]> {
  try {
    const result = await db.query(
      `SELECT 
        "assignedTo",
        COUNT(*)::int as total_defects,
        COUNT(*) FILTER (WHERE status IN ('OPEN', 'IN_PROGRESS', 'ON_HOLD'))::int as open_defects,
        COUNT(*) FILTER (WHERE status = 'CLOSED' OR status = 'AS_IT_IS')::int as closed_defects,
        COUNT(*) FILTER (WHERE severity IN ('MAJOR', 'HIGH'))::int as high_severity_count,
        AVG(
          CASE 
            WHEN "dateFixed" IS NOT NULL AND "dateReported" IS NOT NULL AND (status = 'CLOSED' OR status = 'AS_IT_IS')
            THEN GREATEST(1, EXTRACT(EPOCH FROM ("dateFixed"::timestamp - "dateReported"::timestamp)) / 86400)
            ELSE NULL
          END
        ) as avg_fix_time_days
       FROM defect
       WHERE "assignedTo" IS NOT NULL AND "assignedTo" != ''
       GROUP BY "assignedTo"
       ORDER BY closed_defects DESC, total_defects DESC`
    );

    return result.rows.map(row => ({
      assignedTo: row.assignedTo,
      totalDefects: row.total_defects,
      openDefects: row.open_defects,
      closedDefects: row.closed_defects,
      avgFixTimeDays: row.avg_fix_time_days ? parseFloat(parseFloat(row.avg_fix_time_days).toFixed(1)) : null,
      highSeverityCount: row.high_severity_count,
    }));
  } catch (error) {
    console.error("Error fetching team performance:", error);
    return [];
  }
}

export async function getTeamDefectsByStatus(
  assignedTo: string,
  statusGroup: "open" | "fixed"
): Promise<TeamDefect[]> {
  try {
    const statusFilter =
      statusGroup === "open"
        ? "('OPEN', 'IN_PROGRESS', 'ON_HOLD')"
        : "('CLOSED', 'AS_IT_IS')";

    const hasTeamFilter = assignedTo !== "ALL";
    const result = await db.query(
      `SELECT id, "testCaseId", module, summary, status, "dateReported"
       FROM defect
       WHERE ${hasTeamFilter ? "\"assignedTo\" = $1 AND" : ""}
         status IN ${statusFilter}
       ORDER BY "dateReported" DESC NULLS LAST`,
      hasTeamFilter ? [assignedTo] : []
    );

    return result.rows.map(row => ({
      id: row.id,
      testCaseId: row.testCaseId || null,
      module: row.module,
      summary: row.summary || null,
      status: row.status,
      dateReported: row.dateReported ? row.dateReported.toISOString().split("T")[0] : null,
    }));
  } catch (error) {
    console.error("Error fetching team defects:", error);
    return [];
  }
}
