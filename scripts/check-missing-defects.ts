import "dotenv/config";
import { db } from "@/lib/prisma";

async function checkMissingDefects() {
  try {
    console.log("Checking for potential duplicates of ST-01, ST-02, ST-03...\n");
    
    // Check for KFQ Mobile Homepage with scroll-related content
    const st01 = await db.query(
      `SELECT "testCaseId", module, "dateReported"::text, 
              LEFT("expectedResult", 60) as expected,
              LEFT("actualResult", 60) as actual
       FROM defect 
       WHERE module LIKE '%KFQ%' 
         AND module LIKE '%Mobile%'
         AND "dateReported" = '2026-01-08'
       LIMIT 5`
    );
    
    console.log("Potential ST-01 duplicates (KFQ Mobile, 2026-01-08):");
    console.table(st01.rows);
    
    // Check for KFQ Discover with Freemium Sifu Guide
    const st02 = await db.query(
      `SELECT "testCaseId", module, "dateReported"::text,
              LEFT("expectedResult", 60) as expected,
              LEFT("actualResult", 60) as actual
       FROM defect 
       WHERE module LIKE '%KFQ-Discover%'
         AND "dateReported" = '2026-01-09'
       LIMIT 5`
    );
    
    console.log("\nPotential ST-02 duplicates (KFQ-Discover, 2026-01-09):");
    console.table(st02.rows);
    
    // Check for GMST with Google signup
    const st03 = await db.query(
      `SELECT "testCaseId", module, "dateReported"::text,
              LEFT("expectedResult", 60) as expected,
              LEFT("actualResult", 60) as actual
       FROM defect 
       WHERE module LIKE '%GMST%'
         AND "dateReported" = '2026-01-11'
         AND ("actualResult" LIKE '%Google%' OR "actualResult" LIKE '%parent%')
       LIMIT 5`
    );
    
    console.log("\nPotential ST-03 duplicates (GMST, 2026-01-11):");
    console.table(st03.rows);
    
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkMissingDefects();
