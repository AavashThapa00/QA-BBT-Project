"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  HiArrowLeft,
  HiCheckCircle,
  HiClock,
  HiExclamationCircle,
  HiTrash,
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

export default function AllDefectsPage() {
  const router = useRouter();
  const [defects, setDefects] = useState<Defect[]>([]);
  const [filteredDefects, setFilteredDefects] = useState<Defect[]>([]);
  const [selectedModule, setSelectedModule] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadDefects();
  }, []);

  useEffect(() => {
    if (selectedModule === "ALL") {
      setFilteredDefects(defects);
    } else {
      const filtered = defects.filter((defect) =>
        defect.module.toLowerCase().includes(selectedModule.toLowerCase()),
      );
      setFilteredDefects(filtered);
    }
  }, [selectedModule, defects]);

  const loadDefects = async () => {
    setIsLoading(true);
    try {
      const data = await getAllDefectsSorted();
      setDefects(data);
      setFilteredDefects(data);
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
      setFilteredDefects((prev) => prev.filter((defect) => defect.id !== id));
    } catch (error) {
      console.error("Error deleting issue:", error);
      window.alert("Failed to remove issue");
    } finally {
      setDeletingId(null);
    }
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
