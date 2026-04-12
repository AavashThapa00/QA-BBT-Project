import { NextRequest } from "next/server";
import { z } from "zod";
import {
  createTestCycleNodeForApi,
  getTestCyclesForApi,
} from "@/lib/backend/testCycles";
import { fail, ok } from "@/lib/backend/http";
import { getApiUser } from "@/lib/backend/session";

const createNodeSchema = z.object({
  name: z.string().min(1),
  kind: z.enum(["folder", "cycle"]),
  parentId: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

export async function GET(_request: NextRequest) {
  try {
    const user = await getApiUser();
    if (!user) {
      return fail("Unauthorized", 401);
    }

    const cycles = await getTestCyclesForApi();
    return ok(cycles);
  } catch (error) {
    console.error("[API] Failed to fetch test cycles", error);
    return fail("Failed to fetch test cycles", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getApiUser();
    if (!user) {
      return fail("Unauthorized", 401);
    }

    const body = await request.json();
    const parsed = createNodeSchema.safeParse(body);
    if (!parsed.success) {
      return fail("Invalid request body", 400, parsed.error.flatten());
    }

    const node = await createTestCycleNodeForApi(parsed.data);
    return ok(node);
  } catch (error) {
    console.error("[API] Failed to create test cycle node", error);
    return fail(
      error instanceof Error
        ? error.message
        : "Failed to create test cycle node",
      500,
    );
  }
}
