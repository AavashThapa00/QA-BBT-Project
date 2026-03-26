import { NextRequest } from "next/server";
import { z } from "zod";
import { getDefectMetricsForApi } from "@/lib/backend/defects";
import { fail, ok } from "@/lib/backend/http";
import { getApiUser } from "@/lib/backend/session";

const severitySchema = z.enum(["MAJOR", "HIGH", "MEDIUM", "LOW"]);
const statusSchema = z.enum(["OPEN", "IN_PROGRESS", "CLOSED", "ON_HOLD", "AS_IT_IS"]);

const querySchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().optional(),
  severity: z.array(severitySchema).optional(),
  status: z.array(statusSchema).optional(),
  module: z.array(z.string()).optional(),
});

function getMultiValue(params: URLSearchParams, key: string) {
  const all = params.getAll(key);
  if (all.length > 0) {
    return all;
  }

  const csv = params.get(key);
  if (!csv) {
    return undefined;
  }

  const list = csv
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return list.length ? list : undefined;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getApiUser();
    if (!user) {
      return fail("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      severity: getMultiValue(searchParams, "severity"),
      status: getMultiValue(searchParams, "status"),
      module: getMultiValue(searchParams, "module"),
    });

    if (!parsed.success) {
      return fail("Invalid query parameters", 400, parsed.error.flatten());
    }

    const metrics = await getDefectMetricsForApi(parsed.data);
    return ok(metrics);
  } catch (error) {
    console.error("[API] Failed to fetch dashboard metrics", error);
    return fail("Failed to fetch dashboard metrics", 500);
  }
}
