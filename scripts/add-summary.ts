import "dotenv/config";
import { db } from "@/lib/prisma";

async function addSummaryColumn() {
    try {
        console.log("Adding summary column to defect table...");

        await db.query(`
            ALTER TABLE defect 
            ADD COLUMN IF NOT EXISTS summary TEXT
        `);

        console.log("✅ Summary column added successfully!");
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
}

addSummaryColumn();
