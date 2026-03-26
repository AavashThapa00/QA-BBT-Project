import { NextRequest } from "next/server";
import { z } from "zod";
import { getTestCyclesForApi } from "@/lib/backend/testCycles";
import { fail, ok } from "@/lib/backend/http";
import { getApiUser } from "@/lib/backend/session";

export async function GET(request: NextRequest) {
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
