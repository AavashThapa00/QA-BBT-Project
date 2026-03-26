import { NextRequest } from "next/server";
import { z } from "zod";
import { parseTestCaseCSV, importTestCasesForCycle, getOrCreateTestCycle } from "@/lib/backend/testCaseImport";
import { fail, ok } from "@/lib/backend/http";
import { getApiUser } from "@/lib/backend/session";

const importSchema = z.object({
  csvContent: z.string().min(1),
  cycleName: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getApiUser();
    if (!user) {
      return fail("Unauthorized", 401);
    }

    const body = await request.json();
    const parsed = importSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Invalid request body", 400, parsed.error.flatten());
    }

    const { csvContent, cycleName } = parsed.data;

    // Parse incoming delimited content from CSV/XLSX
    let testCases;
    try {
      testCases = parseTestCaseCSV(csvContent);
    } catch (error) {
      return fail(
        error instanceof Error ? error.message : "Failed to parse file",
        400
      );
    }

    if (testCases.length === 0) {
      return fail("No valid test cases found in file", 400);
    }

    // Get or create test cycle
    const cycleId = await getOrCreateTestCycle(cycleName);

    // Import test cases
    const result = await importTestCasesForCycle(cycleId, testCases);

    return ok({
      cycleId,
      cycleName,
      imported: result.imported,
      failed: result.failed,
      total: testCases.length,
      errors: result.errors,
    });
  } catch (error) {
    console.error("[API] Failed to import test cases", error);
    return fail("Failed to import test cases", 500);
  }
}
