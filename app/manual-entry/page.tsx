"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HiArrowLeft, HiPlus, HiSave, HiCheckCircle, HiExclamationCircle } from "react-icons/hi";
import CSVUpload from "@/app/components/uploads/CSVUpload";
import {
  createManualDefect,
  getManualDefects,
  updateManualDefect,
  ManualDefectInput,
} from "@/app/actions/defects";
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
  priority: "Medium",
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
  const [newIssue, setNewIssue] = useState<ManualDefectInput>(DEFAULT_NEW_ISSUE);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
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
    } catch (err) {
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
      prev.map((row) => (row.id === id ? { ...row, [key]: value } : row))
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

  const onSaveRow = async (row: EditableRow) => {
    setSavingId(row.id);
    setMessage(null);
    setError(null);

    const result = await updateManualDefect(row.id, {
      issueTestDate: row.issueTestDate,
      fixedDate: row.fixedDate || null,
      priority: row.priority,
      severity: row.severity,
      status: row.status,
      qcStatusBbt: row.qcStatusBbt,
    });

    if (!result.success) {
      setError(result.message);
      setSavingId(null);
      return;
    }

    setMessage(result.message);
    setSavingId(null);
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background gradient */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full min-h-screen flex flex-col overflow-hidden">
        {/* Header */}
        <div className={`px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 transition-all duration-1000 transform ${
          pageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'
        }`}>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-all duration-300 transform hover:translate-x-1 mb-4 group"
          >
            <HiArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </Link>
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Manual Issue Sheet
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-2xl">
              Enter issues directly in-platform and update status, priority, severity, QC status, issue test date, and fixed date.
            </p>
          </div>
        </div>

        {/* Main Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 scroll-smooth">
          {/* CSV Upload */}
          <div className={`backdrop-blur-xl bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6 shadow-2xl transition-all duration-1000 transform ${
            pageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          } hover:border-slate-700/50 hover:shadow-blue-900/20`}>
            <h2 className="text-lg sm:text-xl font-bold text-white mb-2">Upload CSV</h2>
            <p className="text-slate-400 text-xs sm:text-sm mb-5">
              Upload issue sheets from CSV. Imported defects will appear in the table below.
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
          <div className={`backdrop-blur-xl bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6 shadow-2xl transition-all duration-1000 transform ${
            pageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          } hover:border-slate-700/50 hover:shadow-blue-900/20 group`}>
            <h2 className="text-lg sm:text-xl font-bold text-white mb-5 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 group-hover:animate-pulse">
                <HiPlus className="w-5 h-5 text-white" />
              </div>
              Add New Issue
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1.5">Test Type</label>
                <select
                  value={(newIssue.testType as TestType) || "smoke"}
                  onChange={(e) => {
                    const testType = e.target.value as TestType;
                    setNewIssue((prev) => ({
                      ...prev,
                      testType,
                      testScenario: testType === "cycle" ? prev.testScenario || "" : "",
                      testSteps: testType === "cycle" ? prev.testSteps || "" : "",
                      sheetType: testType === "smoke" ? "Smoke Testing Sheet" : (prev.sheetType || "KFQ Cycle"),
                    }));
                  }}
                  className="w-full bg-slate-800/50 border border-slate-700/50 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 backdrop-blur-sm"
                >
                  <option value="smoke">Smoke Test</option>
                  <option value="cycle">Cycle Test</option>
                </select>
              </div>

              {[
                { label: "Test Case ID", placeholder: "ST-01", value: newIssue.testCaseId, key: "testCaseId" },
                { label: "Fork and Module", placeholder: "KFQ - Home", value: newIssue.module, key: "module" },
                { label: "Priority", placeholder: "Medium", value: newIssue.priority, key: "priority" },
              ].map((field, idx) => (
                <div key={idx}>
                  <label className="block text-xs text-slate-300 mb-1.5">{field.label}</label>
                  <input
                    placeholder={field.placeholder}
                    value={field.value}
                    onChange={(e) => setNewIssue((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full bg-slate-800/50 border border-slate-700/50 text-white rounded-lg px-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 backdrop-blur-sm"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs text-slate-300 mb-1.5">
                  {(newIssue.testType || "smoke") === "smoke" ? "Sheet" : "Cycle"}
                </label>
                <select
                  value={newIssue.sheetType || "Smoke Testing Sheet"}
                  onChange={(e) => setNewIssue((prev) => ({ ...prev, sheetType: e.target.value }))}
                  className="w-full bg-slate-800/50 border border-slate-700/50 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 backdrop-blur-sm"
                >
                  {(newIssue.testType || "smoke") === "smoke" ? (
                    <option value="Smoke Testing Sheet">Smoke Testing Sheet</option>
                  ) : (
                    SHEET_TYPES.filter((sheetType) => sheetType !== "Smoke Testing Sheet").map((sheetType) => (
                      <option key={sheetType} value={sheetType}>{sheetType}</option>
                    ))
                  )}
                </select>
              </div>
              <select
                value={newIssue.severity}
                onChange={(e) => setNewIssue((prev) => ({ ...prev, severity: e.target.value as Severity }))}
                className="bg-slate-800/50 border border-slate-700/50 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all duration-200 backdrop-blur-sm"
              >
                {Object.values(SeverityEnum).map((severity) => (
                  <option key={severity} value={severity}>{severity}</option>
                ))}
              </select>
              <select
                value={newIssue.status}
                onChange={(e) => setNewIssue((prev) => ({ ...prev, status: e.target.value as Status }))}
                className="bg-slate-800/50 border border-slate-700/50 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-200 backdrop-blur-sm"
              >
                {Object.values(StatusEnum).map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <select
                value={newIssue.qcStatusBbt}
                onChange={(e) => setNewIssue((prev) => ({ ...prev, qcStatusBbt: e.target.value as QCStatusBBT }))}
                className="bg-slate-800/50 border border-slate-700/50 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 backdrop-blur-sm"
              >
                {Object.values(QCStatusBBTEnum).map((qcStatus) => (
                  <option key={qcStatus} value={qcStatus}>{qcStatus}</option>
                ))}
              </select>
              <input
                type="date"
                value={newIssue.issueTestDate}
                onChange={(e) => setNewIssue((prev) => ({ ...prev, issueTestDate: e.target.value }))}
                className="bg-slate-800/50 border border-slate-700/50 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all duration-200 backdrop-blur-sm"
              />
              <input
                type="date"
                value={newIssue.fixedDate || ""}
                onChange={(e) => setNewIssue((prev) => ({ ...prev, fixedDate: e.target.value }))}
                className="bg-slate-800/50 border border-slate-700/50 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200 backdrop-blur-sm"
              />
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <textarea
                placeholder="Description / Steps to Reproduce"
                value={newIssue.descriptionSteps || ""}
                onChange={(e) => setNewIssue((prev) => ({ ...prev, descriptionSteps: e.target.value }))}
                className="bg-slate-800/50 border border-slate-700/50 text-white rounded-lg px-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200 backdrop-blur-sm min-h-[100px] resize-none"
              />
              <textarea
                placeholder="Expected Result"
                value={newIssue.expectedResult}
                onChange={(e) => setNewIssue((prev) => ({ ...prev, expectedResult: e.target.value }))}
                className="bg-slate-800/50 border border-slate-700/50 text-white rounded-lg px-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 backdrop-blur-sm min-h-[100px] resize-none"
              />
              <textarea
                placeholder="Actual Result"
                value={newIssue.actualResult}
                onChange={(e) => setNewIssue((prev) => ({ ...prev, actualResult: e.target.value }))}
                className="bg-slate-800/50 border border-slate-700/50 text-white rounded-lg px-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 backdrop-blur-sm min-h-[100px] resize-none"
              />
              <textarea
                placeholder="Remarks / Notes"
                value={newIssue.remarks || ""}
                onChange={(e) => setNewIssue((prev) => ({ ...prev, remarks: e.target.value }))}
                className="bg-slate-800/50 border border-slate-700/50 text-white rounded-lg px-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 backdrop-blur-sm min-h-[100px] resize-none"
              />
            </div>

            {(newIssue.testType || "smoke") === "cycle" && (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <textarea
                  placeholder="Test Scenario (for cycle test)"
                  value={newIssue.testScenario || ""}
                  onChange={(e) => setNewIssue((prev) => ({ ...prev, testScenario: e.target.value }))}
                  className="bg-slate-800/50 border border-slate-700/50 text-white rounded-lg px-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200 backdrop-blur-sm min-h-[100px] resize-none"
                />
                <textarea
                  placeholder="Test Steps (for cycle test)"
                  value={newIssue.testSteps || ""}
                  onChange={(e) => setNewIssue((prev) => ({ ...prev, testSteps: e.target.value }))}
                  className="bg-slate-800/50 border border-slate-700/50 text-white rounded-lg px-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200 backdrop-blur-sm min-h-[100px] resize-none"
                />
              </div>
            )}

            <div className="mt-3">
              <label className="block text-xs text-slate-300 mb-1.5">Summary / Title (optional)</label>
              <input
                placeholder="Summary / Title"
                value={newIssue.summary || ""}
                onChange={(e) => setNewIssue((prev) => ({ ...prev, summary: e.target.value }))}
                className="bg-slate-800/50 border border-slate-700/50 text-white rounded-lg px-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 backdrop-blur-sm w-full"
              />
            </div>

            <button
              onClick={onCreateIssue}
              disabled={creating}
              className="mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-blue-500/50"
            >
              <HiPlus className="w-5 h-5" />
              {creating ? "Adding..." : "Add Issue"}
            </button>
          </div>

          {/* Messages */}
          {message && (
            <div className={`flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-700/50 backdrop-blur-sm animate-in fade-in slide-in-from-top duration-300 transition-all`}>
              <HiCheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              <p className="text-green-300 text-sm font-medium">{message}</p>
            </div>
          )}
          {error && (
            <div className={`flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-red-900/30 to-rose-900/30 border border-red-700/50 backdrop-blur-sm animate-in fade-in slide-in-from-top duration-300 transition-all`}>
              <HiExclamationCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-300 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Issue Sheet Table */}
          <div className={`backdrop-blur-xl bg-slate-900/50 border border-slate-800/50 rounded-2xl overflow-hidden shadow-2xl transition-all duration-1000 transform ${
            pageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          } animation-delay-300`}>
            <div className="px-6 py-4 border-b border-slate-800/50 bg-gradient-to-r from-slate-900/50 to-purple-900/20">
              <h2 className="text-xl font-bold text-white">Issue Sheet</h2>
              <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/50 text-blue-300 font-semibold">
                  {rows.length}
                </span>
                Update values inline, then click Save on each row.
              </p>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="min-w-[980px] lg:min-w-[1200px] w-full text-xs sm:text-sm">
                <thead className="sticky top-0 bg-slate-800/50 border-b border-slate-700/50 backdrop-blur">
                  <tr className="text-left text-slate-300">
                    <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Sheet Type</th>
                    <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Test Case ID</th>
                    <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Module</th>
                    <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Issue Test Date</th>
                    <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Fixed Date</th>
                    <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Priority</th>
                    <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Severity</th>
                    <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">QC Status</th>
                    <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td className="px-4 py-8 text-slate-400 text-center" colSpan={10}>
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"></div>
                          <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce animation-delay-200"></div>
                          <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce animation-delay-400"></div>
                        </div>
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td className="px-4 py-8 text-slate-400 text-center" colSpan={10}>
                        No issues yet. Add your first issue above.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row, idx) => (
                      <tr
                        key={row.id}
                        className={`border-t border-slate-800/30 hover:bg-slate-800/30 transition-all duration-300 group animate-in fade-in duration-500`}
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        <td className="px-4 py-3 text-slate-300 text-xs font-semibold">
                          <span className="px-2 py-1 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            {row.sheetType || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-300">{row.testCaseId || "-"}</td>
                        <td className="px-4 py-3 text-slate-300">{row.module || "-"}</td>
                        <td className="px-4 py-3">
                          <input
                            type="date"
                            value={row.issueTestDate}
                            onChange={(e) => updateRow(row.id, "issueTestDate", e.target.value)}
                            className="bg-slate-700/50 border border-slate-600/50 text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all duration-200"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="date"
                            value={row.fixedDate}
                            onChange={(e) => updateRow(row.id, "fixedDate", e.target.value)}
                            className="bg-slate-700/50 border border-slate-600/50 text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/50 transition-all duration-200"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            value={row.priority}
                            onChange={(e) => updateRow(row.id, "priority", e.target.value)}
                            className="bg-slate-700/50 border border-slate-600/50 text-white rounded-lg px-3 py-1.5 text-xs w-24 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/50 transition-all duration-200"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={row.severity}
                            onChange={(e) => updateRow(row.id, "severity", e.target.value)}
                            className="bg-slate-700/50 border border-slate-600/50 text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 transition-all duration-200"
                          >
                            {Object.values(SeverityEnum).map((severity) => (
                              <option key={severity} value={severity}>{severity}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={row.status}
                            onChange={(e) => updateRow(row.id, "status", e.target.value)}
                            className="bg-slate-700/50 border border-slate-600/50 text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all duration-200"
                          >
                            {Object.values(StatusEnum).map((status) => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={row.qcStatusBbt}
                            onChange={(e) => updateRow(row.id, "qcStatusBbt", e.target.value)}
                            className="bg-slate-700/50 border border-slate-600/50 text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all duration-200"
                          >
                            {Object.values(QCStatusBBTEnum).map((qcStatus) => (
                              <option key={qcStatus} value={qcStatus}>{qcStatus}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => onSaveRow(row)}
                            disabled={savingId === row.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-emerald-500/50"
                          >
                            <HiSave className="w-4 h-4" />
                            {savingId === row.id ? "Saving" : "Save"}
                          </button>
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

      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .animation-delay-200 {
          animation-delay: 200ms;
        }

        .animation-delay-300 {
          animation-delay: 300ms;
        }

        .animation-delay-400 {
          animation-delay: 400ms;
        }
      `}</style>
    </div>
  );
}
