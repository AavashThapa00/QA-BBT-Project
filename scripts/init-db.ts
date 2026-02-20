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
                severity VARCHAR(50) NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
                priority VARCHAR(100) NOT NULL,
                status VARCHAR(50) NOT NULL CHECK (status IN ('OPEN', 'IN_PROGRESS', 'CLOSED', 'ON_HOLD')),
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

        console.log("✅ Database initialized successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error initializing database:", error);
        process.exit(1);
    }
}

initializeDatabase();
