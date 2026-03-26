import { NextRequest } from "next/server";
import { z } from "zod";
import {
  saveTestExecutionForApi,
  createTestCaseDefectForApi,
  closeResolvedTestCaseDefectsForApi,
} from "@/lib/backend/testCycles";
import { fail, ok } from "@/lib/backend/http";
import { getApiUser } from "@/lib/backend/session";

const saveExecutionSchema = z.object({
  cycleId: z.string().min(1),
  testCaseId: z.string().min(1),
  status: z.enum(["NOT_RUN", "PASS", "FAIL"]),
  remarks: z.string().optional().nullable(),
  severity: z.enum(["MAJOR", "HIGH", "MEDIUM", "LOW"]).optional().nullable(),
  createDefect: z.boolean().optional().default(false),
  defectTitle: z.string().optional(),
  defectDescription: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getApiUser();
    if (!user) {
      return fail("Unauthorized", 401);
    }

    const body = await request.json();
    const parsed = saveExecutionSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Invalid request body", 400, parsed.error.flatten());
    }

    const { createDefect, defectTitle, defectDescription, ...executionData } = parsed.data;

    // Save test execution
    await saveTestExecutionForApi({
      ...executionData,
      executedBy: user.id,
    });

    // If test passed, close any open defects previously logged from test execution
    if (executionData.status === "PASS") {
      await closeResolvedTestCaseDefectsForApi({
        testCaseId: executionData.testCaseId,
        cycleId: executionData.cycleId,
      });
    }

    // If test failed and should create defect
    if (createDefect && executionData.status === "FAIL" && defectTitle) {
      await createTestCaseDefectForApi({
        testCaseId: executionData.testCaseId,
        cycleId: executionData.cycleId,
        title: defectTitle,
        description: defectDescription || "",
        severity: executionData.severity || "HIGH",
      });
    }

    return ok({ success: true, message: "Test execution saved successfully" });
  } catch (error) {
    console.error("[API] Failed to save test execution", error);
    return fail("Failed to save test execution", 500);
  }
}
