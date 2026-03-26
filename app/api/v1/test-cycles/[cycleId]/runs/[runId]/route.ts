import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/backend/http";
import { getApiUser } from "@/lib/backend/session";
import { deleteTestCycleRunForApi, getTestCycleRunForApi } from "@/lib/backend/testCycles";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cycleId: string; runId: string }> }
) {
  try {
    const user = await getApiUser();
    if (!user) {
      return fail("Unauthorized", 401);
    }

    const { cycleId, runId } = await params;
    const run = await getTestCycleRunForApi(cycleId, runId);

    if (!run) {
      return fail("Run not found", 404);
    }

    return ok(run);
  } catch (error) {
    console.error("[API] Failed to fetch test cycle run", error);
    return fail(error instanceof Error ? error.message : "Failed to fetch test cycle run", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ cycleId: string; runId: string }> }
) {
  try {
    const user = await getApiUser();
    if (!user) {
      return fail("Unauthorized", 401);
    }

    const { cycleId, runId } = await params;

    await deleteTestCycleRunForApi(cycleId, runId);
    return ok({ success: true, message: "Run deleted successfully" });
  } catch (error) {
    console.error("[API] Failed to delete test cycle run", error);
    return fail(error instanceof Error ? error.message : "Failed to delete test cycle run", 500);
  }
}
