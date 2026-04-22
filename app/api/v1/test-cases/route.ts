import { NextRequest } from "next/server";
import { z } from "zod";
import {
  createTestCaseForApi,
  updateTestCaseForApi,
} from "@/lib/backend/testCycles";
import { fail, ok } from "@/lib/backend/http";
import { getApiUser } from "@/lib/backend/session";

const createTestCaseSchema = z.object({
  cycleId: z.string().min(1),
  moduleName: z.string().optional().nullable(),
  sectionName: z.string().optional().nullable(),
  testCaseId: z.string().optional().nullable(),
  title: z.string().min(1),
  steps: z.string().min(1),
  expectedResult: z.string().optional().nullable(),
});

const updateTestCaseSchema = z.object({
  testCaseId: z.string().min(1),
  title: z.string().optional(),
  steps: z.string().optional(),
  expectedResult: z.string().optional().nullable(),
  moduleName: z.string().optional().nullable(),
  sectionName: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getApiUser();
    if (!user) {
      return fail("Unauthorized", 401);
    }

    const body = await request.json();
    const parsed = createTestCaseSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Invalid request body", 400, parsed.error.flatten());
    }

    const created = await createTestCaseForApi(parsed.data);

    return ok(created);
  } catch (error) {
    console.error("[API] Failed to create test case", error);
    return fail(
      error instanceof Error ? error.message : "Failed to create test case",
      500,
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getApiUser();
    if (!user) {
      return fail("Unauthorized", 401);
    }

    const body = await request.json();
    const parsed = updateTestCaseSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Invalid request body", 400, parsed.error.flatten());
    }

    const updated = await updateTestCaseForApi(parsed.data);

    return ok(updated);
  } catch (error) {
    console.error("[API] Failed to update test case", error);
    return fail(
      error instanceof Error ? error.message : "Failed to update test case",
      500,
    );
  }
}
