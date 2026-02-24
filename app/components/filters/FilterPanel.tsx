"use client";

import React, { useState } from "react";
import { HiFilter, HiX, HiSearch } from "react-icons/hi";
import type { Severity, Status } from "@/lib/types";
import { SeverityEnum, StatusEnum, type DefectFilters } from "@/lib/types";

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
  const [searchInput, setSearchInput] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [severities, setSeverities] = useState<string[]>([]);
  const [modules, setModules] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);

  // Handle search on Enter key press
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      applyFilters();
    }
  };

  // Apply filters when user clicks the button or presses Enter
  const applyFilters = () => {
    const filters: DefectFilters = {};

    if (searchInput && searchInput.length >= 3) filters.searchTerm = searchInput;
    if (dateFrom) filters.dateFrom = new Date(dateFrom);
    if (dateTo) filters.dateTo = new Date(dateTo);
    if (severities.length > 0) filters.severity = severities as Severity[];
    if (modules.length > 0) filters.module = modules;
    if (statuses.length > 0) filters.status = statuses as Status[];

    onFiltersChange(filters);
  };

  // Handle clearing the search
  const handleClearSearch = () => {
    setSearchInput("");
  };

  const handleSeverityToggle = (Severity: string) => {
    setSeverities((prev) =>
      prev.includes(Severity)
        ? prev.filter((s) => s !== Severity)
        : [...prev, Severity]
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
    setSearchInput("");
    setDateFrom("");
    setDateTo("");
    setSeverities([]);
    setModules([]);
    setStatuses([]);
    onFiltersChange({});
  };

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-800 shadow-sm p-6 sm:p-8\">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <HiFilter className="w-5 h-5 text-blue-400" />
          Filter Results
        </h3>
        {((searchInput && searchInput.length >= 3) || dateFrom || dateTo || severities.length > 0 || modules.length > 0 || statuses.length > 0) && (
          <button
            onClick={clearFilters}
            className="text-xs font-semibold text-slate-400 hover:text-slate-300 hover:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2"
          >
            <HiX className="w-4 h-4" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <HiSearch className="absolute left-3 top-3.5 w-5 h-5 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search issue, module"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              disabled={isLoading}
              className="w-full pl-10 pr-10 py-2.5 border border-slate-700 rounded-lg text-sm text-white bg-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed hover:border-slate-600 transition-colors"
            />
            {(searchInput && searchInput.length >= 3) && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                title="Clear search"
              >
                <HiX className="w-5 h-5" />
              </button>
            )}
          </div>
          <button
            onClick={applyFilters}
            disabled={isLoading}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <HiSearch className="w-4 h-4" />
            <span>Search</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Date Range */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-2">
            Date From
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2.5 border border-slate-700 rounded-lg text-sm text-white bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed hover:border-slate-600 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-2">
            Date To
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2.5 border border-slate-700 rounded-lg text-sm text-white bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed hover:border-slate-600 transition-colors"
          />
        </div>

        {/* Priority Filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-3">
            Priority
          </label>
          <div className="space-y-2.5">
            {Object.values(SeverityEnum).map((Severity: string) => (
              <label
                key={Severity as string}
                className="flex items-center gap-3 text-sm cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={severities.includes(Severity as string)}
                  onChange={() => handleSeverityToggle(Severity as string)}
                  disabled={isLoading}
                  className="rounded border-slate-600 text-blue-500 focus:ring-blue-500 disabled:opacity-50 cursor-pointer bg-slate-700"
                />
                <span className="text-slate-300 group-hover:text-white font-medium">{Severity as string}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-3">
            Status
          </label>
          <div className="space-y-2.5">
            {[
              { value: StatusEnum.ON_HOLD, label: "Pending" },
              { value: StatusEnum.CLOSED, label: "Fixed" },
              { value: StatusEnum.AS_IT_IS, label: "As it is" },
              { value: StatusEnum.OPEN, label: "Hold" },
            ].map((status) => (
              <label
                key={status.value}
                className="flex items-center gap-3 text-sm cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={statuses.includes(status.value)}
                  onChange={() => handleStatusToggle(status.value)}
                  disabled={isLoading}
                  className="rounded border-slate-600 text-blue-500 focus:ring-blue-500 disabled:opacity-50 cursor-pointer bg-slate-700"
                />
                <span className="text-slate-300 group-hover:text-white font-medium">{status.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Modules */}
      {availableModules.length > 0 && (
        <div className="mt-8 pt-8 border-t border-slate-700">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-4">
            Modules ({modules.length} selected)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {availableModules.map((module) => (
              <label
                key={module}
                className="flex items-center gap-3 px-3 py-2 rounded-lg border border-slate-700 bg-slate-800/50 cursor-pointer hover:border-blue-500 hover:bg-slate-700 transition-colors group"
              >
                <input
                  type="checkbox"
                  checked={modules.includes(module)}
                  onChange={() => handleModuleToggle(module)}
                  disabled={isLoading}
                  className="rounded border-slate-600 text-blue-500 focus:ring-blue-500 disabled:opacity-50 cursor-pointer bg-slate-700"
                />
                <span className="text-sm text-slate-300 group-hover:text-white font-medium truncate">{module}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Apply Filters Button */}
      <div className="mt-8 pt-6 border-t border-slate-700 flex gap-3 justify-end">
        <button
          onClick={clearFilters}
          className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium rounded-lg transition-colors border border-slate-700 hover:border-slate-600"
        >
          Reset
        </button>
        <button
          onClick={applyFilters}
          disabled={isLoading}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}

