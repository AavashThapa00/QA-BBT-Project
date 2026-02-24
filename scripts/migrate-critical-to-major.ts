import "dotenv/config";
import { db } from "@/lib/prisma";

async function updateConstraintAndMigrate() {
    try {
        console.log("Updating severity constraint and migrating data...");

        // Try to drop the old constraint if it exists
        try {
            await db.query(
                `ALTER TABLE defect DROP CONSTRAINT defect_severity_check`
            );
            console.log("✅ Dropped old severity constraint");
        } catch (e) {
            console.log("ℹ️  Old constraint doesn't exist, skipping drop");
        }

        // Update CRITICAL values to MAJOR first
        const result = await db.query(
            `UPDATE defect SET severity = $1 WHERE severity = $2`,
            ["MAJOR", "CRITICAL"]
        );
        console.log(`✅ Updated ${result.rowCount} row(s) from CRITICAL to MAJOR`);

        // Add new constraint with MAJOR instead of CRITICAL
        try {
            await db.query(
                `ALTER TABLE defect ADD CONSTRAINT defect_severity_check CHECK (severity IN ('MAJOR', 'HIGH', 'MEDIUM', 'LOW'))`
            );
            console.log("✅ Added new severity constraint with MAJOR");
        } catch (e) {
            console.log("ℹ️  Constraint already exists, skipping add");
        }

        console.log("✅ Migration completed successfully!");
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
}

updateConstraintAndMigrate();
