"use client";

import React, { useState, useEffect } from "react";
import {
  HiArrowLeft,
  HiCheckCircle,
  HiXCircle,
  HiChevronDown,
  HiExclamationCircle,
  HiDownload,
  HiTrash,
  HiArrowRight,
  HiX,
} from "react-icons/hi";
import Link from "next/link";
import AppButton from "@/app/components/common/AppButton";
import {
  TestCycle,
  TestCaseWithExecution,
  TestExecutionStatus,
} from "@/lib/testCaseTypes";
import TestCaseImportForm from "@/app/components/testExecution/TestCaseImportForm";

interface FailModalState {
  isOpen: boolean;
  testCaseId: string;
  expectedResult: string;
  issueSummary: string;
  issueDescription: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "MAJOR";
  severity: "MAJOR" | "HIGH" | "MEDIUM" | "LOW";
}

interface TestCycleRun {
  id: string;
  cycleId: string;
  name: string;
  createdBy?: string | null;
  createdAt: string;
}

const STATUS_COLORS: Record<
  TestExecutionStatus,
  { bg: string; text: string; icon: React.ReactNode }
> = {
  NOT_RUN: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    icon: <HiChevronDown />,
  },
  PASS: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    icon: <HiCheckCircle />,
  },
  FAIL: { bg: "bg-rose-100", text: "text-rose-700", icon: <HiXCircle /> },
};

const STATUS_LABELS: Record<TestExecutionStatus, string> = {
  NOT_RUN: "PENDING",
  PASS: "PASS",
  FAIL: "FAIL",
};

const SEVERITY_OPTIONS = ["LOW", "MEDIUM", "HIGH", "MAJOR"] as const;
const PRIORITY_OPTIONS = ["LOW", "MEDIUM", "HIGH", "MAJOR"] as const;

