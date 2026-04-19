"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  HiArrowLeft,
  HiCheckCircle,
  HiClock,
  HiExclamationCircle,
  HiFilter,
  HiSearch,
  HiTrash,
  HiX,
} from "react-icons/hi";
import AppButton from "@/app/components/common/AppButton";
import { PageSkeleton } from "@/app/components/common/SkeletonLoader";
import { Defect } from "@/lib/types";
import {
  deleteDefectById,
  getAllDefectsSorted,
} from "@/app/actions/detailsActions";
import { formatDate } from "@/lib/utils";

const STATUS_COLORS: Record<
  string,
  { bg: string; text: string; icon: React.ReactNode }
> = {
  OPEN: {
    bg: "bg-sky-100",
    text: "text-sky-700",
    icon: <HiExclamationCircle />,
  },
  IN_PROGRESS: {
    bg: "bg-indigo-100",
    text: "text-indigo-700",
    icon: <HiClock />,
  },
  CLOSED: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    icon: <HiCheckCircle />,
  },
  ON_HOLD: { bg: "bg-rose-100", text: "text-rose-700", icon: <HiClock /> },
  AS_IT_IS: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    icon: <HiCheckCircle />,
  },
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  CLOSED: "Fixed",
  ON_HOLD: "Pending",
  AS_IT_IS: "As it is",
};

const MODULES = ["ALL", "HSA", "KFQ", "GMST", "NMST", "Innovatetech"];
const STATUS_OPTIONS = ["ALL", "OPEN", "IN_PROGRESS", "CLOSED", "ON_HOLD", "AS_IT_IS"];
const SEVERITY_OPTIONS = ["ALL", "MAJOR", "HIGH", "MEDIUM", "LOW"];

