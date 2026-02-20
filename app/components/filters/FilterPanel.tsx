"use client";

import React, { useState, useEffect } from "react";
import { HiFilter, HiX } from "react-icons/hi";
import type { Severity, Status } from "@/lib/types";
import { SeverityEnum, StatusEnum, type DefectFilters } from "@/lib/types";
import { formatDateForInput } from "@/lib/utils";

interface FilterPanelProps {
  onFiltersChange: (filters: DefectFilters) => void;
  availableModules?: string[];
  isLoading?: boolean;
}

export default function FilterPanel({
  onFiltersChange,
  availableModules = [],
  isLoading = false,
}: FilterPanelProps) {
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [severities, setSeverities] = useState<string[]>([]);
  const [modules, setModules] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);

  useEffect(() => {
    const filters: DefectFilters = {};

    if (dateFrom) filters.dateFrom = new Date(dateFrom);
    if (dateTo) filters.dateTo = new Date(dateTo);
    if (severities.length > 0) filters.severity = severities as Severity[];
    if (modules.length > 0) filters.module = modules;
    if (statuses.length > 0) filters.status = statuses as Status[];

    onFiltersChange(filters);
  }, [dateFrom, dateTo, severities, modules, statuses, onFiltersChange]);

  const handleSeverityToggle = (severity: string) => {
    setSeverities((prev) =>
      prev.includes(severity)
        ? prev.filter((s) => s !== severity)
        : [...prev, severity]
    );
  };

  const handleModuleToggle = (module: string) => {
    setModules((prev) =>
      prev.includes(module)
        ? prev.filter((m) => m !== module)
        : [...prev, module]
    );
  };

  const handleStatusToggle = (status: string) => {
    setStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setSeverities([]);
    setModules([]);
    setStatuses([]);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-600 flex items-center justify-center text-sm"><HiFilter className="w-5 h-5"/></span>
          Filter Results
        </h3>
        {(dateFrom || dateTo || severities.length > 0 || modules.length > 0 || statuses.length > 0) && (
          <button
            onClick={clearFilters}
            className="text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2"
          >
            <HiX className="w-4 h-4" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Date Range */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
            Date From
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed hover:border-slate-400 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
            Date To
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed hover:border-slate-400 transition-colors"
          />
        </div>

        {/* Severity Filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">
            Severity
          </label>
          <div className="space-y-2.5">
            {Object.values(SeverityEnum).map((severity: string) => (
              <label
                key={severity as string}
                className="flex items-center gap-3 text-sm cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={severities.includes(severity as string)}
                  onChange={() => handleSeverityToggle(severity as string)}
                  disabled={isLoading}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
                />
                <span className="text-slate-700 group-hover:text-slate-900 font-medium">{severity as string}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">
            Status
          </label>
          <div className="space-y-2.5">
            {Object.values(StatusEnum).map((status: string) => (
              <label
                key={status as string}
                className="flex items-center gap-3 text-sm cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={statuses.includes(status as string)}
                  onChange={() => handleStatusToggle(status as string)}
                  disabled={isLoading}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
                />
                <span className="text-slate-700 group-hover:text-slate-900 font-medium">{status as string}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Modules */}
      {availableModules.length > 0 && (
        <div className="mt-8 pt-8 border-t border-slate-200">
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-4">
            Modules ({modules.length} selected)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {availableModules.map((module) => (
              <label
                key={module}
                className="flex items-center gap-3 px-3 py-2 rounded-lg border border-slate-200 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors group"
              >
                <input
                  type="checkbox"
                  checked={modules.includes(module)}
                  onChange={() => handleModuleToggle(module)}
                  disabled={isLoading}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
                />
                <span className="text-sm text-slate-700 group-hover:text-slate-900 font-medium truncate">{module}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
