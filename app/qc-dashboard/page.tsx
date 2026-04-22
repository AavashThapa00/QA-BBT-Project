"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  HiArrowLeft,
  HiClipboardCheck,
  HiClock,
  HiCheckCircle,
} from "react-icons/hi";
import { PageSkeleton } from "@/app/components/common/SkeletonLoader";
import {
  getQCStatusCounts,
  getQCSummary,
  getRecentQCDefects,
} from "@/app/actions/qcDashboard";

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
  Pending: "#d97706",
  Done: "#16a34a",
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
  Pending: "#d97706",
  Fixed: "#16a34a",
  Hold: "#ea580c",
  "As it is": "#64748b",
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
    return <PageSkeleton variant="dashboard" />;
  }

  return (
    <div className="min-h-screen bg-(--page-background) p-4 sm:p-6 lg:p-8">
      <div className="relative mx-auto w-full max-w-screen-2xl space-y-6">
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
              QA Dashboard
            </h1>
            <p className="mt-1 text-sm text-(--muted-color)">
              Track QA Status by BBT effectively
            </p>
          </div>
        </div>

        {qcSummary && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 animate-in fade-in-up duration-500">
            <div className="rounded-2xl border border-(--border-color) bg-(--surface) p-6 shadow-sm transition-all duration-300 hover:border-emerald-200">
              <div className="flex items-center gap-3">
                <HiClipboardCheck className="h-6 w-6 text-(--primary-color)" />
                <div>
                  <p className="text-sm text-(--muted-color)">Total QC</p>
                  <p className="text-2xl font-bold text-(--text-color)">
                    {qcSummary.totalQC}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-(--border-color) bg-(--surface) p-6 shadow-sm transition-all duration-300 hover:border-amber-200">
              <div className="flex items-center gap-3">
                <HiClock className="h-6 w-6 text-amber-600" />
                <div>
                  <p className="text-sm text-(--muted-color)">Pending QC</p>
                  <p className="text-2xl font-bold text-(--text-color)">
                    {qcSummary.pendingQC}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-(--border-color) bg-(--surface) p-6 shadow-sm transition-all duration-300 hover:border-emerald-200">
              <div className="flex items-center gap-3">
                <HiCheckCircle className="h-6 w-6 text-emerald-600" />
                <div>
                  <p className="text-sm text-(--muted-color)">QC Done</p>
                  <p className="text-2xl font-bold text-(--text-color)">
                    {qcSummary.doneQC}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-(--border-color) bg-(--surface) p-6 shadow-sm transition-all duration-300 animate-in fade-in-up">
          <div className="mb-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-(--heading-color)">
              <HiClipboardCheck className="h-5 w-5 text-(--primary-color)" />
              QA Status Distribution
            </h2>
            <p className="mt-1 text-xs text-(--muted-color)">
              Pending vs Done QA status
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {qcStatusCounts.map((item) => (
              <div
                key={item.status}
                className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-4 transition-all hover:bg-emerald-50/70"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="rounded px-2 py-1 text-xs font-semibold"
                    style={{
                      backgroundColor: `${QC_STATUS_COLORS[item.status] || "#6b7280"}20`,
                      color: QC_STATUS_COLORS[item.status] || "#6b7280",
                    }}
                  >
                    {item.status}
                  </span>
                  <span className="text-xl font-bold text-(--text-color)">
                    {item.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-(--border-color) bg-(--surface) p-6 shadow-sm transition-all duration-300 animate-in fade-in-up">
          <div className="mb-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-(--heading-color)">
              <HiClipboardCheck className="h-5 w-5 text-(--primary-color)" />
              Recent Defects for QC
            </h2>
            <p className="mt-1 text-xs text-(--muted-color)">
              Latest defects with QC status
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-emerald-100 bg-emerald-50/60">
                  <th className="px-4 py-3 text-xs uppercase tracking-wide text-(--heading-color)">
                    Test Case ID
                  </th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wide text-(--heading-color)">
                    Module
                  </th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wide text-(--heading-color)">
                    Status
                  </th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wide text-(--heading-color)">
                    QC Status
                  </th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wide text-(--heading-color)">
                    Date Reported
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentDefects.map((defect) => (
                  <tr
                    key={defect.id}
                    className="border-b border-emerald-50 transition-colors hover:bg-emerald-50/40"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-(--text-color)">
                      {defect.testCaseId || defect.id.substring(0, 8)}
                    </td>
                    <td className="px-4 py-3 text-(--text-color)">
                      {defect.module}
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        const label = getStatusLabel(defect.status);
                        return (
                          <span
                            className="rounded px-2 py-1 text-xs font-semibold"
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
                    <td className="px-4 py-3">
                      {(() => {
                        const label = getQcLabel(defect.qcStatusBbt);
                        return (
                          <span
                            className="rounded px-2 py-1 text-xs font-semibold"
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
                    <td className="px-4 py-3 text-xs text-(--muted-color)">
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
