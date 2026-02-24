import "dotenv/config";
import { db } from "@/lib/prisma";

async function checkSTDefects() {
  try {
    console.log("Checking for ST- test case IDs in database...\n");
    
    const result = await db.query(
      `SELECT "testCaseId", module, "dateReported"::text as date_reported, 
              LEFT("expectedResult", 50) as expected_preview,
              LEFT("actualResult", 50) as actual_preview
       FROM defect 
       WHERE "testCaseId" LIKE 'ST-%' 
       ORDER BY "testCaseId"`
    );
    
    console.log(`Found ${result.rows.length} defects with ST- test case IDs:\n`);
    console.table(result.rows);
    
  } catch (error) {
    console.error("Error:", error);
  }
}

checkSTDefects();
