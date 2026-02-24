import "dotenv/config";
import { db } from "@/lib/prisma";

async function testModuleExtraction() {
  try {
    console.log("Testing module extraction and fix time calculation...\n");
    
    const result = await db.query(
      `SELECT 
        module,
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
        status,
        "dateReported"::text,
        "dateFixed"::text,
        CASE 
          WHEN "dateFixed" IS NOT NULL AND "dateReported" IS NOT NULL 
          THEN EXTRACT(EPOCH FROM ("dateFixed"::timestamp - "dateReported"::timestamp)) / 86400
          ELSE NULL
        END as days_to_fix
       FROM defect
       WHERE status IN ('CLOSED', 'AS_IT_IS')
       ORDER BY module
       LIMIT 20`
    );
    
    console.log("Sample module extraction:");
    console.table(result.rows);
    
    // Now run the actual query
    const aggregateResult = await db.query(
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
    
    console.log("\nAggregated fix time by module:");
    console.table(aggregateResult.rows);
    
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

testModuleExtraction();
