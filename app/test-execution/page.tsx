"use client";

import React, { useState, useEffect } from "react";
import { HiArrowLeft, HiCheckCircle, HiXCircle, HiChevronDown, HiExclamationCircle, HiDownload } from "react-icons/hi";
import Link from "next/link";
import { TestCycle, TestCaseWithExecution, TestExecutionStatus } from "@/lib/testCaseTypes";
import TestCaseImportForm from "@/app/components/testExecution/TestCaseImportForm";

interface FailModalState {
  isOpen: boolean;
  testCaseId: string;
  remarks: string;
  severity: "MAJOR" | "HIGH" | "MEDIUM" | "LOW";
}

interface TestCycleRun {
  id: string;
  cycleId: string;
  name: string;
  createdBy?: string | null;
  createdAt: string;
}

const STATUS_COLORS: Record<TestExecutionStatus, { bg: string; text: string; icon: React.ReactNode }> = {
  NOT_RUN: { bg: "bg-slate-700", text: "text-slate-200", icon: <HiChevronDown /> },
  PASS: { bg: "bg-green-900", text: "text-green-200", icon: <HiCheckCircle /> },
  FAIL: { bg: "bg-red-900", text: "text-red-200", icon: <HiXCircle /> },
};

const SEVERITY_OPTIONS = ["LOW", "MEDIUM", "HIGH", "MAJOR"] as const;

