import { NextRequest } from "next/server";
import {
  getTestCasesForCycleForApi,
  getTestExecutionsForCycleForApi,
} from "@/lib/backend/testCycles";
import { fail, ok } from "@/lib/backend/http";
import { getApiUser } from "@/lib/backend/session";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ cycleId: string }> },
) {
  try {
    const user = await getApiUser();
    if (!user) {
      return fail("Unauthorized", 401);
    }

    const { cycleId } = await params;

    const [testCases, executions] = await Promise.all([
      getTestCasesForCycleForApi(cycleId),
      getTestExecutionsForCycleForApi(cycleId),
    ]);

    // Merge test cases with their execution data
    const mergedData = testCases.map((testCase) => {
      const execution = executions.find((e) => e.testCaseId === testCase.id);
      return {
        ...testCase,
        executionStatus: execution?.status ?? "NOT_RUN",
        executionRemarks: execution?.remarks ?? "",
        executionSeverity: execution?.severity ?? null,
        executionId: execution?.id ?? null,
      };
    });

    return ok(mergedData);
  } catch (error) {
    console.error("[API] Failed to fetch test cases", error);
    return fail("Failed to fetch test cases", 500);
  }
}
