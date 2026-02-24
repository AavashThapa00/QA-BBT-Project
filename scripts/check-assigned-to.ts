import "dotenv/config";
import { db } from "@/lib/prisma";

async function checkAssignedTo() {
  try {
    const total = await db.query(`SELECT COUNT(*)::int as count FROM defect`);
    const assigned = await db.query(
      `SELECT COALESCE("assignedTo", 'UNASSIGNED') as assigned_to, COUNT(*)::int as count
       FROM defect
       GROUP BY assigned_to
       ORDER BY count DESC`
    );
    const pendingUnassigned = await db.query(
      `SELECT COUNT(*)::int as count
       FROM defect
       WHERE ("assignedTo" IS NULL OR "assignedTo" = '')
         AND status IN ('OPEN', 'IN_PROGRESS', 'ON_HOLD')`
    );

    console.log("Total defects:", total.rows[0]?.count ?? 0);
    console.log("Assigned To breakdown:");
    console.table(assigned.rows);
    console.log("Pending + unassigned:", pendingUnassigned.rows[0]?.count ?? 0);
  } catch (error) {
    console.error("Error:", error);
  }
}

checkAssignedTo();
