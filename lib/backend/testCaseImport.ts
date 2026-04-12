import { randomUUID } from "crypto";
import { Collection } from "mongodb";
import { mongoCollections } from "@/lib/mongodb";

type TestCycleDoc = {
  id: string;
  name: string;
  description?: string | null;
  createdAt: Date;
  updatedAt?: Date;
};

type TestCaseDoc = {
  id: string;
  testCaseId: string;
  title: string;
  steps: string;
  expectedResult?: string | null;
  cycleId: string;
  createdAt: Date;
};

let schemaReady = false;

const getTestCyclesCollection = async () =>
  (await mongoCollections.testCycles()) as unknown as Collection<TestCycleDoc>;
const getTestCasesCollection = async () =>
  (await mongoCollections.testCases()) as unknown as Collection<TestCaseDoc>;

async function ensureTestCaseSchema() {
  if (schemaReady) {
    return;
  }

  const [testCycles, testCases] = await Promise.all([
    getTestCyclesCollection(),
    getTestCasesCollection(),
  ]);

  await Promise.all([
    testCycles.createIndex({ id: 1 }, { unique: true }),
    testCycles.createIndex({ name: 1 }, { unique: true }),
    testCycles.createIndex({ createdAt: -1 }),
    testCases.createIndex({ id: 1 }, { unique: true }),
    testCases.createIndex({ cycleId: 1, testCaseId: 1 }, { unique: true }),
  ]);

  schemaReady = true;
}

export interface ParsedTestCase {
  testCaseId: string;
  title: string;
  steps: string;
  expectedResult: string;
}

function cleanCell(value: string): string {
  return value.replace(/^"|"$/g, "").replace(/""/g, '"').trim();
}

// Parse delimited content while preserving quoted newlines and delimiters.
function parseDelimitedContent(content: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  const normalized = content.replace(/^\uFEFF/, "");

  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];
    const next = normalized[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && ch === delimiter) {
      row.push(cleanCell(cell));
      cell = "";
      continue;
    }

    if (!inQuotes && (ch === "\n" || ch === "\r")) {
      if (ch === "\r" && next === "\n") {
        i++;
      }
      row.push(cleanCell(cell));
      cell = "";
      if (row.some((v) => v.trim())) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    cell += ch;
  }

  row.push(cleanCell(cell));
  if (row.some((v) => v.trim())) {
    rows.push(row);
  }

  return rows;
}

// Detect delimiter (comma or tab)
function detectDelimiter(firstLine: string): string {
  const commaCount = (firstLine.match(/,/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  return tabCount > commaCount ? "\t" : ",";
}

function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/\s+/g, " ").trim();
}

function collectNonEmpty(cells: string[], indices: number[]): string[] {
  return indices
    .map((idx) => (idx >= 0 ? (cells[idx] || "").trim() : ""))
    .filter(Boolean);
}

function isLikelyTestCaseId(value: string): boolean {
  const id = value.trim().toLowerCase();
  if (!id) return false;
  if (
    [
      "does not repete",
      "does not repeat",
      "repeat",
      "module",
      "component",
    ].includes(id)
  ) {
    return false;
  }
  return /[a-z0-9]/i.test(id);
}

