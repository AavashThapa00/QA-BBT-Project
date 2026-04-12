import { randomUUID } from "crypto";
import { Collection } from "mongodb";
import { mongoCollections } from "@/lib/mongodb";

type TestCycleDoc = {
  id: string;
  name: string;
  kind?: "folder" | "cycle";
  parentId?: string | null;
  description?: string | null;
  createdAt: Date;
  updatedAt?: Date;
};

type TestCaseDoc = {
  id: string;
  testCaseId: string;
  moduleName?: string | null;
  title: string;
  steps: string;
  sectionName?: string | null;
  expectedResult?: string | null;
  cycleId: string;
  createdAt: Date;
};

type TestExecutionDoc = {
  id: string;
  cycleId: string;
  testCaseId: string;
  status: "NOT_RUN" | "PASS" | "FAIL";
  remarks?: string | null;
  severity?: "MAJOR" | "HIGH" | "MEDIUM" | "LOW" | null;
  executedBy?: string | null;
  executedOn?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
};

type TestCycleRunDoc = {
  id: string;
  cycleId: string;
  name: string;
  data: unknown;
  createdBy?: string | null;
  createdAt: Date;
};

type DefectDoc = {
  id: string;
  testCaseId?: string | null;
  module: string;
  summary?: string | null;
  expectedResult?: string | null;
  actualResult?: string | null;
  severity: string;
  priority: string;
  status: string;
  dateReported?: Date | null;
  dateFixed?: Date | null;
  qcStatusBbt?: string | null;
  createdAt?: Date;
};

const getTestCyclesCollection = async () =>
  (await mongoCollections.testCycles()) as unknown as Collection<TestCycleDoc>;
const getTestCasesCollection = async () =>
  (await mongoCollections.testCases()) as unknown as Collection<TestCaseDoc>;
const getTestExecutionsCollection = async () =>
  (await mongoCollections.testExecutions()) as unknown as Collection<TestExecutionDoc>;
const getTestCycleRunsCollection = async () =>
  (await mongoCollections.testCycleRuns()) as unknown as Collection<TestCycleRunDoc>;
const getDefectsCollection = async () =>
  (await mongoCollections.defects()) as unknown as Collection<DefectDoc>;

let initialized = false;

async function ensureTestCaseCollections() {
  if (initialized) return;

  const [testCycles, testCases, testExecutions, testCycleRuns] =
    await Promise.all([
      getTestCyclesCollection(),
      getTestCasesCollection(),
      getTestExecutionsCollection(),
      getTestCycleRunsCollection(),
    ]);

  await Promise.all([
    testCycles.createIndex({ id: 1 }, { unique: true }),
    testCycles.createIndex({ parentId: 1, createdAt: -1 }),
    testCycles.createIndex({ kind: 1, createdAt: -1 }),
    testCycles.createIndex({ createdAt: -1 }),
    testCases.createIndex({ id: 1 }, { unique: true }),
    testCases.createIndex({ cycleId: 1, testCaseId: 1 }, { unique: true }),
    testCases.createIndex({
      cycleId: 1,
      moduleName: 1,
      sectionName: 1,
      testCaseId: 1,
    }),
    testCases.createIndex({ cycleId: 1, sectionName: 1, testCaseId: 1 }),
    testExecutions.createIndex({ id: 1 }, { unique: true }),
    testExecutions.createIndex({ cycleId: 1, testCaseId: 1 }, { unique: true }),
    testCycleRuns.createIndex({ id: 1 }, { unique: true }),
    testCycleRuns.createIndex({ cycleId: 1, createdAt: -1 }),
  ]);

  initialized = true;
}

