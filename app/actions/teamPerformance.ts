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
            THEN EXTRACT(EPOCH FROM ("dateFixed"::timestamp - "dateReported"::timestamp)) / 86400
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
