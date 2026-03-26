import { randomUUID } from "crypto";
import { db } from "@/lib/prisma";
import { ensureTestCaseSchema } from "@/lib/backend/testCaseSchema";

export async function getTestCyclesForApi() {
  try {
    await ensureTestCaseSchema();

    const result = await db.query(
      `SELECT id, name, description, "createdAt"
       FROM test_cycle
       ORDER BY "createdAt" DESC`
    );

    return result.rows;
  } catch (error) {
    console.error("[API] Failed to fetch test cycles", error);
    throw error;
  }
}

export async function getTestCasesForCycleForApi(cycleId: string) {
  try {
    await ensureTestCaseSchema();

    const result = await db.query(
      `SELECT id, "testCaseId", title, steps, "expectedResult", "cycleId", "createdAt"
       FROM test_case
       WHERE "cycleId" = $1
       ORDER BY "testCaseId" ASC`,
      [cycleId]
    );

    return result.rows;
  } catch (error) {
    console.error("[API] Failed to fetch test cases for cycle", error);
    throw error;
  }
}

export async function getTestExecutionsForCycleForApi(cycleId: string) {
  try {
    await ensureTestCaseSchema();

    const result = await db.query(
      `SELECT te.id, te."cycleId", te."testCaseId", te.status, te.remarks, te.severity, te."executedOn",
              tc."testCaseId", tc.title, tc.steps, tc."expectedResult"
       FROM test_execution te
       JOIN test_case tc ON tc.id = te."testCaseId"
       WHERE te."cycleId" = $1
       ORDER BY tc."testCaseId" ASC`,
      [cycleId]
    );

    return result.rows;
  } catch (error) {
    console.error("[API] Failed to fetch test executions", error);
    throw error;
  }
}

export interface SaveTestExecutionPayload {
  cycleId: string;
  testCaseId: string;
  status: "NOT_RUN" | "PASS" | "FAIL";
  remarks?: string | null;
  severity?: "MAJOR" | "HIGH" | "MEDIUM" | "LOW" | null;
  executedBy?: string | null;
}

