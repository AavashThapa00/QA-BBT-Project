"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getDefectById } from "@/app/actions/detailsActions";
import { Defect } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import {
  HiArrowLeft,
  HiCheckCircle,
  HiExclamationCircle,
  HiClock,
} from "react-icons/hi";
import AppButton from "@/app/components/common/AppButton";
import { PageSkeleton } from "@/app/components/common/SkeletonLoader";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  FIXED: "Fixed",
  HOLD: "Hold",
  AS_IT_IS: "As it is",
  RE_OPENED: "Re-opened",
};

const SEVERITY_COLORS: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  MAJOR: { bg: "bg-rose-100", text: "text-rose-700", label: "Major" },
  HIGH: { bg: "bg-orange-100", text: "text-orange-700", label: "High" },
  MEDIUM: { bg: "bg-amber-100", text: "text-amber-700", label: "Medium" },
  LOW: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Low" },
};

const STATUS_COLORS_MAP: Record<
  string,
  { bg: string; text: string; icon: React.ReactNode }
> = {
  PENDING: {
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    icon: <HiExclamationCircle />,
  },
  FIXED: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    icon: <HiCheckCircle />,
  },
  HOLD: { bg: "bg-rose-100", text: "text-rose-700", icon: <HiClock /> },
  AS_IT_IS: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    icon: <HiCheckCircle />,
  },
  RE_OPENED: {
    bg: "bg-orange-100",
    text: "text-orange-700",
    icon: <HiExclamationCircle />,
  },
};

// Convert old status values to new ones for backward compatibility
function migrateDefectStatus(defect: Defect): Defect {
  const statusMap: Record<string, string> = {
    OPEN: "PENDING",
    IN_PROGRESS: "PENDING",
    ON_HOLD: "HOLD",
    CLOSED: "FIXED",
    PENDING: "PENDING",
    FIXED: "FIXED",
    HOLD: "HOLD",
    RE_OPENED: "RE_OPENED",
    AS_IT_IS: "AS_IT_IS",
  };
  return {
    ...defect,
    status: (statusMap[defect.status] || "PENDING") as any,
  };
}

