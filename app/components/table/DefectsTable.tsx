"use client";

import React from "react";
import { HiInbox } from "react-icons/hi";
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
  CRITICAL: "bg-red-100 text-red-800",
  HIGH: "bg-orange-100 text-orange-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  LOW: "bg-green-100 text-green-800",
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-purple-100 text-purple-800",
  CLOSED: "bg-green-100 text-green-800",
  ON_HOLD: "bg-red-100 text-red-800",
  AS_IT_IS: "bg-slate-100 text-slate-800",
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
      className="flex items-center gap-2 hover:text-blue-600 font-semibold hover:bg-slate-100 px-2 py-1 rounded transition-colors"
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
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                <SortButton
                  column="date"
                  label="Date Reported"
                  currentSort={sortBy}
                  currentOrder={sortOrder}
                  onClick={onSortChange || (() => {})}
                />
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Module
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                <SortButton
                  column="severity"
                  label="Severity"
                  currentSort={sortBy}
                  currentOrder={sortOrder}
                  onClick={onSortChange || (() => {})}
                />
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                <SortButton
                  column="status"
                  label="Status"
                  currentSort={sortBy}
                  currentOrder={sortOrder}
                  onClick={onSortChange || (() => {})}
                />
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Date Fixed
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-300 border-t-blue-500"></div>
                    <span className="text-slate-600 font-medium">Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : defects.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-slate-500"
                >
                  <div className="flex flex-col items-center gap-2">
                    <HiInbox className="text-2xl" />
                    <p className="font-medium">No defects found</p>
                    <p className="text-xs text-slate-400">Try adjusting your filters</p>
                  </div>
                </td>
              </tr>
            ) : (
              defects.map((defect) => (
                <tr key={defect.id} className="hover:bg-blue-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">
                    {defect.dateReported ? formatDate(defect.dateReported) : "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    <span className="px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-medium">{defect.module}</span>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">
                    {defect.priority}
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {defect.dateFixed ? formatDate(defect.dateFixed) : <span className="text-slate-400">—</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
        <div className="text-sm text-slate-600 font-medium">
          Page <span className="font-bold text-slate-900">{currentPage}</span> of <span className="font-bold text-slate-900">{totalPages}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
            className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ← Previous
          </button>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
            className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