function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function AllDefectsPage() {
  const router = useRouter();
  const [defects, setDefects] = useState<Defect[]>([]);
  const [filteredDefects, setFilteredDefects] = useState<Defect[]>([]);
  const [selectedModule, setSelectedModule] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedSeverity, setSelectedSeverity] = useState("ALL");
  const [selectedPriority, setSelectedPriority] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const priorityOptions = [
    "ALL",
    ...Array.from(
      new Set(defects.map((defect) => defect.priority?.trim()).filter(Boolean)),
    ),
  ];

  useEffect(() => {
    loadDefects();
  }, []);

  useEffect(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filtered = defects.filter((defect) => {
      const matchesModule =
        selectedModule === "ALL" ||
        defect.module.toLowerCase().includes(selectedModule.toLowerCase());

      const matchesStatus =
        selectedStatus === "ALL" || defect.status === selectedStatus;

      const matchesSeverity =
        selectedSeverity === "ALL" || defect.severity === selectedSeverity;

      const matchesPriority =
        selectedPriority === "ALL" ||
        defect.priority?.toLowerCase() === selectedPriority.toLowerCase();

      const searchableText = [
        defect.summary,
        defect.module,
        defect.testCaseId,
        defect.expectedResult,
        defect.actualResult,
        defect.priority,
        defect.severity,
        STATUS_LABELS[defect.status],
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        normalizedSearch.length === 0 || searchableText.includes(normalizedSearch);

      return (
        matchesModule &&
        matchesStatus &&
        matchesSeverity &&
        matchesPriority &&
        matchesSearch
      );
    });

    setFilteredDefects(filtered);
  }, [
    selectedModule,
    selectedStatus,
    selectedSeverity,
    selectedPriority,
    searchTerm,
    defects,
  ]);

  const loadDefects = async () => {
    setIsLoading(true);
    try {
      const data = await getAllDefectsSorted();
      setDefects(data);
    } catch (error) {
      console.error("Error loading defects:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteIssue = async (id: string) => {
    const confirmed = window.confirm(
      "Remove this issue from the issue sheet? This action cannot be undone.",
    );
    if (!confirmed) return;

    try {
      setDeletingId(id);
      const result = await deleteDefectById(id);
      if (!result.success) {
        window.alert(result.message);
        return;
      }

      setDefects((prev) => prev.filter((defect) => defect.id !== id));
    } catch (error) {
      console.error("Error deleting issue:", error);
      window.alert("Failed to remove issue");
    } finally {
      setDeletingId(null);
    }
  };

  const hasActiveFilters =
    selectedModule !== "ALL" ||
    selectedStatus !== "ALL" ||
    selectedSeverity !== "ALL" ||
    selectedPriority !== "ALL" ||
    searchTerm.trim().length > 0;

  const clearFilters = () => {
    setSelectedModule("ALL");
    setSelectedStatus("ALL");
    setSelectedSeverity("ALL");
    setSelectedPriority("ALL");
    setSearchTerm("");
  };

  return (
    <div className="min-h-screen bg-(--page-background)">
      {/* Header - Constrained Width */}
      <div className="w-full sticky top-0 z-10 border-b border-emerald-100 bg-(--surface) shadow-sm px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-screen-2xl">
          <div className="flex items-center gap-4">
            <AppButton
              onClick={() => router.push("/")}
              variant="secondary"
              size="icon"
              aria-label="Back to dashboard"
            >
              <HiArrowLeft className="h-5 w-5" />
            </AppButton>
            <div>
              <h1 className="text-xl font-semibold text-(--heading-color)">
                All Defects
              </h1>
              <p className="text-sm text-(--muted-color)">
                {filteredDefects.length} defect
                {filteredDefects.length !== 1 ? "s" : ""}
                {selectedModule !== "ALL" && ` in ${selectedModule}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Constrained Width */}
      <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-screen-2xl">
          {/* Module Navigation */}
          <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
            {MODULES.map((module) => (
              <button
                key={module}
                onClick={() => setSelectedModule(module)}
                className={`whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                  selectedModule === module
                    ? "border-(--primary-color) bg-(--primary-color) text-white"
                    : "border-(--border-color) bg-(--surface-soft) text-(--muted-color) hover:border-(--primary-color) hover:bg-emerald-50 hover:text-(--heading-color)"
                }`}
              >
                {module}
              </button>
            ))}
          </div>

          <div className="mb-6 rounded-xl border border-(--border-color) bg-(--surface) p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-(--heading-color)">
                <HiFilter className="h-4 w-4 text-(--primary-color)" />
                Refine Results
              </h2>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 rounded-lg border border-(--border-color) bg-(--surface-soft) px-2.5 py-1.5 text-xs font-medium text-(--muted-color) transition-colors hover:border-(--primary-color) hover:text-(--heading-color)"
                >
                  <HiX className="h-3.5 w-3.5" />
                  Clear filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-(--muted-color)">
                  Search
                </span>
                <div className="relative">
                  <HiSearch className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-(--muted-color)" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Issue, module, testcase..."
                    className="w-full rounded-lg border border-(--border-color) bg-(--surface-soft) py-2 pl-9 pr-3 text-sm text-(--text-color) placeholder-(--muted-color) focus:border-(--primary-color) focus:outline-none focus:ring-2 focus:ring-(--primary-color)/20"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-(--muted-color)">
                  Status
                </span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full rounded-lg border border-(--border-color) bg-(--surface-soft) px-3 py-2 text-sm text-(--text-color) focus:border-(--primary-color) focus:outline-none focus:ring-2 focus:ring-(--primary-color)/20"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status === "ALL"
                        ? "All statuses"
                        : STATUS_LABELS[status] || toTitleCase(status)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-(--muted-color)">
                  Severity
                </span>
                <select
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                  className="w-full rounded-lg border border-(--border-color) bg-(--surface-soft) px-3 py-2 text-sm text-(--text-color) focus:border-(--primary-color) focus:outline-none focus:ring-2 focus:ring-(--primary-color)/20"
                >
                  {SEVERITY_OPTIONS.map((severity) => (
                    <option key={severity} value={severity}>
                      {severity === "ALL"
                        ? "All severities"
                        : toTitleCase(severity)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-(--muted-color)">
                  Priority
                </span>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="w-full rounded-lg border border-(--border-color) bg-(--surface-soft) px-3 py-2 text-sm text-(--text-color) focus:border-(--primary-color) focus:outline-none focus:ring-2 focus:ring-(--primary-color)/20"
                >
                  {priorityOptions.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority === "ALL" ? "All priorities" : priority}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {/* Defects List */}
          {isLoading ? (
            <PageSkeleton variant="table" />
          ) : filteredDefects.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-(--muted-color)">No defects found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDefects.map((defect) => (
                <div
                  key={defect.id}
                  className="cursor-pointer rounded-lg border border-(--border-color) bg-(--surface) p-6 transition-colors hover:border-emerald-200 hover:bg-emerald-50/20"
                  onClick={() => router.push(`/defects/${defect.id}`)}
                >
                  <div className="flex items-center justify-end mb-2">
                    <AppButton
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteIssue(defect.id);
                      }}
                      disabled={deletingId === defect.id}
                      variant="dangerSoft"
                      size="sm"
                    >
                      <HiTrash className="w-4 h-4" />
                      {deletingId === defect.id ? "Removing..." : "Remove"}
                    </AppButton>
                  </div>

                  {/* Summary/Title Header */}
                  {defect.summary && (
                    <h2 className="mb-4 text-lg font-semibold leading-relaxed text-(--text-color)">
                      {defect.summary}
                    </h2>
                  )}

                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-mono text-(--muted-color)">
                          {defect.testCaseId || defect.id.substring(0, 8)}
                        </span>
                        <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
                          {defect.module}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                            STATUS_COLORS[defect.status].bg
                          } ${STATUS_COLORS[defect.status].text}`}
                        >
                          {STATUS_COLORS[defect.status].icon}
                          {STATUS_LABELS[defect.status]}
                        </span>
                      </div>
                      {defect.dateReported && (
                        <p className="text-xs text-(--muted-color)">
                          Reported: {formatDate(defect.dateReported)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Expected Result */}
                    <div>
                      <h3 className="mb-2 text-sm font-semibold text-emerald-700">
                        ✓ Expected Result
                      </h3>
                      <p className="text-sm leading-relaxed text-(--text-color)">
                        {defect.expectedResult}
                      </p>
                    </div>

                    {/* Actual Result */}
                    <div>
                      <h3 className="mb-2 text-sm font-semibold text-rose-700">
                        ✗ Actual Result
                      </h3>
                      <p className="text-sm leading-relaxed text-(--text-color)">
                        {defect.actualResult}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-4 border-t border-(--border-color) pt-4 text-xs text-(--muted-color)">
                    <span>
                      Severity:{" "}
                      <span className="font-medium text-(--text-color)">
                        {defect.severity}
                      </span>
                    </span>
                    <span>
                      Priority:{" "}
                      <span className="font-medium text-(--text-color)">
                        {defect.priority}
                      </span>
                    </span>
                    {defect.dateFixed && (
                      <span>
                        Fixed:{" "}
                        <span className="text-(--text-color)">
                          {formatDate(defect.dateFixed)}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
