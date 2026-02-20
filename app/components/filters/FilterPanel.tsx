"use client";

import React, { useState, useEffect } from "react";
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
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        {(dateFrom || dateTo || severities.length > 0 || modules.length > 0 || statuses.length > 0) && (
          <button
            onClick={clearFilters}
            className="text-sm text-red-600 hover:text-red-800 transition"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date From
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date To
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>

        {/* Severity Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Severity
          </label>
          <div className="space-y-2">
            {Object.values(SeverityEnum).map((severity: string) => (
              <label
                key={severity as string}
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={severities.includes(severity as string)}
                  onChange={() => handleSeverityToggle(severity as string)}
                  disabled={isLoading}
                  className="rounded border-gray-300"
                />
                <span className="text-gray-700">{severity as string}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <div className="space-y-2">
            {Object.values(StatusEnum).map((status: string) => (
              <label
                key={status as string}
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={statuses.includes(status as string)}
                  onChange={() => handleStatusToggle(status as string)}
                  disabled={isLoading}
                  className="rounded border-gray-300"
                />
                <span className="text-gray-700">{status as string}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Modules */}
      {availableModules.length > 0 && (
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Modules
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {availableModules.map((module) => (
              <label
                key={module}
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={modules.includes(module)}
                  onChange={() => handleModuleToggle(module)}
                  disabled={isLoading}
                  className="rounded border-gray-300"
                />
                <span className="text-gray-700 truncate">{module}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
