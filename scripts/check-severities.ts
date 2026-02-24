import "dotenv/config";
import { db } from "@/lib/prisma";

async function checkData() {
    try {
        // Check distinct severity values
        const severityResult = await db.query(
            `SELECT DISTINCT severity, COUNT(*) as count FROM defect GROUP BY severity ORDER BY count DESC`
        );
        console.log("\n=== Severity values in database ===");
        severityResult.rows.forEach((row: any) => {
            console.log(`  ${row.severity}: ${row.count} defect(s)`);
        });

        // Check total defect count
        const totalResult = await db.query(`SELECT COUNT(*) as count FROM defect`);
        console.log(`\nTotal defects: ${totalResult.rows[0]?.count || 0}`);

        // Sample a few defects
        const sample = await db.query(
            `SELECT id, module, severity, priority FROM defect LIMIT 5`
        );
        console.log("\n=== Sample defects ===");
        sample.rows.forEach((row: any) => {
            console.log(`  ID: ${row.id.substring(0, 8)}... | Module: ${row.module} | Severity: ${row.severity} | Priority: ${row.priority}`);
        });
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

checkData();
