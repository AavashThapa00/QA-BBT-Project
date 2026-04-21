import { NextRequest } from "next/server";
import { z } from "zod";
import { createDefectForApi, getDefectsForApi } from "@/lib/backend/defects";
import { fail, ok } from "@/lib/backend/http";
import { getApiUser } from "@/lib/backend/session";

const severitySchema = z.enum(["MAJOR", "HIGH", "MEDIUM", "LOW"]);
const statusSchema = z.enum(["PENDING", "FIXED", "AS_IT_IS", "HOLD", "RE_OPENED"]);
const qcStatusSchema = z.enum(["PASSED", "FAILED", "PENDING", "REJECTED"]);

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(25),
  sortBy: z.enum(["date", "severity", "status"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().optional(),
  severity: z.array(severitySchema).optional(),
  status: z.array(statusSchema).optional(),
  module: z.array(z.string()).optional(),
});

const createDefectSchema = z.object({
  testCaseId: z.string().min(1).optional().nullable(),
  dateReported: z.string().min(1),
  module: z.string().min(1),
  summary: z.string().optional().nullable(),
  expectedResult: z.string().min(1),
  actualResult: z.string().min(1),
  severity: severitySchema,
  priority: z.string().min(1),
  assignedTo: z.string().optional().nullable(),
  status: statusSchema,
  dateFixed: z.string().optional().nullable(),
  qcStatusBbt: qcStatusSchema.optional(),
  sourceFile: z.string().optional().nullable(),
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
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
      sortBy: searchParams.get("sortBy") ?? undefined,
      sortOrder: searchParams.get("sortOrder") ?? undefined,
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

    const { page, pageSize, sortBy, sortOrder, ...filters } = parsed.data;
    const data = await getDefectsForApi(filters, {
      page,
      pageSize,
      sortBy,
      sortOrder,
    });

    return ok(data);
  } catch (error) {
    console.error("[API] Failed to fetch defects", error);
    return fail("Failed to fetch defects", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getApiUser();
    if (!user) {
      return fail("Unauthorized", 401);
    }

    const body = await request.json();
    const parsed = createDefectSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Invalid request body", 400, parsed.error.flatten());
    }

    const created = await createDefectForApi(parsed.data);
    return ok(created, 201);
  } catch (error) {
    console.error("[API] Failed to create defect", error);
    return fail("Failed to create defect", 500);
  }
}