export function parseTestCaseCSV(csvContent: string): ParsedTestCase[] {
  const nonEmptyLine = csvContent
    .split(/\r?\n/)
    .map((line) => line.replace(/^\uFEFF/, "").trim())
    .find(Boolean);

  if (!nonEmptyLine) return [];

  const delimiter = detectDelimiter(nonEmptyLine);
  const rows = parseDelimitedContent(csvContent, delimiter);

  if (rows.length < 2) return [];

  const headers = rows[0].map(normalizeHeader);

  // Find column indices with flexible matching
  const idIdx = headers.findIndex(
    (h) => h.includes("test case id") || h === "id" || h.includes("tc id"),
  );
  const titleIdx = headers.findIndex(
    (h) =>
      h.includes("use case") ||
      h.includes("scenario") ||
      h.includes("description"),
  );
  const stepIndices = headers
    .map((h, idx) => ({ h, idx }))
    .filter(({ h }) => h.includes("step"))
    .map(({ idx }) => idx);
  const resultIdx = headers.findIndex(
    (h) => h.includes("result") || h.includes("expected"),
  );

  if (idIdx === -1 || titleIdx === -1 || stepIndices.length === 0) {
    throw new Error(
      `File headers not recognized. Found: ${headers.join(" | ")}. Required columns: Test Case ID, Use Case/Scenario, Steps`,
    );
  }

  const testCases: ParsedTestCase[] = [];
  let current: ParsedTestCase | null = null;

  const getStepTextFromRow = (cells: string[]): string => {
    const stepParts = collectNonEmpty(cells, stepIndices);
    if (stepParts.length > 0) {
      return stepParts.join("\n");
    }

    // Some exports shift data; if only one non-empty cell exists, treat it as continuation.
    const nonEmpty = cells.map((c) => c.trim()).filter(Boolean);
    if (nonEmpty.length === 1) return nonEmpty[0];
    return "";
  };

  const getContinuationStep = (cells: string[]): string => {
    const ignored = new Set<number>(
      [idIdx, titleIdx, resultIdx, ...stepIndices].filter((idx) => idx >= 0),
    );
    const candidates = cells
      .map((value, idx) => ({ idx, value: value.trim() }))
      .filter(({ idx, value }) => !ignored.has(idx) && Boolean(value));

    if (candidates.length === 0) return "";
    if (candidates.length === 1) return candidates[0].value;

    return candidates.map((c) => c.value).join("\n");
  };

  const pushCurrent = () => {
    if (!current) return;
    if (!current.testCaseId || !current.title || !current.steps) return;

    current.steps = current.steps
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .join("\n");

    testCases.push(current);
  };

  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i];

    const rawId = (cells[idIdx] || "").trim();
    const rawTitle = (cells[titleIdx] || "").trim();
    const rawSteps = getStepTextFromRow(cells);
    const rawResult = resultIdx >= 0 ? (cells[resultIdx] || "").trim() : "";

    if (rawId && isLikelyTestCaseId(rawId)) {
      pushCurrent();
      current = {
        testCaseId: rawId,
        title: rawTitle,
        steps: rawSteps,
        expectedResult: rawResult || "",
      };
      continue;
    }

    if (!current) {
      continue;
    }

    const continuationStep = rawSteps || getContinuationStep(cells);
    if (continuationStep) {
      current.steps = current.steps
        ? `${current.steps}\n${continuationStep}`
        : continuationStep;
    }

    if (!current.title && rawTitle) {
      current.title = rawTitle;
    }

    if (!current.expectedResult && rawResult) {
      current.expectedResult = rawResult;
    }
  }

  pushCurrent();

  // Fallback for flat one-row-per-test files if grouped parsing found nothing.
  if (testCases.length === 0) {
    for (let i = 1; i < rows.length; i++) {
      const cells = rows[i];
      const fallbackId = (cells[idIdx] || "").trim();
      const fallbackTitle = (cells[titleIdx] || "").trim();
      const fallbackSteps = getStepTextFromRow(cells);
      const fallbackResult =
        resultIdx >= 0 ? (cells[resultIdx] || "").trim() : "";

      if (!fallbackId || !isLikelyTestCaseId(fallbackId)) continue;

      testCases.push({
        testCaseId: fallbackId,
        title: fallbackTitle || fallbackId,
        steps: fallbackSteps || "Step details not provided",
        expectedResult: fallbackResult || "",
      });
    }
  }

  return testCases;
}

export async function importTestCasesForCycle(
  cycleId: string,
  testCases: ParsedTestCase[],
): Promise<{ imported: number; failed: number; errors: string[] }> {
  const errors: string[] = [];
  let imported = 0;
  let failed = 0;

  await ensureTestCaseSchema();
  const collection = await getTestCasesCollection();

  for (const tc of testCases) {
    try {
      if (!tc.testCaseId || !tc.title || !tc.steps) {
        failed++;
        errors.push(
          `Skipped ${tc.testCaseId || "unknown"}: Missing required fields`,
        );
        continue;
      }

      const existing = await collection.findOne(
        { testCaseId: tc.testCaseId, cycleId },
        { projection: { _id: 0, id: 1 } },
      );

      if (existing) {
        failed++;
        errors.push(`Skipped ${tc.testCaseId}: Already exists for this cycle`);
        continue;
      }

      await collection.insertOne({
        id: randomUUID(),
        testCaseId: tc.testCaseId,
        title: tc.title,
        steps: tc.steps,
        expectedResult: tc.expectedResult || null,
        cycleId,
        createdAt: new Date(),
      });

      imported++;
    } catch (error) {
      failed++;
      errors.push(
        `Failed to import ${tc.testCaseId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  return { imported, failed, errors };
}

export async function getOrCreateTestCycle(cycleName: string): Promise<string> {
  await ensureTestCaseSchema();
  const collection = await getTestCyclesCollection();

  const existing = await collection.findOne(
    { name: cycleName },
    { projection: { _id: 0, id: 1 } },
  );

  if (existing) {
    return existing.id;
  }

  const id = randomUUID();
  try {
    await collection.insertOne({
      id,
      name: cycleName,
      description: `Test cycle for ${cycleName}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return id;
  } catch {
    const raced = await collection.findOne(
      { name: cycleName },
      { projection: { _id: 0, id: 1 } },
    );
    if (raced) return raced.id;
    throw new Error("Failed to create test cycle");
  }
}
