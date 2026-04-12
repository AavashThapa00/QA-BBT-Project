import { NextRequest } from "next/server";
import { z } from "zod";
import { fail, ok } from "@/lib/backend/http";
import { getApiUser } from "@/lib/backend/session";
import { importPublicWorkbookToHierarchy } from "@/lib/backend/testCaseImport";

const schema = z.object({
  fileName: z.string().optional(),
  rootFolderName: z.string().optional(),
  cycleName: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getApiUser();
    if (!user) {
      return fail("Unauthorized", 401);
    }

    const body = await request.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return fail("Invalid request body", 400, parsed.error.flatten());
    }

    const result = await importPublicWorkbookToHierarchy({
      fileName: parsed.data.fileName,
      rootFolderName: parsed.data.rootFolderName,
      cycleName: parsed.data.cycleName,
    });

    return ok(result);
  } catch (error) {
    console.error("[API] Failed to import public workbook", error);
    return fail("Failed to import workbook", 500);
  }
}
