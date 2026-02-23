"use client";

import React, { useState } from "react";
import { HiInbox, HiX, HiChevronDown } from "react-icons/hi";
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
  onSortChange?: (sortBy: "date" | "severity" | "status", order: "asc" | "desc") => void;
}

const SEVERITY_COLORS: Record<Severity, string> = {
  CRITICAL: "bg-red-900 text-red-200",
  HIGH: "bg-orange-900 text-orange-200",
  MEDIUM: "bg-yellow-900 text-yellow-200",
  LOW: "bg-green-900 text-green-200",
};

const PRIORITY_COLORS: Record<string, string> = {
  Low: "bg-green-900 text-green-200",
  Medium: "bg-yellow-900 text-yellow-200",
  High: "bg-orange-900 text-orange-200",
  Major: "bg-red-900 text-red-200",
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-blue-900 text-blue-200",
  IN_PROGRESS: "bg-purple-900 text-purple-200",
  CLOSED: "bg-green-900 text-green-200",
  ON_HOLD: "bg-red-900 text-red-200",
  AS_IT_IS: "bg-slate-700 text-slate-200",
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
      className="flex items-center gap-2 hover:text-blue-300 font-semibold hover:bg-slate-700 px-2 py-1 rounded transition-colors uppercase tracking-wide text-white"
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
        className="flex items-center gap-1 hover:text-blue-300 font-semibold hover:bg-slate-700 px-2 py-1 rounded transition-colors uppercase tracking-wide text-white"
      >
        {label}
        <HiChevronDown className="w-4 h-4" />
      </button>
      {isOpen && (
        <div
          className="absolute top-full left-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-10 min-w-max p-2"
          onMouseLeave={onClose}
        >
          <div className="space-y-2">
            {options.map((option) => (
              <label key={option.value} className="flex items-center gap-2 cursor-pointer hover:bg-slate-700 px-2 py-1 rounded">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onChange([...selectedValues, option.value]);
                    } else {
                      onChange(selectedValues.filter((v) => v !== option.value));
                    }
                  }}
                  className="rounded border-slate-600 text-blue-500 focus:ring-blue-500 cursor-pointer bg-slate-700"
                />
                <span className="text-sm text-slate-200">{option.label}</span>
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
  const [moduleFilter, setModuleFilter] = useState<string[]>([]);
  const [severityFilter, setSeverityFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Filter defects based on selected criteria
  const filteredDefects = defects.filter((defect) => {
    const moduleMatch = moduleFilter.length === 0 || moduleFilter.some(m => defect.module.includes(m));
    const severityMatch = severityFilter.length === 0 || severityFilter.includes(defect.severity);
    const priorityMatch = priorityFilter.length === 0 || priorityFilter.includes(defect.priority);
    
    // Map user-friendly status labels to enum values
    const statusValueMap: Record<string, string> = {
      "Pending": "ON_HOLD",
      "Fixed": "CLOSED",
      "As it is": "AS_IT_IS",
      "Hold": "ON_HOLD"
    };
    const mappedStatusFilter = statusFilter.map(s => statusValueMap[s] || s);
    const statusMatch = statusFilter.length === 0 || mappedStatusFilter.includes(defect.status);
    
    return moduleMatch && severityMatch && priorityMatch && statusMatch;
  });

  return (
    <div className="bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden hover:shadow-2xl transition-shadow backdrop-blur-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-700">
          <thead className="bg-gradient-to-r from-slate-800 to-slate-900">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                <SortButton
                  column="date"
                  label="Date Reported"
                  currentSort={sortBy}
                  currentOrder={sortOrder}
                  onClick={onSortChange || (() => {})}
                />
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
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
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                <FilterDropdown
                  label="Severity"
                  options={[
                    { value: "LOW", label: "Low" },
                    { value: "MEDIUM", label: "Medium" },
                    { value: "HIGH", label: "High" },
                    { value: "CRITICAL", label: "Major" },
                  ]}
                  selectedValues={severityFilter}
                  onChange={setSeverityFilter}
                  isOpen={openDropdown === "severity"}
                  onOpen={() => setOpenDropdown("severity")}
                  onClose={() => setOpenDropdown(null)}
                />
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
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
              <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
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
              <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                Date Fixed
              </th>
            </tr>
          </thead>
          <tbody className="bg-gradient-to-b from-slate-800 to-slate-900 divide-y divide-slate-700">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-300 border-t-blue-500"></div>
                    <span className="text-slate-600 font-medium">Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : filteredDefects.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-slate-500"
                >
                  <div className="flex flex-col items-center gap-2">
                    <HiInbox className="text-2xl text-slate-500" />
                    <p className="font-medium text-slate-300">No defects found</p>
                    <p className="text-xs text-slate-500">Try adjusting your filters</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredDefects.map((defect) => (
                <tr key={defect.id} className="hover:bg-slate-700 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                    {defect.dateReported ? formatDate(defect.dateReported) : "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    <span className="px-3 py-1.5 bg-slate-700 rounded-lg text-xs font-medium">{defect.module}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        SEVERITY_COLORS[defect.severity]
                      }`}
                    >
                      {defect.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        PRIORITY_COLORS[defect.priority] || "bg-slate-700 text-slate-200"
                      }`}
                    >
                      {defect.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        STATUS_COLORS[defect.status]
                      }`}
                    >
                      {STATUS_LABELS[defect.status] ?? defect.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {defect.dateFixed ? formatDate(defect.dateFixed) : <span className="text-slate-500">—</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4 border-t border-slate-700 flex items-center justify-between">
        <div className="text-sm text-slate-300 font-medium">
          Page <span className="font-bold text-white">{currentPage}</span> of <span className="font-bold text-white">{totalPages}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
            className="px-4 py-2.5 border border-slate-700 rounded-lg text-sm font-semibold text-slate-300 hover:bg-slate-700 hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ← Previous
          </button>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
            className="px-4 py-2.5 border border-slate-700 rounded-lg text-sm font-semibold text-slate-300 hover:bg-slate-700 hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
