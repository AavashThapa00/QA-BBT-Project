import "dotenv/config";
import { db } from "@/lib/prisma";

async function checkAssignedToRaw() {
  try {
    const result = await db.query(
      `SELECT
         "assignedTo" as assigned_to,
         LENGTH(COALESCE("assignedTo", ''))::int as len,
         COUNT(*)::int as count
       FROM defect
       GROUP BY assigned_to, len
       ORDER BY count DESC, assigned_to`
    );

    console.log("Assigned To raw values:");
    console.table(result.rows);

    const trimmed = await db.query(
      `SELECT
         TRIM(COALESCE("assignedTo", '')) as assigned_to_trimmed,
         COUNT(*)::int as count
       FROM defect
       GROUP BY assigned_to_trimmed
       ORDER BY count DESC, assigned_to_trimmed`
    );

    console.log("Assigned To trimmed values:");
    console.table(trimmed.rows);
  } catch (error) {
    console.error("Error:", error);
  }
}

checkAssignedToRaw();
