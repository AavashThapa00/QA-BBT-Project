"use server";

import { db } from "@/lib/prisma";
import { Status } from "@/lib/types";

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

export async function getDefectsByStatus(): Promise<StatusCount[]> {
  try {
    const result = await db.query(
      `SELECT status, COUNT(*)::int as count
       FROM defect
       GROUP BY status
       ORDER BY status`
    );

    return result.rows.map(row => ({
      status: row.status as Status,
      count: row.count,
    }));
  } catch (error) {
    console.error("Error fetching defects by status:", error);
    return [];
  }
}

export async function getAverageFixTimeByModule(): Promise<ModuleFixTime[]> {
  try {
    console.log("[SERVER] Fetching average fix time by module...");
    
    // Extract main module prefix (HSA, KFQ, GMST, NMST, MST, Innovatetech)
    const result = await db.query(
      `SELECT 
        CASE
          WHEN module LIKE 'HSA%' THEN 'HSA'
          WHEN module LIKE 'KFQ%' THEN 'KFQ'
          WHEN module LIKE 'GMST%' OR module LIKE 'GGMST%' THEN 'GMST'
          WHEN module LIKE 'NMST%' THEN 'NMST'
          WHEN module LIKE 'MST%' THEN 'MST'
          WHEN module LIKE '%Innovatetech%' OR module LIKE 'Innovatetech%' THEN 'Innovatetech'
          WHEN module LIKE '%Alston%' THEN 'Alston'
          ELSE 'Other'
        END as main_module,
        COUNT(*) FILTER (WHERE status = 'CLOSED' OR status = 'AS_IT_IS')::int as total_fixed,
        COUNT(*) FILTER (WHERE (status = 'CLOSED' OR status = 'AS_IT_IS') AND "dateFixed" IS NULL)::int as uncertain_count,
        AVG(
          CASE 
            WHEN "dateFixed" IS NOT NULL AND "dateReported" IS NOT NULL 
            THEN EXTRACT(EPOCH FROM ("dateFixed"::timestamp - "dateReported"::timestamp)) / 86400
            ELSE NULL
          END
        ) as avg_days
       FROM defect
       WHERE status IN ('CLOSED', 'AS_IT_IS')
       GROUP BY main_module
       ORDER BY main_module`
    );

    console.log("[SERVER] Query result rows:", result.rows.length);
    console.log("[SERVER] Raw data:", JSON.stringify(result.rows, null, 2));

    const mappedData = result.rows.map(row => ({
      module: row.main_module,
      avgDays: row.avg_days ? parseFloat(parseFloat(row.avg_days).toFixed(1)) : null,
      totalFixed: row.total_fixed,
      uncertainCount: row.uncertain_count,
    }));

    console.log("[SERVER] Mapped data:", JSON.stringify(mappedData, null, 2));
    
    return mappedData;
  } catch (error) {
    console.error("[SERVER] Error fetching average fix time by module:", error);
    return [];
  }
}