export async function saveTestExecutionForApi(payload: SaveTestExecutionPayload) {
  try {
    await ensureTestCaseSchema();

    const id = randomUUID();

    await db.query(`BEGIN`);

    // Check if execution already exists
    const existingResult = await db.query(
      `SELECT id FROM test_execution WHERE "cycleId" = $1 AND "testCaseId" = $2`,
      [payload.cycleId, payload.testCaseId]
    );

    if (existingResult.rows.length > 0) {
      // Update existing execution
      await db.query(
        `UPDATE test_execution
         SET status = $1, remarks = $2, severity = $3, "executedOn" = NOW(), "executedBy" = $4
         WHERE "cycleId" = $5 AND "testCaseId" = $6`,
        [
          payload.status,
          payload.remarks ?? null,
          payload.severity ?? null,
          payload.executedBy ?? null,
          payload.cycleId,
          payload.testCaseId,
        ]
      );
    } else {
      // Insert new execution
      await db.query(
        `INSERT INTO test_execution (id, "cycleId", "testCaseId", status, remarks, severity, "executedBy", "executedOn")
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          id,
          payload.cycleId,
          payload.testCaseId,
          payload.status,
          payload.remarks ?? null,
          payload.severity ?? null,
          payload.executedBy ?? null,
        ]
      );
    }

    await db.query(`COMMIT`);

    return {
      success: true,
      message: "Test execution saved successfully",
    };
  } catch (error) {
    await db.query(`ROLLBACK`).catch(() => undefined);
    console.error("[API] Failed to save test execution", error);
    throw error;
  }
}

export interface CreateTestCaseDefectPayload {
  testCaseId: string;
  cycleId: string;
  title: string;
  description: string;
  expectedResult: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "MAJOR";
  severity: "MAJOR" | "HIGH" | "MEDIUM" | "LOW";
}

async function getTestCaseContext(testCaseRowId: string, cycleId: string) {
  const contextResult = await db.query(
    `SELECT tc."testCaseId" AS "businessTestCaseId", tc.title, tc."expectedResult", c.name AS "cycleName"
     FROM test_case tc
     JOIN test_cycle c ON c.id = tc."cycleId"
     WHERE tc.id = $1 AND tc."cycleId" = $2
     LIMIT 1`,
    [testCaseRowId, cycleId]
  );

  if (contextResult.rows.length === 0) {
    throw new Error("Test case context not found for defect logging");
  }

  return contextResult.rows[0] as {
    businessTestCaseId: string;
    title: string;
    expectedResult: string | null;
    cycleName: string;
  };
}

function getExecutionModule(cycleName: string) {
  return `Test Execution - ${cycleName}`;
}

export async function closeResolvedTestCaseDefectsForApi(payload: { testCaseId: string; cycleId: string }) {
  try {
    await ensureTestCaseSchema();

    const context = await getTestCaseContext(payload.testCaseId, payload.cycleId);
    const moduleName = getExecutionModule(context.cycleName);
    const today = new Date().toISOString().split("T")[0];

    await db.query(
      `UPDATE defect
       SET status = 'CLOSED', "qcStatusBbt" = 'PASSED', "dateFixed" = $1
       WHERE "testCaseId" = $2
         AND module = $3
         AND status IN ('OPEN', 'IN_PROGRESS', 'ON_HOLD')`,
      [today, context.businessTestCaseId, moduleName]
    );

    return { success: true };
  } catch (error) {
    console.error("[API] Failed to close resolved test case defects", error);
    throw error;
  }
}

export async function createTestCaseDefectForApi(payload: CreateTestCaseDefectPayload) {
  try {
    await ensureTestCaseSchema();

    const context = await getTestCaseContext(payload.testCaseId, payload.cycleId);
    const moduleName = getExecutionModule(context.cycleName);
    const today = new Date().toISOString().split("T")[0];

    const existingOpenDefect = await db.query(
      `SELECT id
       FROM defect
       WHERE "testCaseId" = $1
         AND module = $2
         AND status IN ('OPEN', 'IN_PROGRESS', 'ON_HOLD')
       ORDER BY "createdAt" DESC
       LIMIT 1`,
      [context.businessTestCaseId, moduleName]
    );

    if (existingOpenDefect.rows.length > 0) {
      const defectId = existingOpenDefect.rows[0].id;
      const result = await db.query(
        `UPDATE defect
         SET summary = $1,
             "actualResult" = $2,
             severity = $3,
             priority = $4,
             status = 'OPEN',
             "qcStatusBbt" = 'FAILED',
             "dateReported" = $5
         WHERE id = $6
         RETURNING *`,
        [
          payload.title,
          payload.description,
          payload.severity,
          payload.priority,
          today,
          defectId,
        ]
      );

      return result.rows[0];
    }

    const id = randomUUID();

    const result = await db.query(
      `INSERT INTO defect (
        id,
        "testCaseId",
        "dateReported",
        module,
        summary,
        "expectedResult",
        "actualResult",
        severity,
        priority,
        status,
        "qcStatusBbt",
        "createdAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()
      )
      RETURNING *`,
      [
        id,
        context.businessTestCaseId,
        today,
        moduleName,
        payload.title,
        payload.expectedResult || context.expectedResult || "",
        payload.description,
        payload.severity,
        payload.priority,
        "OPEN",
        "PENDING",
      ]
    );

    return result.rows[0];
  } catch (error) {
    console.error("[API] Failed to create defect from test case", error);
    throw error;
  }
}

export interface CreateTestCycleRunPayload {
  cycleId: string;
  name: string;
  createdBy?: string | null;
}

export async function listTestCycleRunsForApi(cycleId: string) {
  await ensureTestCaseSchema();

  const result = await db.query(
    `SELECT id, "cycleId", name, "createdBy", "createdAt"
     FROM test_cycle_run
     WHERE "cycleId" = $1
     ORDER BY "createdAt" DESC`,
    [cycleId]
  );

  return result.rows;
}

export async function getTestCycleRunForApi(cycleId: string, runId: string) {
  await ensureTestCaseSchema();

  const result = await db.query(
    `SELECT id, "cycleId", name, data, "createdBy", "createdAt"
     FROM test_cycle_run
     WHERE id = $1 AND "cycleId" = $2
     LIMIT 1`,
    [runId, cycleId]
  );

  return result.rows[0] ?? null;
}

export async function createTestCycleRunForApi(payload: CreateTestCycleRunPayload) {
  await ensureTestCaseSchema();

  const cycleResult = await db.query(
    `SELECT id, name FROM test_cycle WHERE id = $1 LIMIT 1`,
    [payload.cycleId]
  );

  if (cycleResult.rows.length === 0) {
    throw new Error("Test cycle not found");
  }

  const cycle = cycleResult.rows[0] as { id: string; name: string };

  const executionResult = await db.query(
    `SELECT tc."testCaseId", tc.title, tc.steps, tc."expectedResult",
            te.status, te.remarks, te.severity, te."executedOn"
     FROM test_case tc
     LEFT JOIN test_execution te
       ON te."testCaseId" = tc.id AND te."cycleId" = tc."cycleId"
     WHERE tc."cycleId" = $1
     ORDER BY tc."testCaseId" ASC`,
    [payload.cycleId]
  );

  const failedIssueResult = await db.query(
    `SELECT id, "testCaseId", module, summary, "expectedResult", "actualResult",
            severity, priority, status, "dateReported", "dateFixed"
     FROM defect
     WHERE module = $1
       AND "testCaseId" IS NOT NULL
     ORDER BY "dateReported" DESC NULLS LAST, "createdAt" DESC`,
    [getExecutionModule(cycle.name)]
  );

  const summary = {
    total: executionResult.rows.length,
    pass: executionResult.rows.filter((r) => r.status === "PASS").length,
    fail: executionResult.rows.filter((r) => r.status === "FAIL").length,
    notRun: executionResult.rows.filter((r) => !r.status || r.status === "NOT_RUN").length,
  };

  const snapshot = {
    cycle: {
      id: cycle.id,
      name: cycle.name,
    },
    summary,
    executions: executionResult.rows,
    failedIssues: failedIssueResult.rows,
  };

  const id = randomUUID();
  const result = await db.query(
    `INSERT INTO test_cycle_run (id, "cycleId", name, data, "createdBy", "createdAt")
     VALUES ($1, $2, $3, $4::jsonb, $5, NOW())
     RETURNING id, "cycleId", name, "createdBy", "createdAt"`,
    [id, payload.cycleId, payload.name, JSON.stringify(snapshot), payload.createdBy ?? null]
  );

  return result.rows[0];
}