export default function TestCaseExecutionPage() {
  const [cycles, setCycles] = useState<TestCycle[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<string>("");
  const [testCases, setTestCases] = useState<TestCaseWithExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTestCases, setLoadingTestCases] = useState(false);
  const [hasLoadedTestCases, setHasLoadedTestCases] = useState(false);
  const [isCycleDropdownOpen, setIsCycleDropdownOpen] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [failModal, setFailModal] = useState<FailModalState>({
    isOpen: false,
    testCaseId: "",
    expectedResult: "",
    issueSummary: "",
    issueDescription: "",
    priority: "HIGH",
    severity: "HIGH",
  });
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [isNewCycleModalOpen, setIsNewCycleModalOpen] = useState(false);
  const [newCycleFolderName, setNewCycleFolderName] = useState("");
  const [runSearch, setRunSearch] = useState("");
  const [runs, setRuns] = useState<TestCycleRun[]>([]);
  const [savingRun, setSavingRun] = useState(false);
  const [downloadingRunId, setDownloadingRunId] = useState<string | null>(null);
  const [deletingRunId, setDeletingRunId] = useState<string | null>(null);
  const [restoringRunId, setRestoringRunId] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!message) return;

    const timer = window.setTimeout(() => {
      setMessage(null);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [message]);

  // Fetch test cycles
  useEffect(() => {
    async function loadCycles() {
      try {
        setLoading(true);
        const response = await fetch("/api/v1/test-cycles");
        const data = await response.json();
        if (data.success) {
          setCycles(data.data || []);
          if (data.data?.length > 0) {
            setSelectedCycle(data.data[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to load test cycles:", error);
        setMessage({ type: "error", text: "Failed to load test cycles" });
      } finally {
        setLoading(false);
      }
    }

    loadCycles();
  }, []);

  // Fetch test cases when cycle is selected
  useEffect(() => {
    if (!selectedCycle) return;

    async function loadTestCases() {
      try {
        setLoadingTestCases(true);
        setHasLoadedTestCases(false);
        const response = await fetch(
          `/api/v1/test-cycles/${selectedCycle}/test-cases`,
        );
        const data = await response.json();
        if (data.success) {
          setTestCases(data.data || []);
          setRemarks({});
        }
      } catch (error) {
        console.error("Failed to load test cases:", error);
        setMessage({ type: "error", text: "Failed to load test cases" });
      } finally {
        setLoadingTestCases(false);
        setHasLoadedTestCases(true);
      }
    }

    loadTestCases();
  }, [selectedCycle]);

  useEffect(() => {
    if (!selectedCycle) return;

    async function loadRuns() {
      try {
        const response = await fetch(
          `/api/v1/test-cycles/${selectedCycle}/runs`,
        );
        const data = await response.json();
        if (data.success) {
          setRuns(data.data || []);
        }
      } catch (error) {
        console.error("Failed to load saved runs:", error);
      }
    }

    loadRuns();
  }, [selectedCycle]);

  const handlePass = async (testCaseId: string) => {
    if (!selectedCycle) return;

    try {
      setSavingId(testCaseId);
      const response = await fetch("/api/v1/test-executions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cycleId: selectedCycle,
          testCaseId,
          status: "PASS",
          remarks: remarks[testCaseId] || null,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setTestCases((prev) =>
          prev.map((tc) =>
            tc.id === testCaseId
              ? {
                  ...tc,
                  executionStatus: "PASS",
                  executionRemarks: remarks[testCaseId] || "",
                }
              : tc,
          ),
        );
        setMessage({ type: "success", text: "Test case marked as PASS" });
      } else {
        setMessage({ type: "error", text: "Failed to save test execution" });
      }
    } catch (error) {
      console.error("Failed to save execution:", error);
      setMessage({ type: "error", text: "Failed to save test execution" });
    } finally {
      setSavingId(null);
    }
  };

  const handleFailClick = (testCase: TestCaseWithExecution) => {
    setFailModal({
      isOpen: true,
      testCaseId: testCase.id,
      expectedResult: testCase.expectedResult || "",
      issueSummary: `Failure in ${testCase.testCaseId} - ${testCase.title}`,
      issueDescription: testCase.executionRemarks || "",
      priority: "HIGH",
      severity: testCase.executionSeverity || "HIGH",
    });
  };

  const handleRevertToPending = async (testCaseId: string) => {
    if (!selectedCycle) return;

    try {
      setSavingId(testCaseId);
      const response = await fetch("/api/v1/test-executions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cycleId: selectedCycle,
          testCaseId,
          status: "NOT_RUN",
          remarks: null,
          severity: null,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setTestCases((prev) =>
          prev.map((tc) =>
            tc.id === testCaseId
              ? {
                  ...tc,
                  executionStatus: "NOT_RUN",
                  executionRemarks: "",
                  executionSeverity: null,
                }
              : tc,
          ),
        );
        setMessage({ type: "success", text: "Test case reverted to PENDING" });
      } else {
        setMessage({ type: "error", text: "Failed to revert test execution" });
      }
    } catch (error) {
      console.error("Failed to revert execution:", error);
      setMessage({ type: "error", text: "Failed to revert test execution" });
    } finally {
      setSavingId(null);
    }
  };

  const handleFailConfirm = async () => {
    if (!selectedCycle) return;

    const issueSummary = failModal.issueSummary.trim();
    const issueDescription = failModal.issueDescription.trim();
    const expectedResult = failModal.expectedResult.trim();

    if (!expectedResult || !issueSummary || !issueDescription) {
      setMessage({
        type: "error",
        text: "Expected Result, Issue Summary, and Issue Description are required for failed test cases",
      });
      return;
    }

    try {
      setSavingId(failModal.testCaseId);
      const testCase = testCases.find((tc) => tc.id === failModal.testCaseId);
      if (!testCase) return;

      const defectTitle = issueSummary;
      const defectDescription = `Issue Description: ${issueDescription}\n\nTest Steps: ${testCase.steps}`;

      const response = await fetch("/api/v1/test-executions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cycleId: selectedCycle,
          testCaseId: failModal.testCaseId,
          status: "FAIL",
          remarks: issueDescription,
          severity: failModal.severity,
          createDefect: true,
          defectTitle,
          defectDescription,
          defectExpectedResult: expectedResult,
          defectPriority: failModal.priority,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setTestCases((prev) =>
          prev.map((tc) =>
            tc.id === failModal.testCaseId
              ? {
                  ...tc,
                  executionStatus: "FAIL",
                  executionRemarks: issueDescription,
                  executionSeverity: failModal.severity,
                }
              : tc,
          ),
        );
        setMessage({
          type: "success",
          text: "Test case marked as FAIL and issue logged in Defects",
        });
        setFailModal({
          isOpen: false,
          testCaseId: "",
          expectedResult: "",
          issueSummary: "",
          issueDescription: "",
          priority: "HIGH",
          severity: "HIGH",
        });
      } else {
        setMessage({ type: "error", text: "Failed to save test execution" });
      }
    } catch (error) {
      console.error("Failed to save execution:", error);
      setMessage({ type: "error", text: "Failed to save test execution" });
    } finally {
      setSavingId(null);
    }
  };

  const handleRemarkChange = (testCaseId: string, value: string) => {
    setRemarks((prev) => ({ ...prev, [testCaseId]: value }));
  };

  const handleImportSuccess = () => {
    // Refresh cycles list after successful import
    async function loadCycles() {
      try {
        const response = await fetch("/api/v1/test-cycles");
        const data = await response.json();
        if (data.success) {
          setCycles(data.data || []);
        }
      } catch (error) {
        console.error("Failed to refresh cycles:", error);
      }
    }
    loadCycles();
    setMessage({ type: "success", text: "Test cases imported successfully!" });
  };

  const handleImportError = (error: string) => {
    setMessage({ type: "error", text: `Import failed: ${error}` });
  };

  const handleDownloadRun = async (runId: string) => {
    if (!selectedCycle) return;

    try {
      setDownloadingRunId(runId);
      const response = await fetch(
        `/api/v1/test-cycles/${selectedCycle}/runs/${runId}/download`,
      );

      if (!response.ok) {
        setMessage({ type: "error", text: "Failed to download run file" });
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "test-cycle-run.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download run:", error);
      setMessage({ type: "error", text: "Failed to download run file" });
    } finally {
      setDownloadingRunId(null);
    }
  };

  const handleDeleteRun = async (runId: string) => {
    if (
      !selectedCycle ||
      !window.confirm("Are you sure you want to delete this run folder?")
    )
      return;

    try {
      setDeletingRunId(runId);
      const response = await fetch(
        `/api/v1/test-cycles/${selectedCycle}/runs/${runId}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();
      if (data.success) {
        setRuns((prev) => prev.filter((r) => r.id !== runId));
        setMessage({
          type: "success",
          text: "Run folder deleted successfully",
        });
      } else {
        setMessage({ type: "error", text: "Failed to delete run folder" });
      }
    } catch (error) {
      console.error("Failed to delete run:", error);
      setMessage({ type: "error", text: "Failed to delete run folder" });
    } finally {
      setDeletingRunId(null);
    }
  };

  const handleOpenRun = async (runId: string) => {
    if (!selectedCycle) return;

    try {
      setRestoringRunId(runId);
      const response = await fetch(
        `/api/v1/test-cycles/${selectedCycle}/runs/${runId}`,
      );
      const data = await response.json();

      if (!data.success || !data.data?.data?.executions) {
        setMessage({ type: "error", text: "Failed to open run folder" });
        return;
      }

      const executions = data.data.data.executions as Array<{
        testCaseId: string;
        status: "NOT_RUN" | "PASS" | "FAIL" | null;
        remarks: string | null;
        severity: "MAJOR" | "HIGH" | "MEDIUM" | "LOW" | null;
      }>;

      const executionMap = new Map(
        executions.map((item) => [item.testCaseId, item]),
      );

      const restoreRequests = testCases.map((testCase) => {
        const saved = executionMap.get(testCase.testCaseId);
        const status = saved?.status ?? "NOT_RUN";

        return fetch("/api/v1/test-executions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cycleId: selectedCycle,
            testCaseId: testCase.id,
            status,
            remarks: saved?.remarks ?? null,
            severity: saved?.severity ?? null,
          }),
        });
      });

      await Promise.all(restoreRequests);

      const nextRemarks: Record<string, string> = {};
      testCases.forEach((testCase) => {
        const saved = executionMap.get(testCase.testCaseId);
        if (saved?.remarks) {
          nextRemarks[testCase.id] = saved.remarks;
        }
      });

      setRemarks(nextRemarks);
      setTestCases((prev) =>
        prev.map((testCase) => {
          const saved = executionMap.get(testCase.testCaseId);
          return {
            ...testCase,
            executionStatus: saved?.status ?? "NOT_RUN",
            executionRemarks: saved?.remarks ?? "",
            executionSeverity: saved?.severity ?? null,
          };
        }),
      );
      setMessage({
        type: "success",
        text: "Run folder opened. You can continue testing from the saved state.",
      });
    } catch (error) {
      console.error("Failed to open run folder:", error);
      setMessage({ type: "error", text: "Failed to open run folder" });
    } finally {
      setRestoringRunId(null);
    }
  };

  const handleNewTestCycle = () => {
    if (!selectedCycle || testCases.length === 0) return;
    setNewCycleFolderName("");
    setIsNewCycleModalOpen(true);
  };

  const handleConfirmNewTestCycle = async () => {
    if (!selectedCycle) return;

    const trimmedName = newCycleFolderName.trim();
    if (!trimmedName) {
      setMessage({
        type: "error",
        text: "Enter a folder name before starting a new test cycle",
      });
      return;
    }

    try {
      setSavingRun(true);

      // Save current run snapshot before resetting statuses.
      const saveResponse = await fetch(
        `/api/v1/test-cycles/${selectedCycle}/runs`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmedName }),
        },
      );
      const saveData = await saveResponse.json();

      if (!saveData.success) {
        setMessage({
          type: "error",
          text: saveData.error?.message || "Failed to save run folder",
        });
        return;
      }

      setRuns((prev) => [saveData.data, ...prev]);

      const resetPromises = testCases.map((testCase) =>
        fetch("/api/v1/test-executions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cycleId: selectedCycle,
            testCaseId: testCase.id,
            status: "NOT_RUN",
            remarks: null,
            severity: null,
          }),
        }),
      );

      await Promise.all(resetPromises);

      setTestCases((prev) =>
        prev.map((tc) => ({
          ...tc,
          executionStatus: "NOT_RUN",
          executionRemarks: "",
          executionSeverity: null,
        })),
      );
      setRemarks({});
      setIsNewCycleModalOpen(false);
      setNewCycleFolderName("");
      setMessage({
        type: "success",
        text: "Run folder saved and new test cycle started (all test cases set to PENDING).",
      });
    } catch (error) {
      console.error("Failed to start new test cycle:", error);
      setMessage({ type: "error", text: "Failed to start new test cycle" });
    } finally {
      setSavingRun(false);
    }
  };

  const filteredRuns = runs.filter((run) =>
    run.name.toLowerCase().includes(runSearch.trim().toLowerCase()),
  );

  if (loading && cycles.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-(--page-background) p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-emerald-200 border-t-(--primary-color)"></div>
          <p className="text-(--muted-color)">Loading test cycles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden bg-(--page-background) p-4 sm:p-6 lg:p-8">
      <div className="relative mx-auto w-full max-w-425 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-in fade-in duration-500">
          <div>
            <Link
              href="/"
              className="group mb-3 inline-flex items-center gap-2 text-sm text-(--muted-color) transition-all duration-300 hover:translate-x-1 hover:text-(--primary-color)"
            >
              <HiArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Dashboard</span>
            </Link>
            <h1 className="text-3xl font-bold text-(--heading-color)">
              Test Cycle Execution
            </h1>
            <p className="mt-1 text-sm text-(--muted-color)">
              Execute and track test cases for selected cycles.
            </p>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div
            className={`flex items-start justify-between gap-3 rounded-xl border p-4 ${message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}
          >
            <span>{message.text}</span>
            <button
              onClick={() => setMessage(null)}
              className="inline-flex shrink-0 items-center justify-center rounded p-1 transition-colors hover:bg-black/5"
              aria-label="Dismiss message"
              title="Dismiss"
            >
              <HiX className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Import Form */}
        <TestCaseImportForm
          onImportSuccess={handleImportSuccess}
          onImportError={handleImportError}
        />

        {/* Cycle Selector */}
        <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <label className="mb-2 block text-sm font-semibold text-(--heading-color)">
              Select Test Cycle
            </label>
            <div className="relative">
              <button
                onClick={() => setIsCycleDropdownOpen(!isCycleDropdownOpen)}
                className="flex w-full items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/40 px-4 py-3 text-left text-(--text-color) transition-all hover:border-emerald-300"
              >
                <span>
                  {cycles.find((c) => c.id === selectedCycle)?.name ||
                    "Select a cycle"}
                </span>
                <HiChevronDown
                  className={`w-4 h-4 transition-transform ${isCycleDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isCycleDropdownOpen && (
                <div className="absolute left-0 right-0 top-full z-10 mt-2 overflow-hidden rounded-xl border border-emerald-100 bg-white shadow-lg">
                  {cycles.map((cycle) => (
                    <button
                      key={cycle.id}
                      onClick={() => {
                        setSelectedCycle(cycle.id);
                        setIsCycleDropdownOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm text-(--text-color) transition-colors hover:bg-emerald-50"
                    >
                      {cycle.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Run Folder Archive */}
        <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-(--heading-color)">
              Test Cycle Run Folder
            </h2>
            <AppButton
              onClick={handleNewTestCycle}
              disabled={!selectedCycle || testCases.length === 0}
              variant="primary"
              size="md"
              title="Reset all test cases to PENDING and start a new cycle"
            >
              <HiArrowRight className="w-4 h-4" />
              New Test Cycle
            </AppButton>
          </div>
          <p className="mb-4 text-xs text-(--muted-color)">
            Save the current cycle run as a folder entry and download it with
            fail action issues.
          </p>

          <div className="mb-5">
            <input
              type="text"
              value={runSearch}
              onChange={(e) => setRunSearch(e.target.value)}
              placeholder="Search test cycle folders..."
              className="w-full rounded-lg border border-emerald-200 bg-emerald-50/40 px-3 py-2 text-sm text-(--text-color) focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {runs.length === 0 ? (
            <p className="text-sm text-(--muted-color)">
              No saved run folders yet.
            </p>
          ) : filteredRuns.length === 0 ? (
            <p className="text-sm text-(--muted-color)">
              No run folders match your search.
            </p>
          ) : (
            <div className="space-y-2">
              {filteredRuns.map((run) => (
                <div
                  key={run.id}
                  className="flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50/40 px-3 py-2"
                >
                  <button
                    onClick={() => handleOpenRun(run.id)}
                    disabled={restoringRunId === run.id}
                    className="text-left hover:opacity-90 disabled:opacity-60 transition-opacity"
                    title="Open this run folder to continue"
                  >
                    <p className="text-sm font-medium text-(--text-color) underline-offset-2 hover:underline">
                      {run.name}
                    </p>
                    <p className="text-xs text-(--muted-color)">
                      {new Date(run.createdAt).toLocaleString()}
                    </p>
                    {restoringRunId === run.id && (
                      <p className="mt-1 text-xs text-emerald-700">
                        Opening...
                      </p>
                    )}
                  </button>
                  <div className="flex items-center gap-2">
                    <AppButton
                      onClick={() => handleDownloadRun(run.id)}
                      disabled={downloadingRunId === run.id}
                      variant="successSoft"
                      size="sm"
                      title="Download run file"
                    >
                      <HiDownload className="w-4 h-4" />
                      {downloadingRunId === run.id
                        ? "Preparing..."
                        : "Download"}
                    </AppButton>
                    <AppButton
                      onClick={() => handleDeleteRun(run.id)}
                      disabled={deletingRunId === run.id}
                      variant="dangerSoft"
                      size="sm"
                      title="Delete run folder"
                    >
                      <HiTrash className="w-4 h-4" />
                      {deletingRunId === run.id ? "Deleting..." : "Delete"}
                    </AppButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Test Cases Table */}
        <div className="w-full overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
          <div className="p-6">
            <h2 className="mb-6 text-xl font-bold text-(--heading-color)">
              Test Cases
            </h2>

            {loadingTestCases || !hasLoadedTestCases ? (
              <div className="text-center py-12">
                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-emerald-200 border-t-(--primary-color)"></div>
                <p className="text-(--muted-color)">Loading test cases...</p>
              </div>
            ) : testCases.length === 0 ? (
              <div className="text-center py-12">
                <HiExclamationCircle className="mx-auto mb-3 h-12 w-12 text-(--muted-color)" />
                <p className="text-(--muted-color)">
                  No test cases found for this cycle
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-emerald-100 bg-emerald-50/40">
                      <th className="px-4 py-3 text-left font-semibold text-(--heading-color)">
                        Test Case ID
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-(--heading-color)">
                        Title
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-(--heading-color)">
                        Steps
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-(--heading-color)">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-(--heading-color)">
                        Remarks
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-(--heading-color)">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {testCases.map((testCase, idx) => (
                      <tr
                        key={testCase.id}
                        className={`border-b border-emerald-50 ${idx % 2 === 0 ? "bg-emerald-50/20" : ""} transition-colors hover:bg-emerald-50/50`}
                      >
                        <td className="px-4 py-3 font-mono text-(--text-color)">
                          {testCase.testCaseId}
                        </td>
                        <td className="max-w-sm wrap-break-word whitespace-normal px-4 py-3 text-(--text-color)">
                          {testCase.title}
                        </td>
                        <td className="max-w-md whitespace-pre-line wrap-break-word px-4 py-3 text-xs align-top text-(--muted-color)">
                          {testCase.steps}
                        </td>
                        <td className="px-4 py-3">
                          <div
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[testCase.executionStatus].bg} ${STATUS_COLORS[testCase.executionStatus].text}`}
                          >
                            {testCase.executionStatus !== "NOT_RUN" &&
                              STATUS_COLORS[testCase.executionStatus].icon}
                            <span>
                              {STATUS_LABELS[testCase.executionStatus]}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={
                              remarks[testCase.id] ||
                              testCase.executionRemarks ||
                              ""
                            }
                            onChange={(e) =>
                              handleRemarkChange(testCase.id, e.target.value)
                            }
                            placeholder="Add remarks..."
                            className="w-full rounded border border-emerald-200 bg-emerald-50/40 px-2 py-1 text-xs text-(--text-color) focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center justify-center gap-2">
                            <AppButton
                              onClick={() => handlePass(testCase.id)}
                              disabled={savingId === testCase.id}
                              title="Mark as Pass"
                              aria-label="Mark as Pass"
                              variant="successSoft"
                              size="sm"
                              className="py-1"
                            >
                              {savingId === testCase.id ? (
                                "..."
                              ) : (
                                <HiCheckCircle className="w-4 h-4" />
                              )}
                            </AppButton>
                            <AppButton
                              onClick={() => handleFailClick(testCase)}
                              disabled={savingId === testCase.id}
                              title="Mark as Fail"
                              aria-label="Mark as Fail"
                              variant="dangerSoft"
                              size="sm"
                              className="py-1"
                            >
                              {savingId === testCase.id ? (
                                "..."
                              ) : (
                                <HiXCircle className="w-4 h-4" />
                              )}
                            </AppButton>
                            {testCase.executionStatus !== "NOT_RUN" && (
                              <AppButton
                                onClick={() =>
                                  handleRevertToPending(testCase.id)
                                }
                                disabled={savingId === testCase.id}
                                variant="secondary"
                                size="sm"
                                className="py-1"
                              >
                                {savingId === testCase.id ? "..." : "Revert"}
                              </AppButton>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Passed Test Cases Section */}
        {testCases.filter((tc) => tc.executionStatus === "PASS").length > 0 && (
          <div className="w-full overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
            <div className="p-6">
              <h2 className="mb-6 text-xl font-bold text-emerald-700">
                Passed Test Cases
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-emerald-100 bg-emerald-50/40">
                      <th className="px-4 py-3 text-left font-semibold text-(--heading-color)">
                        Test Case ID
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-(--heading-color)">
                        Title
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-(--heading-color)">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-(--heading-color)">
                        Remarks
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {testCases
                      .filter((tc) => tc.executionStatus === "PASS")
                      .map((testCase, idx) => (
                        <tr
                          key={testCase.id}
                          className={`border-b border-emerald-50 ${idx % 2 === 0 ? "bg-emerald-50/20" : ""} transition-colors hover:bg-emerald-50/50`}
                        >
                          <td className="px-4 py-3 font-mono text-(--text-color)">
                            {testCase.testCaseId}
                          </td>
                          <td className="max-w-sm wrap-break-word whitespace-normal px-4 py-3 text-(--text-color)">
                            {testCase.title}
                          </td>
                          <td className="px-4 py-3">
                            <div
                              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS["PASS"].bg} ${STATUS_COLORS["PASS"].text}`}
                            >
                              {STATUS_COLORS["PASS"].icon}
                              <span>PASS</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="max-w-md wrap-break-word text-xs text-(--text-color)">
                              {testCase.executionRemarks || "—"}
                            </p>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Failed Test Cases Section */}
        {testCases.filter((tc) => tc.executionStatus === "FAIL").length > 0 && (
          <div className="w-full overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
            <div className="p-6">
              <h2 className="mb-6 text-xl font-bold text-rose-700">
                Failed Test Cases
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-emerald-100 bg-emerald-50/40">
                      <th className="px-4 py-3 text-left font-semibold text-(--heading-color)">
                        Test Case ID
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-(--heading-color)">
                        Title
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-(--heading-color)">
                        Severity
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-(--heading-color)">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-(--heading-color)">
                        Remarks
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {testCases
                      .filter((tc) => tc.executionStatus === "FAIL")
                      .map((testCase, idx) => (
                        <tr
                          key={testCase.id}
                          className={`border-b border-emerald-50 ${idx % 2 === 0 ? "bg-emerald-50/20" : ""} transition-colors hover:bg-emerald-50/50`}
                        >
                          <td className="px-4 py-3 font-mono text-(--text-color)">
                            {testCase.testCaseId}
                          </td>
                          <td className="max-w-sm wrap-break-word whitespace-normal px-4 py-3 text-(--text-color)">
                            {testCase.title}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block rounded px-2 py-1 text-xs font-semibold ${testCase.executionSeverity === "MAJOR" ? "bg-rose-100 text-rose-700" : testCase.executionSeverity === "HIGH" ? "bg-orange-100 text-orange-700" : testCase.executionSeverity === "MEDIUM" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}
                            >
                              {testCase.executionSeverity || "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div
                              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS["FAIL"].bg} ${STATUS_COLORS["FAIL"].text}`}
                            >
                              {STATUS_COLORS["FAIL"].icon}
                              <span>FAIL</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="max-w-md wrap-break-word text-xs text-(--text-color)">
                              {testCase.executionRemarks || "—"}
                            </p>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Test Cycle Modal */}
      {isNewCycleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-emerald-100 bg-white p-8 shadow-xl animate-in fade-in zoom-in">
            <h3 className="mb-2 text-lg font-bold text-(--heading-color)">
              Start New Test Cycle
            </h3>
            <p className="mb-5 text-sm text-(--muted-color)">
              Name the folder to save the current test cycle before all test
              case statuses are reset to pending.
            </p>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-(--heading-color)">
                  Folder Name
                </label>
                <input
                  type="text"
                  value={newCycleFolderName}
                  onChange={(e) => setNewCycleFolderName(e.target.value)}
                  placeholder="e.g., HSA Cycle - 26 Mar"
                  className="w-full rounded-lg border border-emerald-200 bg-emerald-50/40 px-3 py-2 text-sm text-(--text-color) focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <AppButton
                  onClick={() => {
                    setIsNewCycleModalOpen(false);
                    setNewCycleFolderName("");
                  }}
                  disabled={savingRun}
                  variant="secondary"
                  className="flex-1"
                >
                  Cancel
                </AppButton>
                <AppButton
                  onClick={handleConfirmNewTestCycle}
                  disabled={savingRun}
                  variant="primary"
                  className="flex-1"
                >
                  {savingRun ? "Saving..." : "Save & Start"}
                </AppButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fail Modal */}
      {failModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-emerald-100 bg-white p-8 shadow-xl animate-in fade-in zoom-in">
            <h3 className="mb-4 text-lg font-bold text-(--heading-color)">
              Mark Test Case as Failed
            </h3>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-(--heading-color)">
                  Expected Result
                </label>
                <textarea
                  value={failModal.expectedResult}
                  onChange={(e) =>
                    setFailModal({
                      ...failModal,
                      expectedResult: e.target.value,
                    })
                  }
                  placeholder="Enter expected result..."
                  className="h-20 w-full resize-none rounded-lg border border-emerald-200 bg-emerald-50/40 px-3 py-2 text-sm text-(--text-color) focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-(--heading-color)">
                  Issue Summary
                </label>
                <input
                  type="text"
                  value={failModal.issueSummary}
                  onChange={(e) =>
                    setFailModal({ ...failModal, issueSummary: e.target.value })
                  }
                  placeholder="Enter issue summary..."
                  className="w-full rounded-lg border border-emerald-200 bg-emerald-50/40 px-3 py-2 text-sm text-(--text-color) focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-(--heading-color)">
                  Issue Description
                </label>
                <textarea
                  value={failModal.issueDescription}
                  onChange={(e) =>
                    setFailModal({
                      ...failModal,
                      issueDescription: e.target.value,
                    })
                  }
                  placeholder="Describe the failure..."
                  className="h-24 w-full resize-none rounded-lg border border-emerald-200 bg-emerald-50/40 px-3 py-2 text-sm text-(--text-color) focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-(--heading-color)">
                  Priority
                </label>
                <select
                  value={failModal.priority}
                  onChange={(e) =>
                    setFailModal({
                      ...failModal,
                      priority: e.target.value as FailModalState["priority"],
                    })
                  }
                  className="w-full rounded-lg border border-emerald-200 bg-emerald-50/40 px-3 py-2 text-sm text-(--text-color) focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {PRIORITY_OPTIONS.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-(--heading-color)">
                  Severity
                </label>
                <select
                  value={failModal.severity}
                  onChange={(e) =>
                    setFailModal({
                      ...failModal,
                      severity: e.target.value as FailModalState["severity"],
                    })
                  }
                  className="w-full rounded-lg border border-emerald-200 bg-emerald-50/40 px-3 py-2 text-sm text-(--text-color) focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {SEVERITY_OPTIONS.map((sev) => (
                    <option key={sev} value={sev}>
                      {sev}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <AppButton
                  onClick={() =>
                    setFailModal({
                      isOpen: false,
                      testCaseId: "",
                      expectedResult: "",
                      issueSummary: "",
                      issueDescription: "",
                      priority: "HIGH",
                      severity: "HIGH",
                    })
                  }
                  variant="secondary"
                  className="flex-1"
                >
                  Cancel
                </AppButton>
                <AppButton
                  onClick={handleFailConfirm}
                  disabled={savingId === failModal.testCaseId}
                  variant="danger"
                  className="flex-1"
                >
                  {savingId === failModal.testCaseId ? "..." : "Confirm"}
                </AppButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
