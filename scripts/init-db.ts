import "dotenv/config";
import { db } from "@/lib/prisma";

async function initializeDatabase() {
    try {
        console.log("Creating defect table...");

        await db.query(`
            CREATE TABLE IF NOT EXISTS defect (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "dateReported" DATE NOT NULL,
                module VARCHAR(255) NOT NULL,
                "expectedResult" TEXT NOT NULL,
                "actualResult" TEXT NOT NULL,
                severity VARCHAR(50) NOT NULL CHECK (severity IN ('MAJOR', 'HIGH', 'MEDIUM', 'LOW')),
                priority VARCHAR(100) NOT NULL,
                status VARCHAR(50) NOT NULL CHECK (status IN ('OPEN', 'IN_PROGRESS', 'CLOSED', 'ON_HOLD', 'AS_IT_IS')),
                "dateFixed" DATE,
                "qcStatusBbt" VARCHAR(50) NOT NULL CHECK ("qcStatusBbt" IN ('PASSED', 'FAILED', 'PENDING', 'REJECTED')),
                "createdAt" TIMESTAMP DEFAULT NOW()
            )
        `);

        console.log("Creating indexes...");

        await db.query(`CREATE INDEX IF NOT EXISTS idx_defect_dateReported ON defect("dateReported")`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_defect_module ON defect(module)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_defect_severity ON defect(severity)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_defect_status ON defect(status)`);

        // Ensure the status check constraint allows the new AS_IT_IS value
        // Drop and recreate the constraint to match the latest enum set
        await db.query(`ALTER TABLE defect DROP CONSTRAINT IF EXISTS defect_status_check`);
        await db.query(`ALTER TABLE defect ADD CONSTRAINT defect_status_check CHECK (status IN ('OPEN', 'IN_PROGRESS', 'CLOSED', 'ON_HOLD', 'AS_IT_IS'))`);

        console.log("✅ Database initialized successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error initializing database:", error);
        process.exit(1);
    }
}

initializeDatabase();
