import { NextRequest } from "next/server";
import { getApiUser } from "@/lib/backend/session";
import { fail, ok } from "@/lib/backend/http";

export async function GET(_request: NextRequest) {
  try {
    const user = await getApiUser();
    if (!user) {
      return fail("Unauthorized", 401);
    }

    return ok({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error("[API] Failed to check auth session", error);
    return fail("Failed to check auth session", 500);
  }
}
