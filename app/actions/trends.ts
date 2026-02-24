"use server";

import { db } from "@/lib/prisma";

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

export async function getMonthlyTrends(): Promise<MonthlyTrend[]> {
  try {
    const result = await db.query(
      `SELECT 
        TO_CHAR("dateReported", 'YYYY-MM') as month,
        COUNT(*)::int as reported,
        COUNT(*) FILTER (WHERE status IN ('CLOSED', 'AS_IT_IS'))::int as fixed
       FROM defect
       WHERE "dateReported" IS NOT NULL
       GROUP BY month
       ORDER BY month`
    );

    return result.rows.map(row => ({
      month: row.month,
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
    const result = await db.query(
      `SELECT severity, COUNT(*)::int as count
       FROM defect
       GROUP BY severity
       ORDER BY count DESC`
    );

    return result.rows.map(row => ({
      severity: row.severity,
      count: row.count,
    }));
  } catch (error) {
    console.error("Error fetching severity trends:", error);
    return [];
  }
}

export async function getModuleTrends(): Promise<ModuleTrend[]> {
  try {
    const result = await db.query(
      `SELECT 
        CASE
          WHEN module LIKE 'HSA%' THEN 'HSA'
          WHEN module LIKE 'KFQ%' THEN 'KFQ'
          WHEN module LIKE 'GMST%' OR module LIKE 'GGMST%' THEN 'GMST'
          WHEN module LIKE 'NMST%' THEN 'NMST'
          WHEN module LIKE 'MST%' THEN 'GMST'
          WHEN module LIKE '%Innovatetech%' OR module LIKE 'Innovatetech%' THEN 'Innovatetech'
          WHEN module LIKE '%Alston%' THEN 'Alston'
          ELSE 'Other'
        END as main_module,
        COUNT(*)::int as count
       FROM defect
       GROUP BY main_module
       ORDER BY count DESC`
    );

    return result.rows.map(row => ({
      module: row.main_module,
      count: row.count,
    }));
  } catch (error) {
    console.error("Error fetching module trends:", error);
    return [];
  }
}
