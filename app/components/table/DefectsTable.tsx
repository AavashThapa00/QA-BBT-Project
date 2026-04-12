"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { HiInbox, HiChevronDown } from "react-icons/hi";
import { Defect, Severity } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface DefectsTableProps {
  defects: Defect[];
  isLoading?: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  sortBy?: "date" | "severity" | "status";
  sortOrder?: "asc" | "desc";
  onSortChange?: (
    sortBy: "date" | "severity" | "status",
    order: "asc" | "desc",
  ) => void;
}

const SEVERITY_COLORS: Record<Severity, string> = {
  MAJOR: "bg-rose-100 text-rose-700 ring-1 ring-rose-200",
  HIGH: "bg-orange-100 text-orange-700 ring-1 ring-orange-200",
  MEDIUM: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
  LOW: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
};

const PRIORITY_COLORS: Record<string, string> = {
  Low: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
  Medium: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
  High: "bg-orange-100 text-orange-700 ring-1 ring-orange-200",
  Major: "bg-rose-100 text-rose-700 ring-1 ring-rose-200",
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-sky-100 text-sky-700 ring-1 ring-sky-200",
  IN_PROGRESS: "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200",
  CLOSED: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
  ON_HOLD: "bg-rose-100 text-rose-700 ring-1 ring-rose-200",
  AS_IT_IS: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  CLOSED: "Fixed",
  ON_HOLD: "Pending",
  AS_IT_IS: "As it is",
};

function SortButton({
  column,
  label,
  currentSort,
  currentOrder,
  onClick,
}: {
  column: "date" | "severity" | "status";
  label: string;
  currentSort?: string;
  currentOrder?: string;
  onClick: (col: "date" | "severity" | "status", order: "asc" | "desc") => void;
}) {
  const isActive = currentSort === column;
  const nextOrder = isActive && currentOrder === "asc" ? "desc" : "asc";

  return (
    <button
      onClick={() => onClick(column, nextOrder)}
      className="flex items-center gap-2 rounded px-2 py-1 font-semibold uppercase tracking-wide text-(--heading-color) transition-colors hover:bg-emerald-50 hover:text-(--primary-color)"
    >
      {label}
      {isActive && (
        <span className="text-xs font-bold">
          {nextOrder === "asc" ? "↑" : "↓"}
        </span>
      )}
    </button>
  );
}

