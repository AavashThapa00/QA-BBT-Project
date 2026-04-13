"use client";

import React, { useState, useEffect } from "react";
import {
  HiArrowLeft,
  HiCheckCircle,
  HiXCircle,
  HiExclamationCircle,
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
    icon: <HiArrowRight />,
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
  const [selectedMainFolder, setSelectedMainFolder] = useState<string>("");
  const [selectedCycle, setSelectedCycle] = useState<string>("");
  const [selectedScopeId, setSelectedScopeId] = useState<string>("");
  const [newMainFolderName, setNewMainFolderName] = useState("");
  const [newChildCycleName, setNewChildCycleName] = useState("");
  const [newScopeName, setNewScopeName] = useState("");
  const [creatingNode, setCreatingNode] = useState(false);
  const [creatingTestCase, setCreatingTestCase] = useState(false);
  const [newCaseSectionName, setNewCaseSectionName] =
    useState("Login Test Cases");
  const [newCaseTitle, setNewCaseTitle] = useState("");
  const [newCaseSteps, setNewCaseSteps] = useState("");
  const [newCaseStatus, setNewCaseStatus] =
    useState<TestExecutionStatus>("NOT_RUN");
  const [newCaseRemarks, setNewCaseRemarks] = useState("");
  const [caseSearch, setCaseSearch] = useState("");
  const [caseScopeFilter, setCaseScopeFilter] = useState("ALL");
  const [caseHeadingFilter, setCaseHeadingFilter] = useState("ALL");
  const [caseStatusFilter, setCaseStatusFilter] = useState<
    "ALL" | TestExecutionStatus
  >("ALL");
  const [testCases, setTestCases] = useState<TestCaseWithExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTestCases, setLoadingTestCases] = useState(false);
  const [hasLoadedTestCases, setHasLoadedTestCases] = useState(false);
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

  const getNodePath = (nodeId: string): string => {
    const map = new Map(cycles.map((node) => [node.id, node]));
    const parts: string[] = [];
    let cursor = map.get(nodeId);

    while (cursor) {
      parts.unshift(cursor.name);
      if (!cursor.parentId) break;
      cursor = map.get(cursor.parentId);
    }

    return parts.join(" / ");
  };

  const folderNodes = cycles.filter(
    (node) => (node.kind ?? "cycle") === "folder",
  );
  const rootFolders = folderNodes.filter((node) => !node.parentId);
  const mainFolders = rootFolders.length > 0 ? rootFolders : folderNodes;
  const executableCycles = cycles.filter(
    (node) => (node.kind ?? "cycle") === "cycle",
  );
  const selectedCycleNode = executableCycles.find(
    (node) => node.id === selectedCycle,
  );
  const inferredChildParentFolderId =
    selectedCycleNode?.parentId || selectedMainFolder || "";
  const descendantFolderIds = (() => {
    if (!selectedMainFolder) return new Set<string>();
    const set = new Set<string>([selectedMainFolder]);
    let expanded = true;
    while (expanded) {
      expanded = false;
      for (const folder of folderNodes) {
        if (
          folder.parentId &&
          set.has(folder.parentId) &&
          !set.has(folder.id)
        ) {
          set.add(folder.id);
          expanded = true;
        }
      }
    }
    return set;
  })();

  const childCycles = executableCycles.filter((node) => {
    if (!selectedMainFolder) return !node.parentId;
    return Boolean(node.parentId && descendantFolderIds.has(node.parentId));
  });
  const scopeNodes = selectedCycle
    ? folderNodes.filter((node) => (node.parentId || "") === selectedCycle)
    : [];
  const selectedScopeName =
    scopeNodes.find((node) => node.id === selectedScopeId)?.name || "";
  const selectedCycleName =
    executableCycles.find((node) => node.id === selectedCycle)?.name || "";
  const selectedMainFolderPath = selectedMainFolder
    ? getNodePath(selectedMainFolder)
    : "Root";
  const availableScopes = Array.from(
    new Set(
      testCases
        .map((tc) => (tc.moduleName || "General").trim())
        .filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const availableHeadings = Array.from(
    new Set(
      testCases
        .map((tc) => (tc.sectionName || "General Test Cases").trim())
        .filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const normalizedCaseSearch = caseSearch.trim().toLowerCase();

  const filteredTestCases = testCases.filter((tc) => {
    const scope = (tc.moduleName || "General").trim();
    const heading = (tc.sectionName || "General Test Cases").trim();

    const matchesScope = caseScopeFilter === "ALL" || scope === caseScopeFilter;
    const matchesHeading =
      caseHeadingFilter === "ALL" || heading === caseHeadingFilter;
    const matchesStatus =
      caseStatusFilter === "ALL" || tc.executionStatus === caseStatusFilter;
    const matchesSearch =
      !normalizedCaseSearch ||
      tc.testCaseId.toLowerCase().includes(normalizedCaseSearch) ||
      tc.title.toLowerCase().includes(normalizedCaseSearch) ||
      tc.steps.toLowerCase().includes(normalizedCaseSearch);

    return matchesScope && matchesHeading && matchesStatus && matchesSearch;
  });

  const groupedTestCases = filteredTestCases.reduce<
    Array<{
      moduleName: string;
      heading: string;
      items: TestCaseWithExecution[];
    }>
  >((acc, testCase) => {
    const moduleName = (testCase.moduleName || "General").trim();
    const heading = (testCase.sectionName || "General Test Cases").trim();
    const existing = acc.find(
      (group) => group.moduleName === moduleName && group.heading === heading,
    );
    if (existing) {
      existing.items.push(testCase);
    } else {
      acc.push({ moduleName, heading, items: [testCase] });
    }
    return acc;
  }, []);

  const clearCaseFilters = () => {
    setCaseSearch("");
    setCaseScopeFilter("ALL");
    setCaseHeadingFilter("ALL");
    setCaseStatusFilter("ALL");
  };

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
          const nodes = (data.data || []) as TestCycle[];
          setCycles(nodes);

          const folders = nodes.filter((n) => (n.kind ?? "cycle") === "folder");
          const roots = folders.filter((n) => !n.parentId);
          const mains = roots.length > 0 ? roots : folders;
          const firstMain = mains[0];
          if (firstMain) {
            setSelectedMainFolder(firstMain.id);
            const folderSet = new Set<string>([firstMain.id]);
            let expanded = true;
            while (expanded) {
              expanded = false;
              for (const folder of folders) {
                if (
                  folder.parentId &&
                  folderSet.has(folder.parentId) &&
                  !folderSet.has(folder.id)
                ) {
                  folderSet.add(folder.id);
                  expanded = true;
                }
              }
            }

            const firstChildCycle = nodes.find(
              (n) =>
                (n.kind ?? "cycle") === "cycle" &&
                Boolean(n.parentId && folderSet.has(n.parentId)),
            );
            setSelectedCycle(firstChildCycle?.id ?? "");
          } else {
            const rootCycle = nodes.find(
              (n) => (n.kind ?? "cycle") === "cycle" && !n.parentId,
            );
            setSelectedMainFolder("");
            setSelectedCycle(rootCycle?.id ?? "");
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
    if (!selectedCycle) {
      setTestCases([]);
      setRemarks({});
      setHasLoadedTestCases(true);
      return;
    }

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
    if (!selectedMainFolder) return;
    const exists = mainFolders.some(
      (folder) => folder.id === selectedMainFolder,
    );
    if (!exists) {
      setSelectedMainFolder(mainFolders[0]?.id ?? "");
    }
  }, [selectedMainFolder, mainFolders]);

  useEffect(() => {
    if (!selectedMainFolder) {
      const rootCycle = executableCycles.find((cycle) => !cycle.parentId);
      if (
        !selectedCycle ||
        !executableCycles.some((cycle) => cycle.id === selectedCycle)
      ) {
        setSelectedCycle(rootCycle?.id ?? "");
      }
      return;
    }

    const belongs = childCycles.some((cycle) => cycle.id === selectedCycle);
    if (!belongs) {
      setSelectedCycle(childCycles[0]?.id ?? "");
    }
  }, [selectedMainFolder, selectedCycle, childCycles, executableCycles]);

  useEffect(() => {
    if (!selectedCycle) {
      setSelectedScopeId("");
      return;
    }

    const exists = scopeNodes.some((scope) => scope.id === selectedScopeId);
    if (!exists) {
      setSelectedScopeId(scopeNodes[0]?.id ?? "");
    }
  }, [selectedCycle, selectedScopeId, scopeNodes]);

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

  const reloadSelectedCycleTestCases = async () => {
    if (!selectedCycle) return;

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
      console.error("Failed to reload test cases:", error);
      setMessage({ type: "error", text: "Failed to reload test cases" });
    } finally {
      setLoadingTestCases(false);
      setHasLoadedTestCases(true);
    }
  };

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

  const handleCreateMainFolder = async () => {
    const name = newMainFolderName.trim();
    if (!name) {
      setMessage({
        type: "error",
        text: "Enter main title name (e.g., HSA Cycle)",
      });
      return;
    }

    try {
      setCreatingNode(true);
      const response = await fetch("/api/v1/test-cycles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          kind: "folder",
          parentId: null,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        setMessage({
          type: "error",
          text: data.error?.message || "Failed to create main title",
        });
        return;
      }

      const created = data.data as TestCycle;
      setCycles((prev) => [created, ...prev]);
      setSelectedMainFolder(created.id);
      setSelectedCycle("");
      setNewMainFolderName("");
      setMessage({ type: "success", text: "Main title created" });
    } catch (error) {
      console.error("Failed to create main title:", error);
      setMessage({ type: "error", text: "Failed to create main title" });
    } finally {
      setCreatingNode(false);
    }
  };

  const handleCreateChildCycle = async () => {
    const name = newChildCycleName.trim();
    if (!name) {
      setMessage({ type: "error", text: "Enter child cycle name" });
      return;
    }

    if (!selectedMainFolder) {
      setMessage({
        type: "error",
        text: "Select or create a main title first",
      });
      return;
    }

    if (!inferredChildParentFolderId) {
      setMessage({
        type: "error",
        text: "Select a parent folder for this child cycle",
      });
      return;
    }

    try {
      setCreatingNode(true);
      const response = await fetch("/api/v1/test-cycles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          kind: "cycle",
          parentId: inferredChildParentFolderId,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        setMessage({
          type: "error",
          text: data.error?.message || "Failed to create test cycle",
        });
        return;
      }

      const created = data.data as TestCycle;
      setCycles((prev) => [created, ...prev]);
      setSelectedCycle(created.id);
      setNewChildCycleName("");
      setMessage({ type: "success", text: "Child test cycle created" });
    } catch (error) {
      console.error("Failed to create child cycle:", error);
      setMessage({ type: "error", text: "Failed to create test cycle" });
    } finally {
      setCreatingNode(false);
    }
  };

  const handleCreateScope = async () => {
    const name = newScopeName.trim();
    if (!name) {
      setMessage({ type: "error", text: "Enter testing scope name" });
      return;
    }

    if (!selectedCycle) {
      setMessage({ type: "error", text: "Select a child cycle first" });
      return;
    }

    try {
      setCreatingNode(true);
      const response = await fetch("/api/v1/test-cycles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          kind: "folder",
          parentId: selectedCycle,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        setMessage({
          type: "error",
          text: data.error?.message || "Failed to create testing scope",
        });
        return;
      }

      const created = data.data as TestCycle;
      setCycles((prev) => [created, ...prev]);
      setSelectedScopeId(created.id);
      setNewScopeName("");
      setMessage({ type: "success", text: "Testing scope created" });
    } catch (error) {
      console.error("Failed to create testing scope:", error);
      setMessage({ type: "error", text: "Failed to create testing scope" });
    } finally {
      setCreatingNode(false);
    }
  };

  const handleCreateTestCase = async () => {
    if (!selectedCycle) {
      setMessage({ type: "error", text: "Select a child test cycle first" });
      return;
    }

    if (
      !selectedScopeName.trim() ||
      !newCaseSectionName.trim() ||
      !newCaseTitle.trim() ||
      !newCaseSteps.trim()
    ) {
      setMessage({
        type: "error",
        text: "Testing scope, heading, title, and steps are required",
      });
      return;
    }

    try {
      setCreatingTestCase(true);

      const createResponse = await fetch("/api/v1/test-cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cycleId: selectedCycle,
          moduleName: selectedScopeName.trim(),
          sectionName: newCaseSectionName.trim() || "General Test Cases",
          title: newCaseTitle.trim(),
          steps: newCaseSteps.trim(),
        }),
      });

      const createData = await createResponse.json();
      if (!createData.success) {
        setMessage({
          type: "error",
          text: createData.error?.message || "Failed to create test case",
        });
        return;
      }

      const createdCaseId = createData.data.id as string;

      if (newCaseStatus !== "NOT_RUN" || newCaseRemarks.trim()) {
        await fetch("/api/v1/test-executions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cycleId: selectedCycle,
            testCaseId: createdCaseId,
            status: newCaseStatus,
            remarks: newCaseRemarks.trim() || null,
          }),
        });
      }

      await reloadSelectedCycleTestCases();

      setNewCaseSectionName("Login Test Cases");
      setNewCaseTitle("");
      setNewCaseSteps("");
      setNewCaseRemarks("");
      setNewCaseStatus("NOT_RUN");
      setMessage({ type: "success", text: "Test case created successfully" });
    } catch (error) {
      console.error("Failed to create test case:", error);
      setMessage({ type: "error", text: "Failed to create test case" });
    } finally {
      setCreatingTestCase(false);
    }
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
      !window.confirm("Are you sure you want to delete this snapshot?")
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
          text: "Snapshot deleted successfully",
        });
      } else {
        setMessage({ type: "error", text: "Failed to delete snapshot" });
      }
    } catch (error) {
      console.error("Failed to delete run:", error);
      setMessage({ type: "error", text: "Failed to delete snapshot" });
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
        setMessage({ type: "error", text: "Failed to open snapshot" });
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
        text: "Snapshot restored. You can continue testing from the saved state.",
      });
    } catch (error) {
      console.error("Failed to open run folder:", error);
      setMessage({ type: "error", text: "Failed to open snapshot" });
    } finally {
      setRestoringRunId(null);
    }
  };

  const handleNewTestCycle = () => {
    if (!selectedCycle || testCases.length === 0) return;
    const stamp = new Date().toLocaleString();
    setNewCycleFolderName(
      `${selectedCycleName || "Cycle"} Snapshot - ${stamp}`,
    );
    setIsNewCycleModalOpen(true);
  };

  const handleConfirmNewTestCycle = async () => {
    if (!selectedCycle) return;

    const trimmedName = newCycleFolderName.trim();
    if (!trimmedName) {
      setMessage({
        type: "error",
        text: "Enter a snapshot name",
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
          text: saveData.error?.message || "Failed to save snapshot",
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
        text: "Snapshot saved and cycle reset to PENDING.",
      });
    } catch (error) {
      console.error("Failed to start new test cycle:", error);
      setMessage({ type: "error", text: "Failed to save snapshot and reset" });
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
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full "></div>
          <p className="text-(--muted-color)">Loading test cycles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden bg-(--page-background) p-4 sm:p-6 lg:p-8">
      <div className="relative mx-auto w-full max-w-screen-2xl space-y-6">
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
          cycleNodes={cycles}
          defaultParentId={selectedMainFolder}
          defaultCycleName={selectedCycleName}
        />

        {/* Hierarchy Flow */}
        <div className="rounded-2xl border border-emerald-200 bg-linear-to-r from-white to-emerald-50/50 p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-bold text-(--heading-color)">
            Test Cycle Hierarchy
          </h2>
          <p className="mb-5 text-xs text-(--muted-color)">
            1) Create main title (example: HSA Cycle) → 2) Create child cycles
            (Test Cycle 1, 2, 3) → 3) Create testing scope (Authentication,
            Discover, Challenges, Dojos) → 4) Add test cases under headings.
          </p>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-emerald-200 bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold text-(--heading-color)">
                Main Title (Folder)
              </h3>
              <label className="mb-2 block text-xs font-medium text-(--muted-color)">
                Select Main Title
              </label>
              <select
                value={selectedMainFolder}
                onChange={(e) => setSelectedMainFolder(e.target.value)}
                className="mb-3 w-full rounded-lg border border-emerald-200 bg-emerald-50/40 px-3 py-2 text-sm text-(--text-color) focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {mainFolders.length === 0 ? (
                  <option value="">No main titles yet</option>
                ) : (
                  mainFolders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {getNodePath(folder.id)}
                    </option>
                  ))
                )}
              </select>

              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={newMainFolderName}
                  onChange={(e) => setNewMainFolderName(e.target.value)}
                  placeholder="Create main title e.g., HSA Cycle"
                  className="w-full rounded-lg border border-emerald-200 bg-emerald-50/40 px-3 py-2 text-sm text-(--text-color) focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <AppButton
                  onClick={handleCreateMainFolder}
                  disabled={creatingNode}
                  variant="primary"
                  size="sm"
                >
                  {creatingNode ? "Creating..." : "Create"}
                </AppButton>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold text-(--heading-color)">
                Child Test Cycles
              </h3>
              <p className="mb-2 text-xs text-(--muted-color)">
                Inside: {selectedMainFolderPath}
              </p>

              <label className="mb-2 block text-xs font-medium text-(--muted-color)">
                Select Child Cycle
              </label>
              <select
                value={selectedCycle}
                onChange={(e) => setSelectedCycle(e.target.value)}
                className="mb-3 w-full rounded-lg border border-emerald-200 bg-emerald-50/40 px-3 py-2 text-sm text-(--text-color) focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {childCycles.length === 0 ? (
                  <option value="">No child cycles yet</option>
                ) : (
                  childCycles.map((cycle) => (
                    <option key={cycle.id} value={cycle.id}>
                      {getNodePath(cycle.id)}
                    </option>
                  ))
                )}
              </select>

              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={newChildCycleName}
                  onChange={(e) => setNewChildCycleName(e.target.value)}
                  placeholder="Create child cycle e.g., Test Cycle 2"
                  className="w-full rounded-lg border border-emerald-200 bg-emerald-50/40 px-3 py-2 text-sm text-(--text-color) focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <AppButton
                  onClick={handleCreateChildCycle}
                  disabled={creatingNode || !selectedMainFolder}
                  variant="primary"
                  size="sm"
                >
                  {creatingNode ? "Creating..." : "Create Child"}
                </AppButton>
              </div>

              <div className="mt-4 border-t border-emerald-100 pt-4">
                <label className="mb-2 block text-xs font-medium text-(--muted-color)">
                  Testing Scope (inside selected child cycle)
                </label>
                <select
                  value={selectedScopeId}
                  onChange={(e) => setSelectedScopeId(e.target.value)}
                  className="mb-3 w-full rounded-lg border border-emerald-200 bg-emerald-50/40 px-3 py-2 text-sm text-(--text-color) focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {scopeNodes.length === 0 ? (
                    <option value="">No scope yet</option>
                  ) : (
                    scopeNodes.map((scope) => (
                      <option key={scope.id} value={scope.id}>
                        {scope.name}
                      </option>
                    ))
                  )}
                </select>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={newScopeName}
                    onChange={(e) => setNewScopeName(e.target.value)}
                    placeholder="Create scope e.g., Authentication"
                    className="w-full rounded-lg border border-emerald-200 bg-emerald-50/40 px-3 py-2 text-sm text-(--text-color) focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <AppButton
                    onClick={handleCreateScope}
                    disabled={creatingNode || !selectedCycle}
                    variant="primary"
                    size="sm"
                  >
                    {creatingNode ? "Creating..." : "Create Scope"}
                  </AppButton>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Manual Test Case Creation */}
        <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-bold text-(--heading-color)">
            Create Test Case
          </h2>
          <p className="mb-4 text-xs text-(--muted-color)">
            Main Title: {selectedMainFolderPath} • Child Cycle:{" "}
            {selectedCycle
              ? getNodePath(selectedCycle)
              : "Select a child cycle"}{" "}
            • Scope: {selectedScopeName || "Select/create a scope"}
          </p>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold text-(--heading-color)">
                Testing Scope
              </label>
              <select
                value={selectedScopeId}
                onChange={(e) => setSelectedScopeId(e.target.value)}
                className="w-full rounded-lg border border-emerald-200 bg-emerald-50/40 px-3 py-2 text-sm text-(--text-color) focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {scopeNodes.length === 0 ? (
                  <option value="">No scope yet</option>
                ) : (
                  scopeNodes.map((scope) => (
                    <option key={scope.id} value={scope.id}>
                      {scope.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-(--heading-color)">
                Test Case ID
              </label>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 px-3 py-2 text-sm text-(--muted-color)">
                Auto-generated (TC-001, TC-002...)
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-semibold text-(--heading-color)">
                Section / Heading (e.g., Login Test Cases)
              </label>
              <input
                type="text"
                value={newCaseSectionName}
                onChange={(e) => setNewCaseSectionName(e.target.value)}
                placeholder="Login Test Cases"
                className="w-full rounded-lg border border-emerald-200 bg-emerald-50/40 px-3 py-2 text-sm text-(--text-color) focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-(--heading-color)">
                STATUS
              </label>
              <select
                value={newCaseStatus}
                onChange={(e) =>
                  setNewCaseStatus(e.target.value as TestExecutionStatus)
                }
                className="w-full rounded-lg border border-emerald-200 bg-emerald-50/40 px-3 py-2 text-sm text-(--text-color) focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="NOT_RUN">PENDING</option>
                <option value="PASS">PASS</option>
                <option value="FAIL">FAIL</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-semibold text-(--heading-color)">
                TITLE
              </label>
              <input
                type="text"
                value={newCaseTitle}
                onChange={(e) => setNewCaseTitle(e.target.value)}
                placeholder="User can login with valid credentials"
                className="w-full rounded-lg border border-emerald-200 bg-emerald-50/40 px-3 py-2 text-sm text-(--text-color) focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-semibold text-(--heading-color)">
                STEPS
              </label>
              <textarea
                value={newCaseSteps}
                onChange={(e) => setNewCaseSteps(e.target.value)}
                placeholder="1. Open app\n2. Enter username/password\n3. Click Login"
                className="h-28 w-full resize-none rounded-lg border border-emerald-200 bg-emerald-50/40 px-3 py-2 text-sm text-(--text-color) focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-semibold text-(--heading-color)">
                REMARKS
              </label>
              <input
                type="text"
                value={newCaseRemarks}
                onChange={(e) => setNewCaseRemarks(e.target.value)}
                placeholder="Optional initial remarks"
                className="w-full rounded-lg border border-emerald-200 bg-emerald-50/40 px-3 py-2 text-sm text-(--text-color) focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <AppButton
              onClick={handleCreateTestCase}
              disabled={creatingTestCase || !selectedCycle || !selectedScopeId}
              variant="primary"
              size="sm"
              title="Create test case"
            >
              {creatingTestCase ? "Creating..." : "Create Test Case"}
            </AppButton>
          </div>
        </div>

        {/* Test Cases Table */}
        <div className="w-full overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
          <div className="p-6">
            <h2 className="mb-6 text-xl font-bold text-(--heading-color)">
              Test Cases
            </h2>
            <p className="mb-4 text-xs text-(--muted-color)">
              Main: {selectedMainFolderPath} • Child:{" "}
              {selectedCycle ? getNodePath(selectedCycle) : "Not selected"}
            </p>

            <div className="mb-5 rounded-xl border border-emerald-100 bg-emerald-50/30 p-3">
              <div className="grid gap-3 md:grid-cols-4">
                <input
                  type="text"
                  value={caseSearch}
                  onChange={(e) => setCaseSearch(e.target.value)}
                  placeholder="Search by ID, title, or steps"
                  className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-(--text-color) focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <select
                  value={caseScopeFilter}
                  onChange={(e) => setCaseScopeFilter(e.target.value)}
                  className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-(--text-color) focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="ALL">All Scopes</option>
                  {availableScopes.map((scope) => (
                    <option key={scope} value={scope}>
                      {scope}
                    </option>
                  ))}
                </select>
                <select
                  value={caseHeadingFilter}
                  onChange={(e) => setCaseHeadingFilter(e.target.value)}
                  className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-(--text-color) focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="ALL">All Headings</option>
                  {availableHeadings.map((heading) => (
                    <option key={heading} value={heading}>
                      {heading}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <select
                    value={caseStatusFilter}
                    onChange={(e) =>
                      setCaseStatusFilter(
                        e.target.value as "ALL" | TestExecutionStatus,
                      )
                    }
                    className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-(--text-color) focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="NOT_RUN">PENDING</option>
                    <option value="PASS">PASS</option>
                    <option value="FAIL">FAIL</option>
                  </select>
                  <AppButton
                    onClick={clearCaseFilters}
                    variant="secondary"
                    size="sm"
                    title="Clear all filters"
                  >
                    Clear
                  </AppButton>
                </div>
              </div>
              <p className="mt-2 text-xs text-(--muted-color)">
                Showing {filteredTestCases.length} of {testCases.length} test
                cases
              </p>
            </div>

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
            ) : filteredTestCases.length === 0 ? (
              <div className="text-center py-12">
                <HiExclamationCircle className="mx-auto mb-3 h-12 w-12 text-(--muted-color)" />
                <p className="text-(--muted-color)">
                  No test cases match current filters
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
                    {groupedTestCases.flatMap((group) => [
                      <tr
                        key={`heading-${group.moduleName}-${group.heading}`}
                        className="border-y border-emerald-200 bg-emerald-100/70"
                      >
                        <td
                          colSpan={6}
                          className="px-4 py-2 text-xs font-bold uppercase tracking-wide text-emerald-800"
                        >
                          {group.moduleName} / {group.heading} (
                          {group.items.length})
                        </td>
                      </tr>,
                      ...group.items.map((testCase, idx) => (
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
                      )),
                    ])}
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
              Save Snapshot & Reset Cycle
            </h3>
            <p className="mb-5 text-sm text-(--muted-color)">
              Save current progress as a snapshot. Then all test case statuses
              will reset to PENDING.
            </p>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-(--heading-color)">
                  Snapshot Name
                </label>
                <input
                  type="text"
                  value={newCycleFolderName}
                  onChange={(e) => setNewCycleFolderName(e.target.value)}
                  placeholder="e.g., HSA Cycle Snapshot - 12 Apr 2026"
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
                  {savingRun ? "Saving..." : "Save & Reset"}
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
