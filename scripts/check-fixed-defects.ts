import "dotenv/config";
import { db } from "@/lib/prisma";

async function checkFixedDefects() {
  try {
    console.log("Checking for fixed defects...\n");
    
    // Check status distribution
    const statusResult = await db.query(
      `SELECT status, COUNT(*)::int as count
       FROM defect
       GROUP BY status
       ORDER BY count DESC`
    );
    
    console.log("Status distribution:");
    console.table(statusResult.rows);
    
    // Check defects with dateFixed
    const dateFixedResult = await db.query(
      `SELECT status, 
              COUNT(*)::int as total,
              COUNT("dateFixed")::int as with_date_fixed,
              COUNT(*) FILTER (WHERE "dateFixed" IS NULL)::int as without_date_fixed
       FROM defect
       GROUP BY status
       ORDER BY total DESC`
    );
    
    console.log("\nDefects with dateFixed by status:");
    console.table(dateFixedResult.rows);
    
    // Check sample of CLOSED/AS_IT_IS defects
    const sampleResult = await db.query(
      `SELECT "testCaseId", status, "dateReported"::text, "dateFixed"::text,
              CASE 
                WHEN "dateFixed" IS NOT NULL AND "dateReported" IS NOT NULL 
                THEN EXTRACT(EPOCH FROM ("dateFixed"::timestamp - "dateReported"::timestamp)) / 86400
                ELSE NULL
              END as days_to_fix
       FROM defect
       WHERE status IN ('CLOSED', 'AS_IT_IS')
       LIMIT 10`
    );
    
    console.log("\nSample of CLOSED/AS_IT_IS defects:");
    console.table(sampleResult.rows);
    
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkFixedDefects();
