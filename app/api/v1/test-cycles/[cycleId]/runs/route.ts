import { NextRequest } from "next/server";
import { z } from "zod";
import { fail, ok } from "@/lib/backend/http";
import { getApiUser } from "@/lib/backend/session";
import { createTestCycleRunForApi, listTestCycleRunsForApi } from "@/lib/backend/testCycles";

const createRunSchema = z.object({
  name: z.string().min(1),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cycleId: string }> }
) {
  try {
    const user = await getApiUser();
    if (!user) {
      return fail("Unauthorized", 401);
    }

    const { cycleId } = await params;
    const runs = await listTestCycleRunsForApi(cycleId);
    return ok(runs);
  } catch (error) {
    console.error("[API] Failed to list test cycle runs", error);
    return fail("Failed to list test cycle runs", 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ cycleId: string }> }
) {
  try {
    const user = await getApiUser();
    if (!user) {
      return fail("Unauthorized", 401);
    }

    const { cycleId } = await params;
    const body = await request.json();
    const parsed = createRunSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Invalid request body", 400, parsed.error.flatten());
    }

    const run = await createTestCycleRunForApi({
      cycleId,
      name: parsed.data.name,
      createdBy: user.id,
    });

    return ok(run);
  } catch (error) {
    console.error("[API] Failed to create test cycle run", error);
    return fail(error instanceof Error ? error.message : "Failed to create test cycle run", 500);
  }
}
