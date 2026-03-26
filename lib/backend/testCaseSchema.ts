import { db } from "@/lib/prisma";

let schemaReady = false;

export async function ensureTestCaseSchema() {
  if (schemaReady) {
    return;
  }

  await db.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TestExecutionStatus') THEN
        CREATE TYPE "TestExecutionStatus" AS ENUM ('NOT_RUN', 'PASS', 'FAIL');
      END IF;
    END
    $$;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS test_cycle (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS test_case (
      id TEXT PRIMARY KEY,
      "testCaseId" TEXT NOT NULL,
      title TEXT NOT NULL,
      steps TEXT NOT NULL,
      "expectedResult" TEXT,
      "cycleId" TEXT NOT NULL REFERENCES test_cycle(id) ON DELETE CASCADE,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT test_case_cycle_id UNIQUE ("cycleId", "testCaseId")
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS test_execution (
      id TEXT PRIMARY KEY,
      "cycleId" TEXT NOT NULL REFERENCES test_cycle(id) ON DELETE CASCADE,
      "testCaseId" TEXT NOT NULL REFERENCES test_case(id) ON DELETE CASCADE,
      status "TestExecutionStatus" NOT NULL DEFAULT 'NOT_RUN',
      remarks TEXT,
      severity TEXT,
      "executedBy" TEXT,
      "executedOn" TIMESTAMP,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT test_execution_cycle_case UNIQUE ("cycleId", "testCaseId")
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS test_cycle_run (
      id TEXT PRIMARY KEY,
      "cycleId" TEXT NOT NULL REFERENCES test_cycle(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      data JSONB NOT NULL,
      "createdBy" TEXT,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await db.query(`CREATE INDEX IF NOT EXISTS idx_test_case_cycle_id ON test_case ("cycleId");`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_test_execution_cycle_id ON test_execution ("cycleId");`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_test_cycle_run_cycle_id ON test_cycle_run ("cycleId");`);

  schemaReady = true;
}