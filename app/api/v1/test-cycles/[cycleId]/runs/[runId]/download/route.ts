import { NextRequest } from "next/server";
import * as XLSX from "xlsx";
import { fail } from "@/lib/backend/http";
import { getApiUser } from "@/lib/backend/session";
import { getTestCycleRunForApi } from "@/lib/backend/testCycles";

function safeFilePart(value: string) {
  return value.replace(/[^a-zA-Z0-9-_ ]/g, "").trim().replace(/\s+/g, "-") || "test-cycle-run";
}

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

    const data = run.data as {
      cycle: { id: string; name: string };
      summary: { total: number; pass: number; fail: number; notRun: number };
      executions: Array<{
        testCaseId: string;
        title: string;
        steps: string;
        expectedResult: string;
        status: string | null;
        remarks: string | null;
        severity: string | null;
        executedOn: string | null;
      }>;
      failedIssues: Array<{
        id: string;
        testCaseId: string | null;
        module: string;
        summary: string | null;
        expectedResult: string | null;
        actualResult: string | null;
        severity: string;
        priority: string;
        status: string;
        dateReported: string | null;
        dateFixed: string | null;
      }>;
    };

    const wb = XLSX.utils.book_new();

    const runRows = data.executions.map((item) => ({
      "Test Case ID": item.testCaseId,
      Title: item.title,
      Steps: item.steps,
      "Expected Result": item.expectedResult || "",
      Status: item.status || "NOT_RUN",
      Remarks: item.remarks || "",
      Severity: item.severity || "",
      "Executed On": item.executedOn || "",
    }));

    const issueRows = data.failedIssues.map((item) => ({
      "Issue ID": item.id,
      "Test Case ID": item.testCaseId || "",
      Module: item.module,
      "Summary / Title": item.summary || "",
      "Expected Result": item.expectedResult || "",
      "Actual Result": item.actualResult || "",
      Severity: item.severity,
      Priority: item.priority,
      Status: item.status,
      "Date Reported": item.dateReported || "",
      "Date Fixed": item.dateFixed || "",
    }));

    const summaryRows = [
      {
        "Cycle Name": data.cycle.name,
        "Run Name": run.name,
        "Created At": run.createdAt,
        "Total Cases": data.summary.total,
        "Pass": data.summary.pass,
        "Fail": data.summary.fail,
        "Not Run": data.summary.notRun,
      },
    ];

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), "Run Summary");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(runRows), "Test Executions");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(issueRows), "Fail Issues");

    const arrayBuffer = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
    const cycleName = safeFilePart(data.cycle.name);
    const runName = safeFilePart(run.name);

    return new Response(Buffer.from(arrayBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${cycleName}-${runName}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("[API] Failed to download test cycle run", error);
    return fail("Failed to download run", 500);
  }
}