export default function DefectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [defect, setDefect] = useState<Defect | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDefect = async () => {
      try {
        const data = await getDefectById(id);
        if (data) {
          setDefect(migrateDefectStatus(data));
        } else {
          setError("Defect not found");
        }
      } catch (err) {
        setError("Failed to fetch defect details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDefect();
  }, [id]);

  if (loading) {
    return <PageSkeleton variant="detail" />;
  }

  if (error || !defect) {
    return (
      <div className="min-h-screen bg-(--page-background)">
        <div className="w-full px-4 py-8 sm:px-6 lg:px-10 xl:px-12">
          <AppButton
            onClick={() => router.back()}
            variant="secondary"
            className="mb-6"
          >
            <HiArrowLeft className="w-5 h-5" />
            Back
          </AppButton>
          <div className="rounded-2xl border border-(--border-color) bg-(--surface) p-8 text-center shadow-sm">
            <HiExclamationCircle className="mx-auto mb-4 h-12 w-12 text-rose-500" />
            <p className="text-lg text-(--text-color)">
              {error || "Defect not found"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--page-background)">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-(--border-color) bg-(--surface) shadow-sm">
        <div className="w-full px-4 py-6 sm:px-6 lg:px-10 xl:px-12">
          <AppButton
            onClick={() => router.back()}
            variant="secondary"
            className="group mb-4"
          >
            <HiArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Defects
          </AppButton>
          <h1 className="text-2xl font-bold text-(--heading-color) sm:text-3xl lg:text-4xl">
            Defect Details
          </h1>
          <p className="mt-2 text-(--muted-color)">
            {defect.testCaseId
              ? `Test Case ID: ${defect.testCaseId}`
              : `ID: ${defect.id}`}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-4 py-8 sm:px-6 lg:px-10 xl:px-12">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status & Severity */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-(--border-color) bg-(--surface) p-6 shadow-sm transition-all duration-300 hover:border-emerald-200">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-(--muted-color)">
                  Status
                </h3>
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${STATUS_COLORS_MAP[defect.status].bg}`}
                  >
                    <div className={STATUS_COLORS_MAP[defect.status].text}>
                      {STATUS_COLORS_MAP[defect.status].icon}
                    </div>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-(--text-color)">
                      {STATUS_LABELS[defect.status] || defect.status}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-(--border-color) bg-(--surface) p-6 shadow-sm transition-all duration-300 hover:border-emerald-200">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-(--muted-color)">
                  Severity
                </h3>
                <div className="flex items-center gap-3">
                  <div
                    className={`px-3 py-1 rounded-full ${SEVERITY_COLORS[defect.severity]?.bg} ${SEVERITY_COLORS[defect.severity]?.text}`}
                  >
                    <p className="font-semibold text-sm">
                      {SEVERITY_COLORS[defect.severity]?.label ||
                        defect.severity}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-(--border-color) bg-(--surface) p-6 shadow-sm transition-all duration-300 hover:border-emerald-200">
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-(--muted-color)">
                  Module
                </h3>
                <p className="text-lg font-medium text-(--text-color)">
                  {defect.module}
                </p>
              </div>

              <div className="rounded-2xl border border-(--border-color) bg-(--surface) p-6 shadow-sm transition-all duration-300 hover:border-emerald-200">
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-(--muted-color)">
                  Priority
                </h3>
                <p className="text-lg font-medium text-(--text-color)">
                  {defect.priority}
                </p>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-(--border-color) bg-(--surface) p-6 shadow-sm transition-all duration-300 hover:border-emerald-200">
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-(--muted-color)">
                  Date Reported
                </h3>
                <p className="text-lg font-medium text-(--text-color)">
                  {defect.dateReported
                    ? formatDate(defect.dateReported)
                    : "N/A"}
                </p>
              </div>

              <div className="rounded-2xl border border-(--border-color) bg-(--surface) p-6 shadow-sm transition-all duration-300 hover:border-emerald-200">
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-(--muted-color)">
                  Date Fixed
                </h3>
                <p className="text-lg font-medium text-(--text-color)">
                  {defect.dateFixed
                    ? formatDate(defect.dateFixed)
                    : "Not yet fixed"}
                </p>
              </div>
            </div>

            {/* Expected Result */}
            <div className="rounded-lg border border-(--border-color) bg-(--surface) p-6 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-(--muted-color)">
                Expected Result
              </h3>
              <div className="rounded-lg border border-emerald-100 bg-emerald-50/30 p-4">
                <p className="whitespace-pre-wrap leading-relaxed text-(--text-color)">
                  {defect.expectedResult || "No expected result specified"}
                </p>
              </div>
            </div>

            {/* Actual Result */}
            <div className="rounded-lg border border-(--border-color) bg-(--surface) p-6 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-(--muted-color)">
                Actual Result
              </h3>
              <div className="rounded-lg border border-rose-100 bg-rose-50/30 p-4">
                <p className="whitespace-pre-wrap leading-relaxed text-(--text-color)">
                  {defect.actualResult || "No actual result specified"}
                </p>
              </div>
            </div>

            {defect.descriptionSteps && (
              <div className="rounded-lg border border-(--border-color) bg-(--surface) p-6 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-(--muted-color)">
                  Description / Steps to Reproduce
                </h3>
                <div className="rounded-lg border border-(--border-color) bg-(--surface-soft) p-4">
                  <p className="whitespace-pre-wrap leading-relaxed text-(--text-color)">
                    {defect.descriptionSteps}
                  </p>
                </div>
              </div>
            )}

            {defect.testScenario && (
              <div className="rounded-lg border border-(--border-color) bg-(--surface) p-6 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-(--muted-color)">
                  Test Scenario
                </h3>
                <div className="rounded-lg border border-(--border-color) bg-(--surface-soft) p-4">
                  <p className="whitespace-pre-wrap leading-relaxed text-(--text-color)">
                    {defect.testScenario}
                  </p>
                </div>
              </div>
            )}

            {defect.testSteps && (
              <div className="rounded-lg border border-(--border-color) bg-(--surface) p-6 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-(--muted-color)">
                  Test Steps
                </h3>
                <div className="rounded-lg border border-(--border-color) bg-(--surface-soft) p-4">
                  <p className="whitespace-pre-wrap leading-relaxed text-(--text-color)">
                    {defect.testSteps}
                  </p>
                </div>
              </div>
            )}

            {defect.remarks && (
              <div className="rounded-lg border border-(--border-color) bg-(--surface) p-6 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-(--muted-color)">
                  Remarks / Notes
                </h3>
                <div className="rounded-lg border border-(--border-color) bg-(--surface-soft) p-4">
                  <p className="whitespace-pre-wrap leading-relaxed text-(--text-color)">
                    {defect.remarks}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Summary */}
          <div>
            <div className="sticky top-24 rounded-2xl border border-(--border-color) bg-(--surface) p-6 shadow-sm transition-all duration-300 hover:border-emerald-200">
              <h2 className="mb-6 text-lg font-semibold text-(--heading-color)">
                Summary
              </h2>

              <div className="space-y-4">
                {defect.testCaseId && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-(--muted-color)">
                      Test Case ID
                    </p>
                    <p className="font-mono text-sm text-(--text-color)">
                      {defect.testCaseId}
                    </p>
                  </div>
                )}

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-(--muted-color)">
                    {defect.testCaseId ? "Internal ID" : "ID"}
                  </p>
                  <p className="wrap-break-word font-mono text-sm text-(--text-color)">
                    {defect.id}
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-(--muted-color)">
                    Status
                  </p>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS_MAP[defect.status].bg} ${STATUS_COLORS_MAP[defect.status].text}`}
                  >
                    {STATUS_LABELS[defect.status] || defect.status}
                  </span>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-(--muted-color)">
                    Severity
                  </p>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${SEVERITY_COLORS[defect.severity]?.bg} ${SEVERITY_COLORS[defect.severity]?.text}`}
                  >
                    {SEVERITY_COLORS[defect.severity]?.label || defect.severity}
                  </span>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-(--muted-color)">
                    Module
                  </p>
                  <p className="text-(--text-color)">{defect.module}</p>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-(--muted-color)">
                    Test Type
                  </p>
                  <p className="text-(--text-color)">
                    {defect.testType === "cycle" ? "Cycle Test" : "Smoke Test"}
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-(--muted-color)">
                    Priority
                  </p>
                  <p className="text-(--text-color)">{defect.priority}</p>
                </div>

                <div className="border-t border-(--border-color) pt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-(--muted-color)">
                    Reported
                  </p>
                  <p className="text-sm text-(--text-color)">
                    {defect.dateReported
                      ? formatDate(defect.dateReported)
                      : "Unknown"}
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-(--muted-color)">
                    Fixed
                  </p>
                  <p className="text-sm text-(--text-color)">
                    {defect.dateFixed
                      ? formatDate(defect.dateFixed)
                      : "Not yet fixed"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
