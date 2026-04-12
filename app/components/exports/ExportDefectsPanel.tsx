"use client";

import React, { useState } from "react";
import { HiDownload, HiX } from "react-icons/hi";
import { exportAllDefects } from "@/app/actions/defects";
import { DefectFilters } from "@/lib/types";
import {
  enrichDefectsWithCalculations,
  exportToCSV,
  formatDateForInput,
} from "@/lib/utils";

interface ExportDefectsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilters?: DefectFilters;
}

export default function ExportDefectsPanel({
  isOpen,
  onClose,
  currentFilters = {},
}: ExportDefectsPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState<string>(
    currentFilters.dateFrom ? formatDateForInput(currentFilters.dateFrom) : "",
  );
  const [dateTo, setDateTo] = useState<string>(
    currentFilters.dateTo ? formatDateForInput(currentFilters.dateTo) : "",
  );
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate dates
      let dateFromObj: Date | undefined;
      let dateToObj: Date | undefined;

      if (dateFrom) {
        dateFromObj = new Date(dateFrom);
        if (isNaN(dateFromObj.getTime())) {
          setError("Invalid 'From Date'. Please use YYYY-MM-DD format.");
          setIsLoading(false);
          return;
        }
      }

      if (dateTo) {
        dateToObj = new Date(dateTo);
        if (isNaN(dateToObj.getTime())) {
          setError("Invalid 'To Date'. Please use YYYY-MM-DD format.");
          setIsLoading(false);
          return;
        }
      }

      if (dateFromObj && dateToObj && dateFromObj > dateToObj) {
        setError("'From Date' must be before 'To Date'.");
        setIsLoading(false);
        return;
      }

      // Build filters with date range and other current filters
      const exportFilters: DefectFilters = {
        ...currentFilters,
        dateFrom: dateFromObj,
        dateTo: dateToObj,
      };

      // Fetch all defects with filters
      const allDefects = await exportAllDefects(exportFilters);

      if (allDefects.length === 0) {
        setError("No defects found matching the selected criteria.");
        setIsLoading(false);
        return;
      }

      // Enrich and export
      const enrichedDefects = enrichDefectsWithCalculations(allDefects);
      const filename = `defects-export-${new Date().toISOString().split("T")[0]}.csv`;
      exportToCSV(enrichedDefects, filename);

      // Close modal after success
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to export defects";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Modal with Page Blur Effect */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Blurred Background Overlay */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Dialog */}
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md transform rounded-2xl border border-(--border-color) bg-(--surface) shadow-[0_24px_60px_rgba(27,94,32,0.2)] transition-all duration-400 ${
              isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-(--border-color) p-6">
              <div className="flex items-center gap-2">
                <HiDownload className="w-5 h-5 text-(--primary-color)" />
                <h2 className="text-lg font-semibold text-(--heading-color)">
                  Export All Defects
                </h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1 transition-colors hover:bg-emerald-50"
                aria-label="Close"
              >
                <HiX className="w-5 h-5 text-(--muted-color)" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-(--muted-color)">
                Filter by date range to export all defects matching your
                criteria.
              </p>

              <div className="space-y-4">
                {/* From Date */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-(--text-color)">
                    From Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full rounded-lg border border-(--border-color) bg-(--surface-soft) px-3 py-2 text-(--text-color) placeholder-(--muted-color) focus:border-transparent focus:ring-2 focus:ring-(--primary-color)"
                  />
                </div>

                {/* To Date */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-(--text-color)">
                    To Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full rounded-lg border border-(--border-color) bg-(--surface-soft) px-3 py-2 text-(--text-color) placeholder-(--muted-color) focus:border-transparent focus:ring-2 focus:ring-(--primary-color)"
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
                    <p className="text-sm text-rose-700">{error}</p>
                  </div>
                )}

                {/* Info */}
                <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                  <p className="text-sm text-emerald-700">
                    All active filters will be included in the export.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 border-t border-(--border-color) p-6">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 rounded-lg border border-(--border-color) px-4 py-2 font-medium text-(--muted-color) transition-colors hover:bg-emerald-50 hover:text-(--heading-color) disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={isLoading}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-(--primary-color) px-4 py-2 font-medium text-white transition-colors hover:bg-(--primary-hover-color) disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <HiDownload className="w-4 h-4" />
                    <span>Export</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes modalEnter {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </>
  );
}
