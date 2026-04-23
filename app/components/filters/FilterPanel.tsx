"use client";

import React, { useState } from "react";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import {
  HiCheck,
  HiChevronDown,
  HiFilter,
  HiSearch,
  HiX,
} from "react-icons/hi";
import type { Status } from "@/lib/types";
import { StatusEnum, type DefectFilters } from "@/lib/types";

interface FilterPanelProps {
  onFiltersChange: (filters: DefectFilters) => void;
  availableModules?: string[];
  isLoading?: boolean;
  showSearch?: boolean;
  compact?: boolean;
}

interface MultiSelectDropdownProps {
  label: string;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
  selectedValues: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
}

function MultiSelectDropdown({
  label,
  placeholder,
  options,
  selectedValues,
  onChange,
  disabled = false,
}: MultiSelectDropdownProps) {
  const selectedCount = selectedValues.length;
  const selectedOptions = options.filter((option) =>
    selectedValues.includes(option.value),
  );

  const removeSelectedValue = (value: string) => {
    onChange(selectedValues.filter((selected) => selected !== value));
  };

  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-(--muted-color)">
        {label}
      </label>
      <Listbox
        value={selectedValues}
        onChange={onChange}
        multiple
        disabled={disabled}
      >
        <div className="relative">
          <ListboxButton className="flex w-full items-center justify-between rounded-md border border-(--border-color) bg-(--surface-soft) px-3 py-2 text-left text-sm text-(--text-color) transition-colors hover:border-(--primary-color) disabled:cursor-not-allowed disabled:opacity-50">
            <span className="truncate">
              {selectedCount > 0 ? `${selectedCount} selected` : placeholder}
            </span>
            <HiChevronDown className="h-4 w-4 text-(--muted-color)" />
          </ListboxButton>

          <ListboxOptions
            anchor={{ to: "bottom start", gap: 6, padding: 12 }}
            style={{ width: "var(--button-width)" }}
            className="z-30 max-h-56 overflow-auto rounded-md border border-(--border-color) bg-(--surface) p-1 shadow-md focus:outline-none"
          >
            {options.map((option) => (
              <ListboxOption
                key={option.value}
                value={option.value}
                className={({ active }) =>
                  `cursor-pointer rounded-md px-2 py-2 text-sm ${
                    active
                      ? "bg-slate-50 text-(--heading-color)"
                      : "text-(--text-color)"
                  }`
                }
              >
                {({ selected }) => (
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate">{option.label}</span>
                    {selected ? (
                      <HiCheck className="h-4 w-4 text-(--primary-color)" />
                    ) : null}
                  </div>
                )}
              </ListboxOption>
            ))}
          </ListboxOptions>
        </div>
      </Listbox>

      {selectedOptions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selectedOptions.map((option) => (
            <span
              key={option.value}
              className="inline-flex items-center gap-1 rounded-full border border-(--border-color) bg-(--surface-soft) px-2 py-0.5 text-xs text-(--text-color)"
            >
              <span className="max-w-30 truncate">{option.label}</span>
              <button
                type="button"
                onClick={() => removeSelectedValue(option.value)}
                disabled={disabled}
                className="rounded-full p-0.5 text-(--muted-color) transition-colors hover:bg-slate-200 hover:text-(--heading-color) disabled:opacity-50"
                aria-label={`Remove ${option.label}`}
                title={`Remove ${option.label}`}
              >
                <HiX className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FilterPanel({
  onFiltersChange,
  availableModules = [],
  isLoading = false,
  showSearch = true,
  compact = false,
}: FilterPanelProps) {
  const [searchInput, setSearchInput] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [priorities, setPriorities] = useState<string[]>([]);
  const [modules, setModules] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);

  const priorityOptions = ["CRITICAL", "HIGH", "MEDIUM", "LOW"].map(
    (priority) => ({
      value: priority,
      label: priority,
    }),
  );

  const statusOptions = [
    { value: StatusEnum.PENDING, label: "Pending" },
    { value: StatusEnum.RE_OPENED, label: "Re-opened" },
    { value: StatusEnum.HOLD, label: "Hold" },
    { value: StatusEnum.FIXED, label: "Fixed" },
    { value: StatusEnum.AS_IT_IS, label: "As it is" },
  ];

  const moduleOptions = availableModules.map((module) => ({
    value: module,
    label: module,
  }));

  const hasSearch = showSearch && searchInput.trim().length >= 3;
  const hasAnyFilter =
    hasSearch ||
    Boolean(dateFrom) ||
    Boolean(dateTo) ||
    priorities.length > 0 ||
    modules.length > 0 ||
    statuses.length > 0;
  const activeFilterCount =
    (hasSearch ? 1 : 0) +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0) +
    (priorities.length > 0 ? 1 : 0) +
    (modules.length > 0 ? 1 : 0) +
    (statuses.length > 0 ? 1 : 0);

  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayFormatted = formatDateForInput(new Date());

  const getRangeDates = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - (days - 1));
    return {
      fromValue: formatDateForInput(from),
      toValue: formatDateForInput(to),
    };
  };

  const activeQuickRange = [7, 14, 30].find((days) => {
    const { fromValue, toValue } = getRangeDates(days);
    return dateFrom === fromValue && dateTo === toValue;
  });

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

    if (searchInput && searchInput.length >= 3)
      filters.searchTerm = searchInput;
    if (dateFrom) filters.dateFrom = new Date(dateFrom);
    if (dateTo) filters.dateTo = new Date(dateTo);
    if (priorities.length > 0) filters.priority = priorities;
    if (modules.length > 0) filters.module = modules;
    if (statuses.length > 0) filters.status = statuses as Status[];

    onFiltersChange(filters);
  };

  const applyLastDays = (days: number) => {
    const { fromValue, toValue } = getRangeDates(days);

    setDateFrom(fromValue);
    setDateTo(toValue);

    onFiltersChange({
      ...(hasSearch ? { searchTerm: searchInput } : {}),
      ...(priorities.length > 0 ? { priority: priorities } : {}),
      ...(modules.length > 0 ? { module: modules } : {}),
      ...(statuses.length > 0 ? { status: statuses as Status[] } : {}),
      dateFrom: new Date(fromValue),
      dateTo: new Date(toValue),
    });
  };

  // Handle clearing the search
  const handleClearSearch = () => {
    setSearchInput("");
  };

  const clearFilters = () => {
    setSearchInput("");
    setDateFrom("");
    setDateTo("");
    setPriorities([]);
    setModules([]);
    setStatuses([]);
    onFiltersChange({});
  };

  return (
    <div
      className={
        compact
          ? "rounded-xl"
          : "rounded-xl border border-(--border-color) bg-(--surface) p-4 shadow-sm"
      }
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-(--heading-color)">
            <HiFilter className="h-4 w-4 text-(--primary-color)" />
            Filters
          </h3>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch ? (
        <div className="mb-4">
          <div className="relative flex flex-col gap-2">
            <div className="relative flex-1">
              <HiSearch className="absolute left-2 top-3.25 w-4 h-4 text-(--muted-color) pointer-events-none" />
              <input
                type="text"
                placeholder="Search by issue or module"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyPress}
                disabled={isLoading}
                className="w-full pl-8 placeholder:text-sm pr-2 py-2.5 border border-(--border-color) rounded-md text-sm text-(--text-color) bg-(--surface-soft) placeholder-(--muted-color) focus:outline-none focus:ring-2 focus:ring-(--primary-color) focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed hover:border-(--primary-color) transition-colors"
              />
              {searchInput && searchInput.length >= 3 && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-2 top-3.5 text-(--muted-color) hover:text-(--heading-color) transition-colors"
                  title="Clear search"
                >
                  <HiX className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={applyFilters}
              disabled={isLoading}
              className="bg-(--primary-color) hover:bg-(--primary-hover-color) text-white font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 whitespace-nowrap justify-center px-4 py-2 text-sm"
            >
              <HiSearch className="w-4 h-4" />
              <span>Search</span>
            </button>
          </div>
          {searchInput.trim().length > 0 && searchInput.trim().length < 3 && (
            <p className="mt-2 text-xs text-amber-700">
              Enter at least 3 characters to apply search.
            </p>
          )}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-(--muted-color) uppercase tracking-wide mb-2">
              Date From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              max={todayFormatted}
              disabled={isLoading}
              className="w-full px-3 py-2.5 border border-(--border-color) rounded-md text-xs text-(--text-color) bg-(--surface-soft) focus:outline-none focus:ring-2 focus:ring-(--primary-color) focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed hover:border-(--primary-color) transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-(--muted-color) uppercase tracking-wide mb-2">
              Date To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              max={todayFormatted}
              disabled={isLoading}
              className="w-full px-3 py-2.5 border border-(--border-color) rounded-md text-xs text-(--text-color) bg-(--surface-soft) focus:outline-none focus:ring-2 focus:ring-(--primary-color) focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed hover:border-(--primary-color) transition-colors"
            />
          </div>
        </div>

        <MultiSelectDropdown
          label="Priority"
          placeholder="Select priority"
          options={priorityOptions}
          selectedValues={priorities}
          onChange={setPriorities}
          disabled={isLoading}
        />

        <MultiSelectDropdown
          label="Status"
          placeholder="Select status"
          options={statusOptions}
          selectedValues={statuses}
          onChange={setStatuses}
          disabled={isLoading}
        />
      </div>

      {/* Modules */}
      {availableModules.length > 0 && (
        <div className="mt-4 border-t border-(--border-color) pt-4">
          <MultiSelectDropdown
            label="Modules"
            placeholder="Select modules"
            options={moduleOptions}
            selectedValues={modules}
            onChange={setModules}
            disabled={isLoading}
          />
        </div>
      )}

      {/* Apply Filters Button */}
      <div className="mt-4 flex gap-2 justify-stretch border-t border-(--border-color) pt-4">
        <button
          onClick={clearFilters}
          disabled={!hasAnyFilter}
          className="bg-(--surface-soft) hover:bg-slate-100 text-(--muted-color) hover:text-(--heading-color) font-medium rounded-md transition-colors border border-(--border-color) hover:border-(--primary-color) flex-1 px-4 py-2 text-sm"
        >
          Reset
        </button>
        <button
          onClick={applyFilters}
          disabled={
            isLoading ||
            (showSearch &&
              searchInput.trim().length > 0 &&
              searchInput.trim().length < 3)
          }
          className="bg-(--primary-color) hover:bg-(--primary-hover-color) text-white font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-1 px-4 py-2 text-sm"
        >
          Apply Filters ({activeFilterCount})
        </button>
      </div>
    </div>
  );
}
