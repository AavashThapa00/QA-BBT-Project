"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HiArrowLeft, HiClipboardCheck, HiClock, HiCheckCircle } from "react-icons/hi";
import { getQCStatusCounts, getQCSummary, getRecentQCDefects } from "@/app/actions/qcDashboard";

interface QCStatus {
  status: string;
  count: number;
}

interface QCSummary {
  totalQC: number;
  pendingQC: number;
  doneQC: number;
}

interface QCRecentDefect {
  id: string;
  testCaseId: string | null;
  module: string;
  status: string;
  qcStatusBbt: string;
  dateReported: string | null;
}

const QC_STATUS_COLORS: Record<string, string> = {
  Pending: "#f59e0b",
  Done: "#10b981",
  UNKNOWN: "#6b7280",
};

const getQcLabel = (qcStatus: string) => {
  return qcStatus === "PASSED" ? "Done" : "Pending";
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "OPEN":
    case "IN_PROGRESS":
      return "Pending";
    case "CLOSED":
      return "Fixed";
    case "ON_HOLD":
      return "Hold";
    case "AS_IT_IS":
      return "As it is";
    default:
      return status;
  }
};

const STATUS_BADGE_COLORS: Record<string, string> = {
  Pending: "#f59e0b",
  Fixed: "#10b981",
  Hold: "#f97316",
  "As it is": "#9ca3af",
};

export default function QCDashboardPage() {
  const [qcStatusCounts, setQcStatusCounts] = useState<QCStatus[]>([]);
  const [qcSummary, setQcSummary] = useState<QCSummary | null>(null);
  const [recentDefects, setRecentDefects] = useState<QCRecentDefect[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [statusCounts, summary, recent] = await Promise.all([
          getQCStatusCounts(),
          getQCSummary(),
          getRecentQCDefects(),
        ]);

        setQcStatusCounts(statusCounts);
        setQcSummary(summary);
        setRecentDefects(recent);
      } catch (error) {
        console.error("Error fetching QC dashboard:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-8">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-700 border-t-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
            >
              <HiArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Dashboard</span>
            </Link>
            <h1 className="text-3xl font-bold text-white">QC Dashboard</h1>
            <p className="text-slate-400 mt-1">Track QC Status by BBT effectively</p>
          </div>
        </div>

        {/* QC Summary */}
        {qcSummary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
              <div className="flex items-center gap-3">
                <HiClipboardCheck className="w-6 h-6 text-blue-400" />
                <div>
                  <p className="text-sm text-slate-400">Total QC</p>
                  <p className="text-2xl font-bold text-white">{qcSummary.totalQC}</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
              <div className="flex items-center gap-3">
                <HiClock className="w-6 h-6 text-amber-400" />
                <div>
                  <p className="text-sm text-slate-400">Pending QC</p>
                  <p className="text-2xl font-bold text-white">{qcSummary.pendingQC}</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
              <div className="flex items-center gap-3">
                <HiCheckCircle className="w-6 h-6 text-green-400" />
                <div>
                  <p className="text-sm text-slate-400">QC Done</p>
                  <p className="text-2xl font-bold text-white">{qcSummary.doneQC}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* QC Status Distribution */}
        <div className="bg-slate-900 rounded-lg border border-slate-800 shadow-sm p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <HiClipboardCheck className="w-5 h-5 text-blue-400" />
              QC Status Distribution
            </h2>
            <p className="text-xs text-slate-400 mt-1">Pending vs Done QC status</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {qcStatusCounts.map((item) => (
              <div
                key={item.status}
                className="bg-slate-800 rounded-lg border border-slate-700 p-4"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="px-2 py-1 rounded text-xs font-semibold"
                    style={{
                      backgroundColor: `${QC_STATUS_COLORS[item.status] || "#6b7280"}20`,
                      color: QC_STATUS_COLORS[item.status] || "#6b7280",
                    }}
                  >
                    {item.status}
                  </span>
                  <span className="text-xl font-bold text-white">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent QC Defects */}
        <div className="bg-slate-900 rounded-lg border border-slate-800 shadow-sm p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <HiClipboardCheck className="w-5 h-5 text-blue-400" />
              Recent Defects for QC
            </h2>
            <p className="text-xs text-slate-400 mt-1">Latest defects with QC status</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="py-3 px-4 text-slate-300">Test Case ID</th>
                  <th className="py-3 px-4 text-slate-300">Module</th>
                  <th className="py-3 px-4 text-slate-300">Status</th>
                  <th className="py-3 px-4 text-slate-300">QC Status</th>
                  <th className="py-3 px-4 text-slate-300">Date Reported</th>
                </tr>
              </thead>
              <tbody>
                {recentDefects.map((defect) => (
                  <tr key={defect.id} className="border-b border-slate-800 hover:bg-slate-800">
                    <td className="py-3 px-4 text-slate-200">
                      {defect.testCaseId || defect.id.substring(0, 8)}
                    </td>
                    <td className="py-3 px-4 text-slate-200">{defect.module}</td>
                    <td className="py-3 px-4">
                      {(() => {
                        const label = getStatusLabel(defect.status);
                        return (
                          <span
                            className="px-2 py-1 rounded text-xs font-semibold"
                            style={{
                              backgroundColor: `${STATUS_BADGE_COLORS[label] || "#6b7280"}20`,
                              color: STATUS_BADGE_COLORS[label] || "#6b7280",
                            }}
                          >
                            {label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="py-3 px-4">
                      {(() => {
                        const label = getQcLabel(defect.qcStatusBbt);
                        return (
                      <span
                        className="px-2 py-1 rounded text-xs font-semibold"
                        style={{
                          backgroundColor: `${QC_STATUS_COLORS[label] || "#6b7280"}20`,
                          color: QC_STATUS_COLORS[label] || "#6b7280",
                        }}
                      >
                        {label}
                      </span>
                        );
                      })()}
                    </td>
                    <td className="py-3 px-4 text-slate-200">
                      {defect.dateReported || "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