export async function getTestCyclesForApi() {
  try {
    await ensureTestCaseCollections();
    const testCycles = await getTestCyclesCollection();

    return await testCycles
      .find(
        {},
        {
          projection: {
            _id: 0,
            id: 1,
            name: 1,
            kind: 1,
            parentId: 1,
            description: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      )
      .sort({ createdAt: -1 })
      .toArray();
  } catch (error) {
    console.error("[API] Failed to fetch test cycles", error);
    throw error;
  }
}

export interface CreateTestCycleNodePayload {
  name: string;
  kind: "folder" | "cycle";
  parentId?: string | null;
  description?: string | null;
}

export async function createTestCycleNodeForApi(
  payload: CreateTestCycleNodePayload,
) {
  await ensureTestCaseCollections();
  const testCycles = await getTestCyclesCollection();

  const parentId = payload.parentId ?? null;

  if (parentId) {
    const parent = await testCycles.findOne(
      { id: parentId },
      { projection: { _id: 0, id: 1, kind: 1 } },
    );

    if (!parent) {
      throw new Error("Parent folder not found");
    }

    const parentKind = parent.kind ?? "cycle";
    const isValidParentForFolder =
      payload.kind === "folder" &&
      (parentKind === "folder" || parentKind === "cycle");
    const isValidParentForCycle =
      payload.kind === "cycle" && parentKind === "folder";

    if (!isValidParentForFolder && !isValidParentForCycle) {
      throw new Error(
        payload.kind === "cycle"
          ? "Child test cycle must be created under a folder"
          : "Testing scope folder must be created under a folder or child cycle",
      );
    }
  }

  const normalizedName = payload.name.trim();
  if (!normalizedName) {
    throw new Error("Name is required");
  }

  const duplicate = await testCycles.findOne(
    {
      name: normalizedName,
      kind: payload.kind,
      parentId,
    },
    { projection: { _id: 0, id: 1 } },
  );

  if (duplicate) {
    throw new Error("A node with the same name already exists in this folder");
  }

  const node: TestCycleDoc = {
    id: randomUUID(),
    name: normalizedName,
    kind: payload.kind,
    parentId,
    description: payload.description ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await testCycles.insertOne(node);

  if (payload.kind === "cycle") {
    const testCases = await getTestCasesCollection();

    const siblingCycles = await testCycles
      .find(
        {
          kind: "cycle",
          parentId,
          id: { $ne: node.id },
        },
        {
          projection: { _id: 0, id: 1, createdAt: 1 },
        },
      )
      .sort({ createdAt: -1 })
      .toArray();

    const siblingIds = siblingCycles.map((c) => c.id);
    const caseCounts =
      siblingIds.length > 0
        ? await testCases
            .aggregate<{
              _id: string;
              count: number;
            }>([
              { $match: { cycleId: { $in: siblingIds } } },
              { $group: { _id: "$cycleId", count: { $sum: 1 } } },
            ])
            .toArray()
        : [];

    const countMap = new Map(caseCounts.map((row) => [row._id, row.count]));
    const sourceCycle = siblingCycles.slice().sort((a, b) => {
      const aCount = countMap.get(a.id) ?? 0;
      const bCount = countMap.get(b.id) ?? 0;
      if (aCount !== bCount) return bCount - aCount;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })[0];

    if (sourceCycle) {
      const sourceCases = await testCases
        .find(
          { cycleId: sourceCycle.id },
          {
            projection: {
              _id: 0,
              testCaseId: 1,
              moduleName: 1,
              sectionName: 1,
              title: 1,
              steps: 1,
              expectedResult: 1,
            },
          },
        )
        .sort({ moduleName: 1, sectionName: 1, testCaseId: 1 })
        .toArray();

      const sourceScopes = await testCycles
        .find(
          {
            kind: "folder",
            parentId: sourceCycle.id,
          },
          {
            projection: {
              _id: 0,
              name: 1,
              description: 1,
            },
          },
        )
        .sort({ createdAt: 1 })
        .toArray();

      const fallbackScopeNames = Array.from(
        new Set(
          sourceCases.map((tc) => (tc.moduleName || "").trim()).filter(Boolean),
        ),
      );

      const scopesToClone =
        sourceScopes.length > 0
          ? sourceScopes.map((scope) => ({
              name: scope.name,
              description: scope.description ?? null,
            }))
          : fallbackScopeNames.map((name) => ({
              name,
              description: null,
            }));

      if (scopesToClone.length > 0) {
        await testCycles.insertMany(
          scopesToClone.map((scope) => ({
            id: randomUUID(),
            name: scope.name,
            kind: "folder" as const,
            parentId: node.id,
            description: scope.description ?? null,
            createdAt: new Date(),
            updatedAt: new Date(),
          })),
        );
      }

      if (sourceCases.length > 0) {
        await testCases.insertMany(
          sourceCases.map((tc) => ({
            id: randomUUID(),
            cycleId: node.id,
            testCaseId: tc.testCaseId,
            moduleName: tc.moduleName ?? null,
            sectionName: tc.sectionName ?? null,
            title: tc.title,
            steps: tc.steps,
            expectedResult: tc.expectedResult ?? null,
            createdAt: new Date(),
          })),
        );
      }
    }
  }

  return {
    id: node.id,
    name: node.name,
    kind: node.kind,
    parentId: node.parentId,
    description: node.description,
    createdAt: node.createdAt,
    updatedAt: node.updatedAt,
  };
}

export async function getTestCasesForCycleForApi(cycleId: string) {
  try {
    await ensureTestCaseCollections();
    const testCases = await getTestCasesCollection();

    return await testCases
      .find(
        { cycleId },
        {
          projection: {
            _id: 0,
            id: 1,
            testCaseId: 1,
            moduleName: 1,
            title: 1,
            steps: 1,
            sectionName: 1,
            expectedResult: 1,
            cycleId: 1,
            createdAt: 1,
          },
        },
      )
      .sort({ moduleName: 1, sectionName: 1, testCaseId: 1 })
      .toArray();
  } catch (error) {
    console.error("[API] Failed to fetch test cases for cycle", error);
    throw error;
  }
}

export interface CreateTestCasePayload {
  cycleId: string;
  testCaseId?: string | null;
  moduleName?: string | null;
  title: string;
  steps: string;
  sectionName?: string | null;
  expectedResult?: string | null;
}

export async function createTestCaseForApi(payload: CreateTestCasePayload) {
  await ensureTestCaseCollections();

  const [testCycles, testCases] = await Promise.all([
    getTestCyclesCollection(),
    getTestCasesCollection(),
  ]);

  const cycle = await testCycles.findOne(
    { id: payload.cycleId },
    { projection: { _id: 0, id: 1, kind: 1, parentId: 1 } },
  );

  if (!cycle) {
    throw new Error("Test cycle not found");
  }

  if ((cycle.kind ?? "cycle") !== "cycle") {
    throw new Error("Test cases can only be added to a child test cycle");
  }

  const normalizedModule = payload.moduleName?.trim() || "General";
  const normalizedTitle = payload.title.trim();
  const normalizedSteps = payload.steps.trim();
  const normalizedSection = payload.sectionName?.trim() || null;
  const normalizedExpectedResult = payload.expectedResult?.trim() || null;

  if (!normalizedTitle || !normalizedSteps) {
    throw new Error("Title and Steps are required");
  }

  let normalizedTestCaseId = payload.testCaseId?.trim() || "";

  const siblingCycles = await testCycles
    .find(
      {
        kind: "cycle",
        parentId: cycle.parentId ?? null,
      },
      {
        projection: { _id: 0, id: 1 },
      },
    )
    .toArray();

  const targetCycleIds =
    siblingCycles.length > 0
      ? siblingCycles.map((row) => row.id)
      : [payload.cycleId];

  if (!normalizedTestCaseId) {
    const ids = await testCases
      .find(
        { cycleId: { $in: targetCycleIds } },
        { projection: { _id: 0, testCaseId: 1 } },
      )
      .toArray();

    const max = ids.reduce((acc, row) => {
      const match = String(row.testCaseId || "").match(/TC-(\d+)/i);
      if (!match) return acc;
      const n = Number.parseInt(match[1], 10);
      return Number.isFinite(n) ? Math.max(acc, n) : acc;
    }, 0);

    normalizedTestCaseId = `TC-${String(max + 1).padStart(3, "0")}`;
  }

  const duplicate = await testCases.findOne(
    {
      cycleId: payload.cycleId,
      testCaseId: normalizedTestCaseId,
    },
    { projection: { _id: 0, id: 1 } },
  );

  if (duplicate) {
    throw new Error(
      "This Test Case ID already exists in the selected child cycle",
    );
  }

  const existingScopeRows = await testCycles
    .find(
      {
        kind: "folder",
        parentId: { $in: targetCycleIds },
        name: normalizedModule,
      },
      {
        projection: { _id: 0, parentId: 1 },
      },
    )
    .toArray();

  const scopedCycleIds = new Set(
    existingScopeRows
      .map((row) => row.parentId)
      .filter((id): id is string => Boolean(id)),
  );

  const missingScopeCycleIds = targetCycleIds.filter(
    (cycleId) => !scopedCycleIds.has(cycleId),
  );

  if (missingScopeCycleIds.length > 0) {
    await testCycles.insertMany(
      missingScopeCycleIds.map((cycleId) => ({
        id: randomUUID(),
        name: normalizedModule,
        kind: "folder" as const,
        parentId: cycleId,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    );
  }

  const existingRows = await testCases
    .find(
      {
        cycleId: { $in: targetCycleIds },
        testCaseId: normalizedTestCaseId,
      },
      {
        projection: { _id: 0, cycleId: 1 },
      },
    )
    .toArray();

  const existingCycleIds = new Set(existingRows.map((row) => row.cycleId));
  const docsToInsert: TestCaseDoc[] = targetCycleIds
    .filter((cycleId) => !existingCycleIds.has(cycleId))
    .map((cycleId) => ({
      id: randomUUID(),
      cycleId,
      testCaseId: normalizedTestCaseId,
      moduleName: normalizedModule,
      title: normalizedTitle,
      steps: normalizedSteps,
      sectionName: normalizedSection,
      expectedResult: normalizedExpectedResult,
      createdAt: new Date(),
    }));

  if (docsToInsert.length > 0) {
    await testCases.insertMany(docsToInsert);
  }

  const selectedCycleCase =
    docsToInsert.find((row) => row.cycleId === payload.cycleId) ||
    (await testCases.findOne(
      { cycleId: payload.cycleId, testCaseId: normalizedTestCaseId },
      {
        projection: {
          _id: 0,
          id: 1,
          cycleId: 1,
          testCaseId: 1,
          moduleName: 1,
          title: 1,
          steps: 1,
          sectionName: 1,
          expectedResult: 1,
          createdAt: 1,
        },
      },
    ));

  if (!selectedCycleCase) {
    throw new Error("Failed to create test case");
  }

  return {
    id: selectedCycleCase.id,
    cycleId: selectedCycleCase.cycleId,
    testCaseId: selectedCycleCase.testCaseId,
    moduleName: selectedCycleCase.moduleName,
    title: selectedCycleCase.title,
    steps: selectedCycleCase.steps,
    sectionName: selectedCycleCase.sectionName,
    expectedResult: selectedCycleCase.expectedResult,
    createdAt: selectedCycleCase.createdAt,
  };
}

export async function getTestExecutionsForCycleForApi(cycleId: string) {
  try {
    await ensureTestCaseCollections();

    const [testExecutions, testCases] = await Promise.all([
      getTestExecutionsCollection(),
      getTestCasesCollection(),
    ]);

    const [executionRows, testCaseRows] = await Promise.all([
      testExecutions
        .find(
          { cycleId },
          {
            projection: {
              _id: 0,
              id: 1,
              cycleId: 1,
              testCaseId: 1,
              status: 1,
              remarks: 1,
              severity: 1,
              executedOn: 1,
            },
          },
        )
        .toArray(),
      testCases
        .find(
          { cycleId },
          {
            projection: {
              _id: 0,
              id: 1,
              testCaseId: 1,
              moduleName: 1,
              title: 1,
              steps: 1,
              sectionName: 1,
              expectedResult: 1,
            },
          },
        )
        .toArray(),
    ]);

    const testCaseMap = new Map(testCaseRows.map((row) => [row.id, row]));

    return executionRows
      .map((execution) => {
        const testCase = testCaseMap.get(execution.testCaseId);
        return {
          ...execution,
          businessTestCaseId: testCase?.testCaseId ?? null,
          moduleName: testCase?.moduleName ?? null,
          title: testCase?.title ?? "",
          steps: testCase?.steps ?? "",
          sectionName: testCase?.sectionName ?? null,
          expectedResult: testCase?.expectedResult ?? "",
        };
      })
      .sort((a, b) =>
        String(a.businessTestCaseId ?? "").localeCompare(
          String(b.businessTestCaseId ?? ""),
        ),
      );
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

export async function saveTestExecutionForApi(
  payload: SaveTestExecutionPayload,
) {
  try {
    await ensureTestCaseCollections();
    const testExecutions = await getTestExecutionsCollection();

    await testExecutions.updateOne(
      { cycleId: payload.cycleId, testCaseId: payload.testCaseId },
      {
        $set: {
          status: payload.status,
          remarks: payload.remarks ?? null,
          severity: payload.severity ?? null,
          executedBy: payload.executedBy ?? null,
          executedOn: new Date(),
          updatedAt: new Date(),
        },
        $setOnInsert: {
          id: randomUUID(),
          cycleId: payload.cycleId,
          testCaseId: payload.testCaseId,
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );

    return {
      success: true,
      message: "Test execution saved successfully",
    };
  } catch (error) {
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
  const [testCases, testCycles] = await Promise.all([
    getTestCasesCollection(),
    getTestCyclesCollection(),
  ]);

  const [testCase, cycle] = await Promise.all([
    testCases.findOne(
      { id: testCaseRowId, cycleId },
      { projection: { _id: 0, testCaseId: 1, title: 1, expectedResult: 1 } },
    ),
    testCycles.findOne({ id: cycleId }, { projection: { _id: 0, name: 1 } }),
  ]);

  if (!testCase || !cycle) {
    throw new Error("Test case context not found for defect logging");
  }

  return {
    businessTestCaseId: testCase.testCaseId,
    title: testCase.title,
    expectedResult: testCase.expectedResult ?? null,
    cycleName: cycle.name,
  };
}

function getExecutionModule(cycleName: string) {
  return `Test Execution - ${cycleName}`;
}

export async function closeResolvedTestCaseDefectsForApi(payload: {
  testCaseId: string;
  cycleId: string;
}) {
  try {
    await ensureTestCaseCollections();
    const defects = await getDefectsCollection();

    const context = await getTestCaseContext(
      payload.testCaseId,
      payload.cycleId,
    );
    const moduleName = getExecutionModule(context.cycleName);
    const today = new Date();

    await defects.updateMany(
      {
        testCaseId: context.businessTestCaseId,
        module: moduleName,
        status: { $in: ["OPEN", "IN_PROGRESS", "ON_HOLD"] },
      },
      {
        $set: {
          status: "CLOSED",
          qcStatusBbt: "PASSED",
          dateFixed: today,
        },
      },
    );

    return { success: true };
  } catch (error) {
    console.error("[API] Failed to close resolved test case defects", error);
    throw error;
  }
}

export async function createTestCaseDefectForApi(
  payload: CreateTestCaseDefectPayload,
) {
  try {
    await ensureTestCaseCollections();
    const defects = await getDefectsCollection();

    const context = await getTestCaseContext(
      payload.testCaseId,
      payload.cycleId,
    );
    const moduleName = getExecutionModule(context.cycleName);
    const today = new Date();

    const existingOpenDefect = await defects.findOne(
      {
        testCaseId: context.businessTestCaseId,
        module: moduleName,
        status: { $in: ["OPEN", "IN_PROGRESS", "ON_HOLD"] },
      },
      { sort: { createdAt: -1 }, projection: { _id: 0, id: 1 } },
    );

    if (existingOpenDefect) {
      await defects.updateOne(
        { id: existingOpenDefect.id },
        {
          $set: {
            summary: payload.title,
            actualResult: payload.description,
            severity: payload.severity,
            priority: payload.priority,
            status: "OPEN",
            qcStatusBbt: "FAILED",
            dateReported: today,
          },
        },
      );

      return await defects.findOne(
        { id: existingOpenDefect.id },
        { projection: { _id: 0 } },
      );
    }

    const id = randomUUID();

    const newDefect: DefectDoc = {
      id,
      testCaseId: context.businessTestCaseId,
      dateReported: today,
      module: moduleName,
      summary: payload.title,
      expectedResult: payload.expectedResult || context.expectedResult || "",
      actualResult: payload.description,
      severity: payload.severity,
      priority: payload.priority,
      status: "OPEN",
      qcStatusBbt: "PENDING",
      createdAt: new Date(),
    };

    await defects.insertOne(newDefect);
    return newDefect;
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
  await ensureTestCaseCollections();
  const testCycleRuns = await getTestCycleRunsCollection();

  return await testCycleRuns
    .find(
      { cycleId },
      {
        projection: {
          _id: 0,
          id: 1,
          cycleId: 1,
          name: 1,
          createdBy: 1,
          createdAt: 1,
        },
      },
    )
    .sort({ createdAt: -1 })
    .toArray();
}

export async function getTestCycleRunForApi(cycleId: string, runId: string) {
  await ensureTestCaseCollections();
  const testCycleRuns = await getTestCycleRunsCollection();

  return await testCycleRuns.findOne(
    { id: runId, cycleId },
    {
      projection: {
        _id: 0,
        id: 1,
        cycleId: 1,
        name: 1,
        data: 1,
        createdBy: 1,
        createdAt: 1,
      },
    },
  );
}

export async function createTestCycleRunForApi(
  payload: CreateTestCycleRunPayload,
) {
  await ensureTestCaseCollections();

  const [testCycles, testCases, testExecutions, defects, testCycleRuns] =
    await Promise.all([
      getTestCyclesCollection(),
      getTestCasesCollection(),
      getTestExecutionsCollection(),
      getDefectsCollection(),
      getTestCycleRunsCollection(),
    ]);

  const cycle = await testCycles.findOne(
    { id: payload.cycleId },
    { projection: { _id: 0, id: 1, name: 1 } },
  );

  if (!cycle) {
    throw new Error("Test cycle not found");
  }

  const [testCaseRows, executionRows, failedIssueRows] = await Promise.all([
    testCases
      .find(
        { cycleId: payload.cycleId },
        {
          projection: {
            _id: 0,
            id: 1,
            testCaseId: 1,
            moduleName: 1,
            title: 1,
            steps: 1,
            sectionName: 1,
            expectedResult: 1,
          },
        },
      )
      .sort({ testCaseId: 1 })
      .toArray(),
    testExecutions
      .find(
        { cycleId: payload.cycleId },
        {
          projection: {
            _id: 0,
            testCaseId: 1,
            status: 1,
            remarks: 1,
            severity: 1,
            executedOn: 1,
          },
        },
      )
      .toArray(),
    defects
      .find(
        { module: getExecutionModule(cycle.name), testCaseId: { $ne: null } },
        {
          projection: {
            _id: 0,
            id: 1,
            testCaseId: 1,
            module: 1,
            summary: 1,
            expectedResult: 1,
            actualResult: 1,
            severity: 1,
            priority: 1,
            status: 1,
            dateReported: 1,
            dateFixed: 1,
            createdAt: 1,
          },
        },
      )
      .sort({ dateReported: -1, createdAt: -1 })
      .toArray(),
  ]);

  const executionMap = new Map(
    executionRows.map((row) => [row.testCaseId, row]),
  );
  const mergedExecutions = testCaseRows.map((testCase) => {
    const execution = executionMap.get(testCase.id);
    return {
      testCaseId: testCase.testCaseId,
      moduleName: testCase.moduleName ?? null,
      sectionName: testCase.sectionName ?? null,
      title: testCase.title,
      steps: testCase.steps,
      expectedResult: testCase.expectedResult || "",
      status: execution?.status ?? "NOT_RUN",
      remarks: execution?.remarks ?? null,
      severity: execution?.severity ?? null,
      executedOn: execution?.executedOn ?? null,
    };
  });

  const summary = {
    total: mergedExecutions.length,
    pass: mergedExecutions.filter((r) => r.status === "PASS").length,
    fail: mergedExecutions.filter((r) => r.status === "FAIL").length,
    notRun: mergedExecutions.filter((r) => !r.status || r.status === "NOT_RUN")
      .length,
  };

  const snapshot = {
    cycle: {
      id: cycle.id,
      name: cycle.name,
    },
    summary,
    executions: mergedExecutions,
    failedIssues: failedIssueRows,
  };

  const id = randomUUID();
  const doc: TestCycleRunDoc = {
    id,
    cycleId: payload.cycleId,
    name: payload.name,
    data: snapshot,
    createdBy: payload.createdBy ?? null,
    createdAt: new Date(),
  };

  await testCycleRuns.insertOne(doc);
  return {
    id: doc.id,
    cycleId: doc.cycleId,
    name: doc.name,
    createdBy: doc.createdBy,
    createdAt: doc.createdAt,
  };
}

export async function deleteTestCycleRunForApi(cycleId: string, runId: string) {
  try {
    await ensureTestCaseCollections();
    const testCycleRuns = await getTestCycleRunsCollection();

    const result = await testCycleRuns.deleteOne({ id: runId, cycleId });

    if (!result.deletedCount) {
      throw new Error("Run not found");
    }

    return { success: true };
  } catch (error) {
    console.error("[API] Failed to delete test cycle run", error);
    throw error;
  }
}
