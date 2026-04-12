import { config } from "dotenv";
import { randomBytes, randomUUID, scryptSync } from "crypto";
import { MongoClient } from "mongodb";

config({ path: ".env.local" });

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || "sheet-webapp";

if (!uri) {
  throw new Error("MONGODB_URI is required. Set it in .env.local");
}

const mongoUri = uri;

const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
};

async function main() {
  const client = new MongoClient(mongoUri);
  await client.connect();

  try {
    const db = client.db(dbName);
    const users = db.collection("users");
    const sessions = db.collection("sessions");
    const defects = db.collection("defects");
    const testCycles = db.collection("test_cycles");
    const testCases = db.collection("test_cases");
    const testExecutions = db.collection("test_executions");
    const testCycleRuns = db.collection("test_cycle_runs");

    await Promise.all([
      defects.createIndex({ id: 1 }, { unique: true }),
      defects.createIndex({ dateReported: -1 }),
      defects.createIndex({ status: 1 }),
      defects.createIndex({ severity: 1 }),
      defects.createIndex({ module: 1 }),
      users.createIndex({ id: 1 }, { unique: true }),
      users.createIndex({ email: 1 }, { unique: true }),
      sessions.createIndex({ id: 1 }, { unique: true }),
      sessions.createIndex({ userId: 1 }),
      sessions.createIndex({ expiresAt: 1 }),
      testCycles.createIndex({ id: 1 }, { unique: true }),
      testCycles.createIndex({ createdAt: -1 }),
      testCases.createIndex({ id: 1 }, { unique: true }),
      testCases.createIndex({ cycleId: 1, testCaseId: 1 }, { unique: true }),
      testExecutions.createIndex({ id: 1 }, { unique: true }),
      testExecutions.createIndex(
        { cycleId: 1, testCaseId: 1 },
        { unique: true },
      ),
      testCycleRuns.createIndex({ id: 1 }, { unique: true }),
      testCycleRuns.createIndex({ cycleId: 1, createdAt: -1 }),
    ]);

    const adminEmail = "ssarthakxd@gmail.com";
    const adminPassword = "Admin@123456";
    const now = new Date();

    let admin = (await users.findOne({ email: adminEmail })) as {
      id: string;
      name: string;
      email: string;
    } | null;
    if (!admin) {
      const userId = randomUUID();
      await users.insertOne({
        id: userId,
        name: "Super Admin",
        email: adminEmail,
        phone: "9800000000",
        password_hash: hashPassword(adminPassword),
        role: "super_admin",
        createdAt: now,
        updatedAt: now,
      });
      admin = { id: userId, name: "Super Admin", email: adminEmail };
    }

    const existingCount = await defects.countDocuments({});
    if (existingCount < 20) {
      const modules = [
        "HSA - Mock Exam",
        "KFQ - Dashboard",
        "GMST - Auth",
        "NMST - Reports",
        "Innovatetech - Profile",
      ];
      const severities = ["MAJOR", "HIGH", "MEDIUM", "LOW"] as const;
      const statuses = [
        "OPEN",
        "IN_PROGRESS",
        "ON_HOLD",
        "CLOSED",
        "AS_IT_IS",
      ] as const;
      const qcStatuses = ["PENDING", "FAILED", "PASSED", "REJECTED"] as const;

      const docs = Array.from({ length: 30 }).map((_, i) => {
        const reported = new Date();
        reported.setDate(reported.getDate() - (i % 20));

        const status = statuses[i % statuses.length];
        const dateFixed =
          status === "CLOSED" || status === "AS_IT_IS"
            ? new Date(reported.getTime() + (2 + (i % 6)) * 24 * 60 * 60 * 1000)
            : null;

        return {
          id: randomUUID(),
          testCaseId: `TC-${1000 + i}`,
          dateReported: reported,
          module: modules[i % modules.length],
          summary: `Seeded defect ${i + 1}`,
          expectedResult: `Expected result ${i + 1}`,
          actualResult: `Actual result ${i + 1}`,
          severity: severities[i % severities.length],
          priority: ["P1", "P2", "P3"][i % 3],
          assignedTo: ["Aavash", "Sarthak", "QA Team", null][i % 4],
          status,
          dateFixed,
          qcStatusBbt: qcStatuses[i % qcStatuses.length],
          sourceFile: "seed-dataset.csv",
          uploadedBy: "seed-script",
          createdAt: now,
        };
      });

      await defects.insertMany(docs);
    }

    const cycleSeedName = "April 2026 Regression Cycle";
    let cycle: { id: string; name: string } | null = await testCycles.findOne<{
      id: string;
      name: string;
    }>({ name: cycleSeedName }, { projection: { _id: 0, id: 1, name: 1 } });

    if (!cycle) {
      const cycleId = randomUUID();
      await testCycles.insertOne({
        id: cycleId,
        name: cycleSeedName,
        description: "Seeded cycle for API validation",
        createdAt: now,
        updatedAt: now,
      });
      cycle = { id: cycleId, name: cycleSeedName };
    }

    const existingCycleCaseCount = await testCases.countDocuments({
      cycleId: cycle.id,
    });
    if (existingCycleCaseCount < 6) {
      const seededTestCases = Array.from({ length: 8 }).map((_, i) => {
        const tcNumber = 2001 + i;
        return {
          id: randomUUID(),
          testCaseId: `TC-${tcNumber}`,
          title: `Seeded test case ${tcNumber}`,
          steps: `1. Open module ${i + 1}\n2. Perform action ${i + 1}\n3. Validate output`,
          expectedResult: `Feature ${i + 1} behaves as expected`,
          cycleId: cycle.id,
          createdAt: now,
        };
      });

      await testCases.insertMany(seededTestCases);

      const seededExecutions = seededTestCases.slice(0, 6).map((tc, i) => ({
        id: randomUUID(),
        cycleId: cycle.id,
        testCaseId: tc.id,
        status: (i % 3 === 0 ? "FAIL" : i % 2 === 0 ? "PASS" : "NOT_RUN") as
          | "FAIL"
          | "PASS"
          | "NOT_RUN",
        remarks: i % 3 === 0 ? `Seed failure for ${tc.testCaseId}` : "",
        severity: i % 3 === 0 ? "HIGH" : null,
        executedBy: admin.id,
        executedOn: new Date(now.getTime() - i * 60 * 60 * 1000),
        createdAt: now,
        updatedAt: now,
      }));

      await testExecutions.insertMany(seededExecutions);

      const executionModule = `Test Execution - ${cycle.name}`;
      const openFailureCases = seededTestCases.filter((_, i) => i % 3 === 0);

      const existingExecutionDefects = await defects.countDocuments({
        module: executionModule,
      });
      if (existingExecutionDefects === 0) {
        await defects.insertMany(
          openFailureCases.map((tc, i) => ({
            id: randomUUID(),
            testCaseId: tc.testCaseId,
            dateReported: new Date(now.getTime() - i * 24 * 60 * 60 * 1000),
            module: executionModule,
            summary: `Execution issue in ${tc.testCaseId}`,
            expectedResult: tc.expectedResult,
            actualResult: `Observed mismatch in seeded flow for ${tc.testCaseId}`,
            severity: i % 2 === 0 ? "HIGH" : "MEDIUM",
            priority: i % 2 === 0 ? "P1" : "P2",
            assignedTo: "QA Team",
            status: "OPEN",
            dateFixed: null,
            qcStatusBbt: "FAILED",
            sourceFile: "seed-test-execution",
            uploadedBy: "seed-script",
            createdAt: now,
          })),
        );
      }
    }

    const sessionId = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await sessions.insertOne({
      id: sessionId,
      userId: admin.id,
      expiresAt,
    });

    console.log("✅ MongoDB seeded successfully");
    console.log(`DB: ${dbName}`);
    console.log(`Admin email: ${adminEmail}`);
    console.log(`Admin password: ${adminPassword}`);
    console.log(`Session cookie: bbt_session=${sessionId}`);
    console.log(`Seeded test cycle: ${cycleSeedName}`);
    console.log("\nUse this for authenticated curl requests:");
    console.log(`-H 'Cookie: bbt_session=${sessionId}'`);
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
