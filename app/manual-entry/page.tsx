"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  HiArrowLeft,
  HiPlus,
  HiCheckCircle,
  HiExclamationCircle,
  HiTrash,
  HiEye,
  HiX,
} from "react-icons/hi";
import AppButton from "@/app/components/common/AppButton";
import CSVUpload from "@/app/components/uploads/CSVUpload";
import {
  createManualDefect,
  deleteManualDefect,
  getManualDefects,
  ManualDefectInput,
} from "@/app/actions/defects";
import { getDefectById } from "@/app/actions/detailsActions";
import {
  Defect,
  Severity,
  Status,
  QCStatusBBT,
  SeverityEnum,
  StatusEnum,
  QCStatusBBTEnum,
} from "@/lib/types";

interface EditableRow {
  id: string;
  testCaseId: string;
  module: string;
  priority: string;
  severity: Severity;
  status: Status;
  qcStatusBbt: QCStatusBBT;
  issueTestDate: string;
  fixedDate: string;
  sheetType: string;
}

type TestType = "smoke" | "cycle";

const SHEET_TYPES = [
  "Smoke Testing Sheet",
  "KFQ Cycle",
  "HSA Cycle",
  "GMST Cycle",
];

const PRIORITY_OPTIONS = Object.values(SeverityEnum);

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-emerald-100 text-emerald-700 border-emerald-200",
  MEDIUM: "bg-amber-100 text-amber-700 border-amber-200",
  HIGH: "bg-orange-100 text-orange-700 border-orange-200",
  MAJOR: "bg-rose-100 text-rose-700 border-rose-200",
};

const SEVERITY_COLORS: Record<Severity, string> = {
  LOW: "bg-emerald-100 text-emerald-700 border-emerald-200",
  MEDIUM: "bg-amber-100 text-amber-700 border-amber-200",
  HIGH: "bg-orange-100 text-orange-700 border-orange-200",
  MAJOR: "bg-rose-100 text-rose-700 border-rose-200",
};

const STATUS_COLORS: Record<Status, string> = {
  OPEN: "bg-sky-100 text-sky-700 border-sky-200",
  IN_PROGRESS: "bg-indigo-100 text-indigo-700 border-indigo-200",
  CLOSED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  ON_HOLD: "bg-rose-100 text-rose-700 border-rose-200",
  AS_IT_IS: "bg-slate-100 text-slate-700 border-slate-200",
};

const STATUS_LABELS: Record<Status, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  CLOSED: "Fixed",
  ON_HOLD: "Pending",
  AS_IT_IS: "As it is",
};

function toPriorityLabel(priority: string): string {
  const normalized = priority.toUpperCase();
  if (normalized === "LOW") return "Low";
  if (normalized === "MEDIUM") return "Medium";
  if (normalized === "HIGH") return "High";
  if (normalized === "MAJOR") return "Major";
  return priority;
}

const DEFAULT_NEW_ISSUE: ManualDefectInput = {
  testCaseId: "",
  module: "",
  descriptionSteps: "",
  summary: "",
  expectedResult: "",
  actualResult: "",
  remarks: "",
  testType: "smoke",
  testScenario: "",
  testSteps: "",
  priority: "MEDIUM",
  severity: SeverityEnum.MEDIUM,
  status: StatusEnum.OPEN,
  qcStatusBbt: QCStatusBBTEnum.PENDING,
  issueTestDate: "",
  fixedDate: "",
  sheetType: "Smoke Testing Sheet",
};

