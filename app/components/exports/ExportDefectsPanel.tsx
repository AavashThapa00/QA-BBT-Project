"use client";

import React, { useState } from "react";
import { HiDownload, HiX } from "react-icons/hi";
import { exportAllDefects } from "@/app/actions/defects";
import { DefectFilters } from "@/lib/types";
import { enrichDefectsWithCalculations, exportToCSV, formatDateForInput } from "@/lib/utils";

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
    currentFilters.dateFrom ? formatDateForInput(currentFilters.dateFrom) : ""
  );
  const [dateTo, setDateTo] = useState<string>(
    currentFilters.dateTo ? formatDateForInput(currentFilters.dateTo) : ""
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
      const message = err instanceof Error ? err.message : "Failed to export defects";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Modal with Page Blur Effect */}
      <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}>
        {/* Blurred Background Overlay */}
        <div 
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Modal Dialog */}
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className={`bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all duration-400 ${
            isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
          }`}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <HiDownload className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-slate-900">
                  Export All Defects
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Close"
              >
                <HiX className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                Filter by date range to export all defects matching your criteria.
              </p>

              <div className="space-y-4">
                {/* From Date */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    From Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400"
                  />
                </div>

                {/* To Date */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    To Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400"
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Info */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    💡 All active filters will be included in the export.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-slate-200">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
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