export default function TestCaseExecutionPage() {
  const [cycles, setCycles] = useState<TestCycle[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<string>("");
  const [testCases, setTestCases] = useState<TestCaseWithExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCycleDropdownOpen, setIsCycleDropdownOpen] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [failModal, setFailModal] = useState<FailModalState>({
    isOpen: false,
    testCaseId: "",
    remarks: "",
    severity: "HIGH",
  });
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [expectedResults, setExpectedResults] = useState<Record<string, string>>({});
  const [runName, setRunName] = useState("");
  const [runs, setRuns] = useState<TestCycleRun[]>([]);
  const [savingRun, setSavingRun] = useState(false);
  const [downloadingRunId, setDownloadingRunId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
        setLoading(true);
        const response = await fetch(`/api/v1/test-cycles/${selectedCycle}/test-cases`);
        const data = await response.json();
        if (data.success) {
          setTestCases(data.data || []);
          setRemarks({});
          setExpectedResults({});
        }
      } catch (error) {
        console.error("Failed to load test cases:", error);
        setMessage({ type: "error", text: "Failed to load test cases" });
      } finally {
        setLoading(false);
      }
    }

    loadTestCases();
  }, [selectedCycle]);

  useEffect(() => {
    if (!selectedCycle) return;

    async function loadRuns() {
      try {
        const response = await fetch(`/api/v1/test-cycles/${selectedCycle}/runs`);
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
              ? { ...tc, executionStatus: "PASS", executionRemarks: remarks[testCaseId] || "" }
              : tc
          )
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
      remarks: testCase.executionRemarks || "",
      severity: testCase.executionSeverity || "HIGH",
    });
  };

  const handleFailConfirm = async () => {
    if (!selectedCycle) return;

    try {
      setSavingId(failModal.testCaseId);
      const testCase = testCases.find((tc) => tc.id === failModal.testCaseId);
      if (!testCase) return;

      const defectTitle = `Failure in ${testCase.testCaseId} - ${testCase.title}`;
      const defectDescription = `Steps: ${testCase.steps}\n\nRemarks: ${failModal.remarks}`;

      const response = await fetch("/api/v1/test-executions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cycleId: selectedCycle,
          testCaseId: failModal.testCaseId,
          status: "FAIL",
          remarks: failModal.remarks,
          severity: failModal.severity,
          createDefect: true,
          defectTitle,
          defectDescription,
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
                  executionRemarks: failModal.remarks,
                  executionSeverity: failModal.severity,
                }
              : tc
          )
        );
        setMessage({ type: "success", text: "Test case marked as FAIL and issue logged in Defects" });
        setFailModal({ isOpen: false, testCaseId: "", remarks: "", severity: "HIGH" });
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

  const handleExpectedResultChange = (testCaseId: string, value: string) => {
    setExpectedResults((prev) => ({ ...prev, [testCaseId]: value }));
  };

  const getDisplayExpectedResult = (testCaseId: string, expectedResult?: string | null) => {
    const editedValue = expectedResults[testCaseId];
    if (editedValue !== undefined) {
      return editedValue;
    }

    if (!expectedResult || expectedResult.trim().toLowerCase() === "to be determined") {
      return "";
    }

    return expectedResult;
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

  const handleSaveRun = async () => {
    if (!selectedCycle) return;

    const trimmedName = runName.trim();
    if (!trimmedName) {
      setMessage({ type: "error", text: "Enter a run folder name to save this test cycle run" });
      return;
    }

    try {
      setSavingRun(true);
      const response = await fetch(`/api/v1/test-cycles/${selectedCycle}/runs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName }),
      });
      const data = await response.json();

      if (!data.success) {
        setMessage({ type: "error", text: data.error?.message || "Failed to save run folder" });
        return;
      }

      setRuns((prev) => [data.data, ...prev]);
      setRunName("");
      setMessage({ type: "success", text: "Test cycle run saved to folder successfully" });
    } catch (error) {
      console.error("Failed to save cycle run:", error);
      setMessage({ type: "error", text: "Failed to save run folder" });
    } finally {
      setSavingRun(false);
    }
  };

  const handleDownloadRun = async (runId: string) => {
    if (!selectedCycle) return;

    try {
      setDownloadingRunId(runId);
      const response = await fetch(`/api/v1/test-cycles/${selectedCycle}/runs/${runId}/download`);

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

  if (loading && cycles.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-700 border-t-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading test cycles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8 overflow-hidden relative">
      <div className="fixed inset-0 opacity-30 -z-10">
        <div className="absolute top-20 left-0 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-1/2 right-0 w-80 h-80 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob" style={{ animationDelay: "2s" }}></div>
        <div className="absolute bottom-0 left-1/2 w-80 h-80 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob" style={{ animationDelay: "4s" }}></div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-12 space-y-8 relative">
        {/* Header */}
        <div className="flex items-center justify-between animate-in fade-in duration-500">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-all duration-300 transform hover:translate-x-1 mb-4 group">
              <HiArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Back to Dashboard</span>
            </Link>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Test Case Execution</h1>
            <p className="text-slate-400 mt-2 text-sm">Execute and track test cases for your test cycle</p>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className={`p-4 rounded-lg border ${message.type === "success" ? "bg-green-900/30 border-green-700/50 text-green-300" : "bg-red-900/30 border-red-700/50 text-red-300"}`}>
            {message.text}
          </div>
        )}

        {/* Import Form */}
        <TestCaseImportForm onImportSuccess={handleImportSuccess} onImportError={handleImportError} />

        {/* Cycle Selector */}
        <div className="backdrop-blur-xl bg-slate-900/50 rounded-2xl border border-slate-800/50 shadow-2xl p-8">
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-300 mb-2">Select Test Cycle</label>
            <div className="relative">
              <button
                onClick={() => setIsCycleDropdownOpen(!isCycleDropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white hover:border-slate-600/50 transition-all"
              >
                <span>{cycles.find((c) => c.id === selectedCycle)?.name || "Select a cycle"}</span>
                <HiChevronDown className={`w-4 h-4 transition-transform ${isCycleDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {isCycleDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-10 overflow-hidden">
                  {cycles.map((cycle) => (
                    <button
                      key={cycle.id}
                      onClick={() => {
                        setSelectedCycle(cycle.id);
                        setIsCycleDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-slate-700 text-slate-200 transition-colors"
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
        <div className="backdrop-blur-xl bg-slate-900/50 rounded-2xl border border-slate-800/50 shadow-2xl p-8">
          <h2 className="text-lg font-bold text-white mb-4">Test Cycle Run Folder</h2>
          <p className="text-xs text-slate-400 mb-4">
            Save the current cycle run as a folder entry and download it with fail action issues.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <input
              type="text"
              value={runName}
              onChange={(e) => setRunName(e.target.value)}
              placeholder="Run name (e.g., HSA Cycle - 26 Mar)"
              className="flex-1 px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={handleSaveRun}
              disabled={savingRun || !selectedCycle}
              className="px-4 py-2 bg-blue-900/60 hover:bg-blue-900/80 disabled:bg-slate-700 text-blue-200 disabled:text-slate-400 rounded-lg text-sm font-semibold transition-colors"
            >
              {savingRun ? "Saving..." : "Save Run Folder"}
            </button>
          </div>

          {runs.length === 0 ? (
            <p className="text-sm text-slate-400">No saved run folders yet.</p>
          ) : (
            <div className="space-y-2">
              {runs.map((run) => (
                <div key={run.id} className="flex items-center justify-between bg-slate-800/40 border border-slate-700/40 rounded-lg px-3 py-2">
                  <div>
                    <p className="text-sm text-slate-200 font-medium">{run.name}</p>
                    <p className="text-xs text-slate-500">{new Date(run.createdAt).toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => handleDownloadRun(run.id)}
                    disabled={downloadingRunId === run.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-900/50 hover:bg-emerald-900/70 disabled:bg-slate-700 text-emerald-200 disabled:text-slate-400 rounded text-xs font-semibold transition-colors"
                  >
                    <HiDownload className="w-4 h-4" />
                    {downloadingRunId === run.id ? "Preparing..." : "Download"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Test Cases Table */}
        <div className="backdrop-blur-xl bg-slate-900/50 rounded-2xl border border-slate-800/50 shadow-2xl overflow-hidden w-full">
          <div className="p-8">
            <h2 className="text-xl font-bold text-white mb-6">Test Cases</h2>

            {testCases.length === 0 ? (
              <div className="text-center py-12">
                <HiExclamationCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-400">No test cases found for this cycle</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="text-left px-4 py-3 text-slate-300 font-semibold">Test Case ID</th>
                      <th className="text-left px-4 py-3 text-slate-300 font-semibold">Title</th>
                      <th className="text-left px-4 py-3 text-slate-300 font-semibold">Steps</th>
                      <th className="text-left px-4 py-3 text-slate-300 font-semibold">Expected Result</th>
                      <th className="text-left px-4 py-3 text-slate-300 font-semibold">Status</th>
                      <th className="text-left px-4 py-3 text-slate-300 font-semibold">Remarks</th>
                      <th className="text-center px-4 py-3 text-slate-300 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testCases.map((testCase, idx) => (
                      <tr key={testCase.id} className={`border-b border-slate-700/30 ${idx % 2 === 0 ? "bg-slate-800/20" : ""} hover:bg-slate-800/40 transition-colors`}>
                        <td className="px-4 py-3 text-slate-300 font-mono">{testCase.testCaseId}</td>
                        <td className="px-4 py-3 text-slate-300 max-w-xs truncate">{testCase.title}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs max-w-md whitespace-pre-line break-words align-top">{testCase.steps}</td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={getDisplayExpectedResult(testCase.id, testCase.expectedResult)}
                            onChange={(e) => handleExpectedResultChange(testCase.id, e.target.value)}
                            placeholder="Add expected result..."
                            className="w-full px-2 py-1 bg-slate-800/50 border border-slate-700/50 rounded text-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[testCase.executionStatus].bg} ${STATUS_COLORS[testCase.executionStatus].text}`}>
                            {STATUS_COLORS[testCase.executionStatus].icon}
                            <span>{testCase.executionStatus}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={remarks[testCase.id] || testCase.executionRemarks || ""}
                            onChange={(e) => handleRemarkChange(testCase.id, e.target.value)}
                            placeholder="Add remarks..."
                            className="w-full px-2 py-1 bg-slate-800/50 border border-slate-700/50 rounded text-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handlePass(testCase.id)}
                              disabled={savingId === testCase.id}
                              className="px-3 py-1 bg-green-900/50 hover:bg-green-900/70 disabled:bg-slate-700 text-green-200 disabled:text-slate-400 rounded text-xs font-semibold transition-colors"
                            >
                              {savingId === testCase.id ? "..." : "Pass"}
                            </button>
                            <button
                              onClick={() => handleFailClick(testCase)}
                              disabled={savingId === testCase.id}
                              className="px-3 py-1 bg-red-900/50 hover:bg-red-900/70 disabled:bg-slate-700 text-red-200 disabled:text-slate-400 rounded text-xs font-semibold transition-colors"
                            >
                              {savingId === testCase.id ? "..." : "Fail"}
                            </button>
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
      </div>

      {/* Fail Modal */}
      {failModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in">
            <h3 className="text-lg font-bold text-white mb-4">Mark Test Case as Failed</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Remarks</label>
                <textarea
                  value={failModal.remarks}
                  onChange={(e) => setFailModal({ ...failModal, remarks: e.target.value })}
                  placeholder="Enter failure remarks..."
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none h-24"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Severity</label>
                <select
                  value={failModal.severity}
                  onChange={(e) => setFailModal({ ...failModal, severity: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {SEVERITY_OPTIONS.map((sev) => (
                    <option key={sev} value={sev}>
                      {sev}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={() => setFailModal({ isOpen: false, testCaseId: "", remarks: "", severity: "HIGH" })}
                  className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFailConfirm}
                  disabled={savingId === failModal.testCaseId}
                  className="flex-1 px-4 py-2 bg-red-900/50 hover:bg-red-900/70 disabled:bg-slate-700 text-red-200 disabled:text-slate-400 rounded-lg font-semibold transition-colors"
                >
                  {savingId === failModal.testCaseId ? "..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