function toInputDate(value: Date | string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function mapDefectToRow(defect: Defect): EditableRow {
  return {
    id: defect.id,
    testCaseId: defect.testCaseId || "",
    module: defect.module || "",
    priority: defect.priority || "",
    severity: defect.severity,
    status: defect.status,
    qcStatusBbt: defect.qcStatusBbt,
    issueTestDate: toInputDate(defect.dateReported),
    fixedDate: toInputDate(defect.dateFixed),
    sheetType: defect.sourceFile || "Smoke Testing Sheet",
  };
}

export default function ManualEntryPage() {
  const [rows, setRows] = useState<EditableRow[]>([]);
  const [newIssue, setNewIssue] =
    useState<ManualDefectInput>(DEFAULT_NEW_ISSUE);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [selectedDefect, setSelectedDefect] = useState<Defect | null>(null);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pageLoaded, setPageLoaded] = useState(false);

  const loadRows = async () => {
    setLoading(true);
    setError(null);
    try {
      const defects = await getManualDefects(250);
      setRows(defects.map(mapDefectToRow));
    } catch {
      setError("Failed to load manual issue sheet");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPageLoaded(true);
    loadRows();
  }, []);

  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, error]);

  const updateRow = (id: string, key: keyof EditableRow, value: string) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [key]: value } : row)),
    );
  };

  const onCreateIssue = async () => {
    setCreating(true);
    setMessage(null);
    setError(null);

    const result = await createManualDefect(newIssue);
    if (!result.success) {
      setError(result.message);
      setCreating(false);
      return;
    }

    setMessage(result.message);
    setNewIssue(DEFAULT_NEW_ISSUE);
    await loadRows();
    setCreating(false);
  };

  const onOpenRow = async (id: string) => {
    setOpeningId(id);
    setError(null);

    try {
      const defect = await getDefectById(id);
      if (!defect) {
        setError("Issue details not found");
        return;
      }

      setSelectedDefect(defect);
    } catch {
      setError("Failed to open issue details");
    } finally {
      setOpeningId(null);
    }
  };

  const onDeleteRow = async (id: string) => {
    const confirmed = window.confirm(
      "Remove this issue from the sheet? This action cannot be undone.",
    );
    if (!confirmed) return;

    setDeletingId(id);
    setMessage(null);
    setError(null);

    const result = await deleteManualDefect(id);
    if (!result.success) {
      setError(result.message);
      setDeletingId(null);
      return;
    }

    setRows((prev) => prev.filter((row) => row.id !== id));
    setMessage(result.message);
    setDeletingId(null);
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-(--page-background)">
      <div className="relative z-10 flex w-full min-h-screen flex-col overflow-hidden">
        {/* Header - Full Width */}
        <div
          className={`w-full px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 transition-all duration-1000 transform ${
            pageLoaded
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-10"
          }`}
        >
          <div className="mx-auto w-full max-w-screen-2xl">
            <Link
              href="/"
              className="group mb-4 inline-flex transform items-center gap-2 text-(--muted-color) transition-all duration-300 hover:translate-x-1 hover:text-(--primary-color)"
            >
              <HiArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Back to Dashboard</span>
            </Link>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-(--heading-color) sm:text-3xl lg:text-4xl">
                Manual Issue Sheet
              </h1>
              <p className="max-w-2xl text-xs text-(--muted-color) sm:text-sm">
                Enter issues directly in-platform and update status, priority,
                severity, QC status, issue test date, and fixed date.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content - Scrollable */}
        <div className="flex-1 w-full overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 scroll-smooth">
          <div className="mx-auto w-full max-w-screen-2xl space-y-6">
            {/* CSV Upload */}
            <div
              className={`rounded-2xl border border-(--border-color) bg-(--surface) p-6 shadow-card transition-all duration-1000 transform ${
                pageLoaded
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
            >
              <h2 className="mb-2 text-lg font-bold text-(--heading-color) sm:text-xl">
                Upload CSV
              </h2>
              <p className="mb-5 text-xs text-(--muted-color) sm:text-sm">
                Upload issue sheets from CSV. Imported defects will appear in
                the table below.
              </p>

              <CSVUpload
                onUploadSuccess={(result) => {
                  setMessage(result.message);
                  setError(null);
                  void loadRows();
                }}
                onUploadError={(uploadError) => {
                  setError(uploadError);
                  setMessage(null);
                }}
              />
            </div>

            {/* Add Issue Form */}
            <div
              className={`rounded-2xl border border-(--border-color) bg-(--surface) p-6 shadow-card transition-all duration-1000 transform ${
                pageLoaded
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              } group`}
            >
              <h2 className="mb-5 flex items-center gap-3 text-lg font-bold text-(--heading-color) sm:text-xl">
                <div className="rounded-lg bg-(--primary-color) p-2">
                  <HiPlus className="w-5 h-5 text-white" />
                </div>
                Add New Issue
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1.5">
                    Test Type
                  </label>
                  <select
                    value={(newIssue.testType as TestType) || "smoke"}
                    onChange={(e) => {
                      const testType = e.target.value as TestType;
                      setNewIssue((prev) => ({
                        ...prev,
                        testType,
                        testScenario:
                          testType === "cycle" ? prev.testScenario || "" : "",
                        testSteps:
                          testType === "cycle" ? prev.testSteps || "" : "",
                        sheetType:
                          testType === "smoke"
                            ? "Smoke Testing Sheet"
                            : prev.sheetType || "KFQ Cycle",
                      }));
                    }}
                    className="w-full rounded-lg border border-(--border-color) bg-(--surface-soft) px-4 py-2.5 text-sm text-(--text-color) transition-all duration-200 focus:border-(--primary-color) focus:outline-none focus:ring-2 focus:ring-(--primary-color)/20"
                  >
                    <option value="smoke">Smoke Test</option>
                    <option value="cycle">Cycle Test</option>
                  </select>
                </div>

                {[
                  {
                    label: "Test Case ID",
                    placeholder: "ST-01",
                    value: newIssue.testCaseId,
                    key: "testCaseId",
                  },
                  {
                    label: "Fork and Module",
                    placeholder: "KFQ - Home",
                    value: newIssue.module,
                    key: "module",
                  },
                ].map((field, idx) => (
                  <div key={idx}>
                    <label className="block text-xs text-slate-300 mb-1.5">
                      {field.label}
                    </label>
                    <input
                      placeholder={field.placeholder}
                      value={field.value}
                      onChange={(e) =>
                        setNewIssue((prev) => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-(--border-color) bg-(--surface-soft) px-4 py-2.5 text-sm text-(--text-color) placeholder-(--muted-color) transition-all duration-200 focus:border-(--primary-color) focus:outline-none focus:ring-2 focus:ring-(--primary-color)/20"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs text-slate-300 mb-1.5">
                    Priority
                  </label>
                  <select
                    value={newIssue.priority}
                    onChange={(e) =>
                      setNewIssue((prev) => ({
                        ...prev,
                        priority: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-(--border-color) bg-(--surface-soft) px-4 py-2.5 text-sm text-(--text-color) transition-all duration-200 focus:border-(--primary-color) focus:outline-none focus:ring-2 focus:ring-(--primary-color)/20"
                  >
                    {PRIORITY_OPTIONS.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1.5">
                    {(newIssue.testType || "smoke") === "smoke"
                      ? "Sheet"
                      : "Cycle"}
                  </label>
                  <select
                    value={newIssue.sheetType || "Smoke Testing Sheet"}
                    onChange={(e) =>
                      setNewIssue((prev) => ({
                        ...prev,
                        sheetType: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-(--border-color) bg-(--surface-soft) px-4 py-2.5 text-sm text-(--text-color) transition-all duration-200 focus:border-(--primary-color) focus:outline-none focus:ring-2 focus:ring-(--primary-color)/20"
                  >
                    {(newIssue.testType || "smoke") === "smoke" ? (
                      <option value="Smoke Testing Sheet">
                        Smoke Testing Sheet
                      </option>
                    ) : (
                      SHEET_TYPES.filter(
                        (sheetType) => sheetType !== "Smoke Testing Sheet",
                      ).map((sheetType) => (
                        <option key={sheetType} value={sheetType}>
                          {sheetType}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <select
                  value={newIssue.severity}
                  onChange={(e) =>
                    setNewIssue((prev) => ({
                      ...prev,
                      severity: e.target.value as Severity,
                    }))
                  }
                  className="rounded-lg border border-(--border-color) bg-(--surface-soft) px-4 py-2.5 text-sm text-(--text-color) transition-all duration-200 focus:border-(--primary-color) focus:outline-none focus:ring-2 focus:ring-(--primary-color)/20"
                >
                  {Object.values(SeverityEnum).map((severity) => (
                    <option key={severity} value={severity}>
                      {severity}
                    </option>
                  ))}
                </select>
                <select
                  value={newIssue.status}
                  onChange={(e) =>
                    setNewIssue((prev) => ({
                      ...prev,
                      status: e.target.value as Status,
                    }))
                  }
                  className="rounded-lg border border-(--border-color) bg-(--surface-soft) px-4 py-2.5 text-sm text-(--text-color) transition-all duration-200 focus:border-(--primary-color) focus:outline-none focus:ring-2 focus:ring-(--primary-color)/20"
                >
                  {Object.values(StatusEnum).map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <select
                  value={newIssue.qcStatusBbt}
                  onChange={(e) =>
                    setNewIssue((prev) => ({
                      ...prev,
                      qcStatusBbt: e.target.value as QCStatusBBT,
                    }))
                  }
                  className="rounded-lg border border-(--border-color) bg-(--surface-soft) px-4 py-2.5 text-sm text-(--text-color) transition-all duration-200 focus:border-(--primary-color) focus:outline-none focus:ring-2 focus:ring-(--primary-color)/20"
                >
                  {Object.values(QCStatusBBTEnum).map((qcStatus) => (
                    <option key={qcStatus} value={qcStatus}>
                      {qcStatus}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={newIssue.issueTestDate}
                  onChange={(e) =>
                    setNewIssue((prev) => ({
                      ...prev,
                      issueTestDate: e.target.value,
                    }))
                  }
                  className="rounded-lg border border-(--border-color) bg-(--surface-soft) px-4 py-2.5 text-sm text-(--text-color) transition-all duration-200 focus:border-(--primary-color) focus:outline-none focus:ring-2 focus:ring-(--primary-color)/20"
                />
                <input
                  type="date"
                  value={newIssue.fixedDate || ""}
                  onChange={(e) =>
                    setNewIssue((prev) => ({
                      ...prev,
                      fixedDate: e.target.value,
                    }))
                  }
                  className="rounded-lg border border-(--border-color) bg-(--surface-soft) px-4 py-2.5 text-sm text-(--text-color) transition-all duration-200 focus:border-(--primary-color) focus:outline-none focus:ring-2 focus:ring-(--primary-color)/20"
                />
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <textarea
                  placeholder="Description / Steps to Reproduce"
                  value={newIssue.descriptionSteps || ""}
                  onChange={(e) =>
                    setNewIssue((prev) => ({
                      ...prev,
                      descriptionSteps: e.target.value,
                    }))
                  }
                  className="min-h-25 resize-none rounded-lg border border-(--border-color) bg-(--surface-soft) px-4 py-2.5 text-sm text-(--text-color) placeholder-(--muted-color) transition-all duration-200 focus:border-(--primary-color) focus:outline-none focus:ring-2 focus:ring-(--primary-color)/20"
                />
                <textarea
                  placeholder="Expected Result"
                  value={newIssue.expectedResult}
                  onChange={(e) =>
                    setNewIssue((prev) => ({
                      ...prev,
                      expectedResult: e.target.value,
                    }))
                  }
                  className="min-h-25 resize-none rounded-lg border border-(--border-color) bg-(--surface-soft) px-4 py-2.5 text-sm text-(--text-color) placeholder-(--muted-color) transition-all duration-200 focus:border-(--primary-color) focus:outline-none focus:ring-2 focus:ring-(--primary-color)/20"
                />
                <textarea
                  placeholder="Actual Result"
                  value={newIssue.actualResult}
                  onChange={(e) =>
                    setNewIssue((prev) => ({
                      ...prev,
                      actualResult: e.target.value,
                    }))
                  }
                  className="min-h-25 resize-none rounded-lg border border-(--border-color) bg-(--surface-soft) px-4 py-2.5 text-sm text-(--text-color) placeholder-(--muted-color) transition-all duration-200 focus:border-(--primary-color) focus:outline-none focus:ring-2 focus:ring-(--primary-color)/20"
                />
                <textarea
                  placeholder="Remarks / Notes"
                  value={newIssue.remarks || ""}
                  onChange={(e) =>
                    setNewIssue((prev) => ({
                      ...prev,
                      remarks: e.target.value,
                    }))
                  }
                  className="min-h-25 resize-none rounded-lg border border-(--border-color) bg-(--surface-soft) px-4 py-2.5 text-sm text-(--text-color) placeholder-(--muted-color) transition-all duration-200 focus:border-(--primary-color) focus:outline-none focus:ring-2 focus:ring-(--primary-color)/20"
                />
              </div>

              {(newIssue.testType || "smoke") === "cycle" && (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <textarea
                    placeholder="Test Scenario (for cycle test)"
                    value={newIssue.testScenario || ""}
                    onChange={(e) =>
                      setNewIssue((prev) => ({
                        ...prev,
                        testScenario: e.target.value,
                      }))
                    }
                    className="min-h-25 resize-none rounded-lg border border-(--border-color) bg-(--surface-soft) px-4 py-2.5 text-sm text-(--text-color) placeholder-(--muted-color) transition-all duration-200 focus:border-(--primary-color) focus:outline-none focus:ring-2 focus:ring-(--primary-color)/20"
                  />
                  <textarea
                    placeholder="Test Steps (for cycle test)"
                    value={newIssue.testSteps || ""}
                    onChange={(e) =>
                      setNewIssue((prev) => ({
                        ...prev,
                        testSteps: e.target.value,
                      }))
                    }
                    className="min-h-25 resize-none rounded-lg border border-(--border-color) bg-(--surface-soft) px-4 py-2.5 text-sm text-(--text-color) placeholder-(--muted-color) transition-all duration-200 focus:border-(--primary-color) focus:outline-none focus:ring-2 focus:ring-(--primary-color)/20"
                  />
                </div>
              )}

              <div className="mt-3">
                <label className="block text-xs text-slate-300 mb-1.5">
                  Summary / Title (optional)
                </label>
                <input
                  placeholder="Summary / Title"
                  value={newIssue.summary || ""}
                  onChange={(e) =>
                    setNewIssue((prev) => ({
                      ...prev,
                      summary: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-(--border-color) bg-(--surface-soft) px-4 py-2.5 text-sm text-(--text-color) placeholder-(--muted-color) transition-all duration-200 focus:border-(--primary-color) focus:outline-none focus:ring-2 focus:ring-(--primary-color)/20"
                />
              </div>

              <AppButton
                onClick={onCreateIssue}
                disabled={creating}
                variant="primary"
                className="mt-5 px-6 py-3"
              >
                <HiPlus className="w-5 h-5" />
                {creating ? "Adding..." : "Add Issue"}
              </AppButton>
            </div>

            {/* Messages */}
            {message && (
              <div
                className={`flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 animate-in fade-in slide-in-from-top duration-300 transition-all`}
              >
                <HiCheckCircle className="h-5 w-5 shrink-0 text-emerald-600" />
                <p className="text-sm font-medium text-emerald-700">
                  {message}
                </p>
              </div>
            )}
            {error && (
              <div
                className={`flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 animate-in fade-in slide-in-from-top duration-300 transition-all`}
              >
                <HiExclamationCircle className="h-5 w-5 shrink-0 text-rose-600" />
                <p className="text-sm font-medium text-rose-700">{error}</p>
              </div>
            )}

            {/* Issue Sheet Table */}
            <div
              className={`overflow-hidden rounded-2xl border border-(--border-color) bg-(--surface) shadow-card transition-all duration-1000 transform ${
                pageLoaded
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              } animation-delay-300`}
            >
              <div className="border-b border-(--border-color) bg-(--surface-soft) px-6 py-4">
                <h2 className="text-xl font-bold text-(--heading-color)">
                  Issue Sheet
                </h2>
                <p className="mt-1.5 flex items-center gap-2 text-xs text-(--muted-color)">
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-semibold text-emerald-700">
                    {rows.length}
                  </span>
                  Use Open to view details and Remove to delete issues.
                </p>
              </div>

              <div className="max-h-128 overflow-x-auto">
                <table className="min-w-7xl w-full table-fixed text-sm lg:min-w-370">
                  <thead className="sticky top-0 border-b border-(--border-color) bg-(--surface-soft)">
                    <tr className="text-left text-(--muted-color)">
                      <th className="w-47.5 px-4 py-3 text-xs font-semibold uppercase tracking-wider">
                        Sheet Type
                      </th>
                      <th className="w-32.5 px-4 py-3 text-xs font-semibold uppercase tracking-wider">
                        Test Case ID
                      </th>
                      <th className="w-52.5 px-4 py-3 text-xs font-semibold uppercase tracking-wider">
                        Module
                      </th>
                      <th className="w-37.5 px-4 py-3 text-xs font-semibold uppercase tracking-wider">
                        Issue Test Date
                      </th>
                      <th className="w-37.5 px-4 py-3 text-xs font-semibold uppercase tracking-wider">
                        Fixed Date
                      </th>
                      <th className="w-30 px-4 py-3 text-xs font-semibold uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="w-32.5 px-4 py-3 text-xs font-semibold uppercase tracking-wider">
                        Severity
                      </th>
                      <th className="w-35 px-4 py-3 text-xs font-semibold uppercase tracking-wider">
                        Status
                      </th>
                      <th className="w-35 px-4 py-3 text-xs font-semibold uppercase tracking-wider">
                        QC Status
                      </th>
                      <th className="w-47.5 px-4 py-3 text-xs font-semibold uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td
                          className="px-4 py-8 text-center text-(--muted-color)"
                          colSpan={10}
                        >
                          <div className="space-y-3 animate-pulse">
                            {[...Array(5)].map((_, index) => (
                              <div
                                key={index}
                                className="h-12 rounded-lg bg-(--surface-soft)"
                              />
                            ))}
                          </div>
                        </td>
                      </tr>
                    ) : rows.length === 0 ? (
                      <tr>
                        <td
                          className="px-4 py-8 text-center text-(--muted-color)"
                          colSpan={10}
                        >
                          No issues yet. Add your first issue above.
                        </td>
                      </tr>
                    ) : (
                      rows.map((row, idx) => (
                        <tr
                          key={row.id}
                          className={`group animate-in fade-in border-t border-(--border-color) transition-all duration-500 hover:bg-emerald-50`}
                          style={{ animationDelay: `${idx * 50}ms` }}
                        >
                          <td className="px-4 py-3 align-top text-xs font-semibold text-(--text-color)">
                            <span className="inline-flex max-w-42.5 truncate whitespace-nowrap rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-700">
                              {row.sheetType || "-"}
                            </span>
                          </td>
                          <td className="px-4 py-3 align-top whitespace-nowrap text-(--text-color)">
                            {row.testCaseId || "-"}
                          </td>
                          <td
                            className="px-4 py-3 align-top truncate text-(--text-color)"
                            title={row.module || ""}
                          >
                            {row.module || "-"}
                          </td>
                          <td className="px-4 py-3 align-top">
                            <input
                              type="date"
                              value={row.issueTestDate}
                              onChange={(e) =>
                                updateRow(
                                  row.id,
                                  "issueTestDate",
                                  e.target.value,
                                )
                              }
                              className="w-full rounded-lg border border-(--border-color) bg-(--surface-soft) px-3 py-1.5 text-xs text-(--text-color) transition-all duration-200 focus:border-(--primary-color) focus:outline-none focus:ring-1 focus:ring-(--primary-color)/50"
                            />
                          </td>
                          <td className="px-4 py-3 align-top">
                            <input
                              type="date"
                              value={row.fixedDate}
                              onChange={(e) =>
                                updateRow(row.id, "fixedDate", e.target.value)
                              }
                              className="w-full rounded-lg border border-(--border-color) bg-(--surface-soft) px-3 py-1.5 text-xs text-(--text-color) transition-all duration-200 focus:border-(--primary-color) focus:outline-none focus:ring-1 focus:ring-(--primary-color)/50"
                            />
                          </td>
                          <td className="px-4 py-3 align-top">
                            <select
                              value={row.priority}
                              onChange={(e) =>
                                updateRow(row.id, "priority", e.target.value)
                              }
                              className={`w-full rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-1 ${PRIORITY_COLORS[row.priority?.toUpperCase()] || "border-slate-200 bg-slate-100 text-slate-700"}`}
                            >
                              {PRIORITY_OPTIONS.map((priority) => (
                                <option key={priority} value={priority}>
                                  {toPriorityLabel(priority)}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <select
                              value={row.severity}
                              onChange={(e) =>
                                updateRow(row.id, "severity", e.target.value)
                              }
                              className={`w-full rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-1 ${SEVERITY_COLORS[row.severity] || "border-slate-200 bg-slate-100 text-slate-700"}`}
                            >
                              {Object.values(SeverityEnum).map((severity) => (
                                <option key={severity} value={severity}>
                                  {toPriorityLabel(severity)}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <select
                              value={row.status}
                              onChange={(e) =>
                                updateRow(row.id, "status", e.target.value)
                              }
                              className={`w-full rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-1 ${STATUS_COLORS[row.status] || "border-slate-200 bg-slate-100 text-slate-700"}`}
                            >
                              {Object.values(StatusEnum).map((status) => (
                                <option key={status} value={status}>
                                  {STATUS_LABELS[status] || status}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <select
                              value={row.qcStatusBbt}
                              onChange={(e) =>
                                updateRow(row.id, "qcStatusBbt", e.target.value)
                              }
                              className="w-full rounded-lg border border-(--border-color) bg-(--surface-soft) px-3 py-1.5 text-xs text-(--text-color) transition-all duration-200 focus:border-(--primary-color) focus:outline-none focus:ring-1 focus:ring-(--primary-color)/50"
                            >
                              {Object.values(QCStatusBBTEnum).map(
                                (qcStatus) => (
                                  <option key={qcStatus} value={qcStatus}>
                                    {qcStatus}
                                  </option>
                                ),
                              )}
                            </select>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                              <AppButton
                                onClick={() => onOpenRow(row.id)}
                                disabled={
                                  openingId === row.id || deletingId === row.id
                                }
                                variant="primary"
                                size="sm"
                              >
                                <HiEye className="w-4 h-4" />
                                {openingId === row.id ? "Opening" : "Open"}
                              </AppButton>
                              <AppButton
                                onClick={() => onDeleteRow(row.id)}
                                disabled={
                                  deletingId === row.id || openingId === row.id
                                }
                                title="Remove issue"
                                aria-label="Remove issue"
                                variant="danger"
                                size="icon"
                              >
                                <HiTrash className="w-4 h-4" />
                              </AppButton>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedDefect && (
        <div className="fixed inset-0 z-50 overlay-backdrop-strong backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-(--border-color) bg-(--surface) shadow-2xl">
            <div className="flex items-center justify-between border-b border-(--border-color) bg-(--surface-soft) px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-(--heading-color)">
                  Issue Details
                </h3>
                <p className="mt-1 text-xs text-(--muted-color)">
                  {selectedDefect.testCaseId || selectedDefect.id}
                </p>
              </div>
              <button
                onClick={() => setSelectedDefect(null)}
                className="rounded-lg p-2 text-(--muted-color) transition-colors hover:bg-emerald-50 hover:text-(--heading-color)"
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg border border-(--border-color) bg-(--surface-soft) p-4">
                  <p className="mb-2 text-xs uppercase tracking-wide text-(--muted-color)">
                    Severity
                  </p>
                  <p className="text-sm font-semibold text-(--text-color)">
                    {selectedDefect.severity}
                  </p>
                </div>
                <div className="rounded-lg border border-(--border-color) bg-(--surface-soft) p-4">
                  <p className="mb-2 text-xs uppercase tracking-wide text-(--muted-color)">
                    Priority
                  </p>
                  <p className="text-sm font-semibold text-(--text-color)">
                    {selectedDefect.priority || "-"}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-(--border-color) bg-(--surface-soft) p-4">
                <p className="mb-2 text-xs uppercase tracking-wide text-(--muted-color)">
                  Summary / Title
                </p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-(--text-color)">
                  {selectedDefect.summary || selectedDefect.testScenario || "-"}
                </p>
              </div>

              {(selectedDefect.descriptionSteps ||
                selectedDefect.testSteps) && (
                <div className="rounded-lg border border-(--border-color) bg-(--surface-soft) p-4">
                  <p className="mb-2 text-xs uppercase tracking-wide text-(--muted-color)">
                    Description / Steps
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-(--text-color)">
                    {selectedDefect.descriptionSteps ||
                      selectedDefect.testSteps}
                  </p>
                </div>
              )}

              {selectedDefect.expectedResult && (
                <div className="rounded-lg border border-(--border-color) bg-(--surface-soft) p-4">
                  <p className="mb-2 text-xs uppercase tracking-wide text-(--muted-color)">
                    Expected Result
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-(--text-color)">
                    {selectedDefect.expectedResult}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