function FilterDropdown({
  label,
  options,
  selectedValues,
  onChange,
  isOpen,
  onOpen,
  onClose,
}: {
  label: string;
  options: { value: string; label: string }[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={onOpen}
        className="flex items-center gap-1 rounded px-2 py-1 font-semibold uppercase tracking-wide text-(--heading-color) transition-colors hover:bg-emerald-50 hover:text-(--primary-color)"
      >
        {label}
        <HiChevronDown className="w-4 h-4" />
      </button>
      {isOpen && (
        <div
          className="absolute top-full left-0 z-10 mt-1 min-w-max rounded-lg border border-(--border-color) bg-(--surface) p-2 shadow-lg"
          onMouseLeave={onClose}
        >
          <div className="space-y-2">
            {options.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-emerald-50"
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onChange([...selectedValues, option.value]);
                    } else {
                      onChange(
                        selectedValues.filter((v) => v !== option.value),
                      );
                    }
                  }}
                  className="cursor-pointer rounded border-emerald-300 bg-white text-(--primary-color) focus:ring-(--primary-color)"
                />
                <span className="text-sm text-(--text-color)">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DefectsTable({
  defects,
  isLoading = false,
  currentPage,
  totalPages,
  onPageChange,
  sortBy,
  sortOrder,
  onSortChange,
}: DefectsTableProps) {
  const router = useRouter();
  const [moduleFilter, setModuleFilter] = useState<string[]>([]);
  const [severityFilter, setSeverityFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Filter defects based on selected criteria
  const filteredDefects = defects.filter((defect) => {
    const moduleMatch =
      moduleFilter.length === 0 ||
      moduleFilter.some((m) => defect.module.includes(m));
    const severityMatch =
      severityFilter.length === 0 || severityFilter.includes(defect.severity);
    const priorityMatch =
      priorityFilter.length === 0 || priorityFilter.includes(defect.priority);

    // Map user-friendly status labels to enum values
    const statusValueMap: Record<string, string[]> = {
      Pending: ["OPEN", "IN_PROGRESS"],
      Fixed: ["CLOSED"],
      "As it is": ["AS_IT_IS"],
      Hold: ["ON_HOLD"],
    };
    const mappedStatusFilter = statusFilter.flatMap(
      (s) => statusValueMap[s] || [s],
    );
    const statusMatch =
      statusFilter.length === 0 || mappedStatusFilter.includes(defect.status);

    return moduleMatch && severityMatch && priorityMatch && statusMatch;
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-(--border-color) bg-(--surface) shadow-[0_10px_26px_rgba(27,94,32,0.08)]">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-(--border-color)">
          <thead className="border-b border-(--border-color) bg-(--surface-soft)">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-(--heading-color)">
                <SortButton
                  column="date"
                  label="Date Reported"
                  currentSort={sortBy}
                  currentOrder={sortOrder}
                  onClick={onSortChange || (() => {})}
                />
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-(--heading-color) uppercase tracking-wider">
                <FilterDropdown
                  label="Module"
                  options={[
                    { value: "KFQ", label: "KFQ" },
                    { value: "HSA", label: "HSA" },
                    { value: "GMST", label: "GMST" },
                    { value: "NMST", label: "NMST" },
                  ]}
                  selectedValues={moduleFilter}
                  onChange={setModuleFilter}
                  isOpen={openDropdown === "module"}
                  onOpen={() => setOpenDropdown("module")}
                  onClose={() => setOpenDropdown(null)}
                />
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-(--heading-color) uppercase tracking-wider">
                <FilterDropdown
                  label="Severity"
                  options={[
                    { value: "LOW", label: "Low" },
                    { value: "MEDIUM", label: "Medium" },
                    { value: "HIGH", label: "High" },
                    { value: "MAJOR", label: "Major" },
                  ]}
                  selectedValues={severityFilter}
                  onChange={setSeverityFilter}
                  isOpen={openDropdown === "severity"}
                  onOpen={() => setOpenDropdown("severity")}
                  onClose={() => setOpenDropdown(null)}
                />
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-(--heading-color) uppercase tracking-wider">
                <FilterDropdown
                  label="Priority"
                  options={[
                    { value: "Low", label: "Low" },
                    { value: "Medium", label: "Medium" },
                    { value: "High", label: "High" },
                    { value: "Major", label: "Major" },
                  ]}
                  selectedValues={priorityFilter}
                  onChange={setPriorityFilter}
                  isOpen={openDropdown === "priority"}
                  onOpen={() => setOpenDropdown("priority")}
                  onClose={() => setOpenDropdown(null)}
                />
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-(--heading-color) uppercase tracking-wider">
                <FilterDropdown
                  label="Status"
                  options={[
                    { value: "Pending", label: "Pending" },
                    { value: "Fixed", label: "Fixed" },
                    { value: "As it is", label: "As it is" },
                    { value: "Hold", label: "Hold" },
                  ]}
                  selectedValues={statusFilter}
                  onChange={setStatusFilter}
                  isOpen={openDropdown === "status"}
                  onOpen={() => setOpenDropdown("status")}
                  onClose={() => setOpenDropdown(null)}
                />
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-(--heading-color) uppercase tracking-wider">
                Date Fixed
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-(--border-color) bg-(--surface)">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-200 border-t-(--primary-color)"></div>
                    <span className="font-medium text-(--muted-color)">
                      Loading data...
                    </span>
                  </div>
                </td>
              </tr>
            ) : filteredDefects.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-(--muted-color)"
                >
                  <div className="flex flex-col items-center gap-2">
                    <HiInbox className="text-2xl text-(--muted-color)" />
                    <p className="font-medium text-(--heading-color)">
                      No defects found
                    </p>
                    <p className="text-xs text-(--muted-color)">
                      Try adjusting your filters
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredDefects.map((defect) => (
                <tr
                  key={defect.id}
                  onClick={() => router.push(`/defects/${defect.id}`)}
                  className="cursor-pointer transition-colors hover:bg-emerald-50/70"
                >
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-(--heading-color)">
                    {defect.dateReported
                      ? formatDate(defect.dateReported)
                      : "N/A"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-(--text-color)">
                    <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-100">
                      {defect.module}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold uppercase ${
                        SEVERITY_COLORS[defect.severity]
                      }`}
                    >
                      {defect.severity}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold uppercase ${
                        PRIORITY_COLORS[defect.priority] ||
                        "bg-slate-100 text-slate-700 ring-1 ring-slate-200"
                      }`}
                    >
                      {defect.priority}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold ${
                        STATUS_COLORS[defect.status]
                      }`}
                    >
                      {STATUS_LABELS[defect.status] ?? defect.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-(--text-color)">
                    {defect.dateFixed ? (
                      formatDate(defect.dateFixed)
                    ) : (
                      <span className="text-(--muted-color)">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-(--border-color) bg-(--surface-soft) px-6 py-4">
        <div className="text-sm font-medium text-(--muted-color)">
          Page{" "}
          <span className="font-bold text-(--heading-color)">
            {currentPage}
          </span>{" "}
          of{" "}
          <span className="font-bold text-(--heading-color)">{totalPages}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
            className="rounded-lg border border-(--border-color) px-4 py-2.5 text-sm font-semibold text-(--heading-color) transition-colors hover:border-(--primary-color) hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ← Previous
          </button>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
            className="rounded-lg border border-(--border-color) px-4 py-2.5 text-sm font-semibold text-(--heading-color) transition-colors hover:border-(--primary-color) hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
