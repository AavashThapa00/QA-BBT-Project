"use client";

import React, { Fragment, useEffect, useState } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import {
  HiCheck,
  HiChevronDown,
  HiDownload,
  HiFolderOpen,
  HiX,
} from "react-icons/hi";
import { exportAllDefects, getDefectsByModule } from "@/app/actions/defects";
import { DefectFilters } from "@/lib/types";
import {
  enrichDefectsWithCalculations,
  exportToExcel,
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
  const [projectOptions, setProjectOptions] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState("ALL");
  const [isLoading, setIsLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState<string>(
    currentFilters.dateFrom ? formatDateForInput(currentFilters.dateFrom) : "",
  );
  const [dateTo, setDateTo] = useState<string>(
    currentFilters.dateTo ? formatDateForInput(currentFilters.dateTo) : "",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setDateFrom(
      currentFilters.dateFrom
        ? formatDateForInput(currentFilters.dateFrom)
        : "",
    );
    setDateTo(
      currentFilters.dateTo ? formatDateForInput(currentFilters.dateTo) : "",
    );
    setSelectedProject("ALL");
    setError(null);

    const loadProjects = async () => {
      try {
        const { module: _ignoredModuleFilter, ...baseFilters } = currentFilters;
        const modules = await getDefectsByModule(baseFilters);
        const options = modules
          .map((item) => item.module?.trim())
          .filter((module): module is string => !!module);
        setProjectOptions(options);
      } catch {
        setProjectOptions([]);
      }
    };

    loadProjects();
  }, [isOpen, currentFilters]);

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
        module: selectedProject === "ALL" ? undefined : [selectedProject],
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
      const filename = `defects-export-${new Date().toISOString().split("T")[0]}.xlsx`;
      exportToExcel(enrichedDefects, filename);

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

  const projectItems = ["ALL", ...projectOptions];

  if (!isOpen) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 overlay-backdrop backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-xl overflow-hidden rounded-2xl border border-(--border-color) bg-(--surface) shadow-2xl">
                <div className="border-b border-(--border-color) bg-(--surface-soft) px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-(--primary-color) p-2 text-white">
                      <HiDownload className="h-5 w-5" />
                    </div>
                    <div>
                      <DialogTitle className="text-lg font-bold text-(--heading-color)">
                        Export Defects
                      </DialogTitle>
                      <p className="text-xs text-(--muted-color)">
                        Download a clean Excel file with project and date
                        filters.
                      </p>
                    </div>
                    <button
                      onClick={onClose}
                      className="ml-auto rounded-lg p-2 text-(--muted-color) transition-colors hover:bg-emerald-50 hover:text-(--heading-color)"
                      aria-label="Close"
                    >
                      <HiX className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-5 px-6 py-5">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-(--muted-color)">
                      Project
                    </label>
                    <Listbox
                      value={selectedProject}
                      onChange={setSelectedProject}
                    >
                      <div className="relative">
                        <ListboxButton className="flex w-full items-center justify-between rounded-lg border border-(--border-color) bg-(--surface-soft) px-3 py-2.5 text-left text-sm text-(--text-color) transition-colors hover:border-(--primary-color) focus:outline-none focus:ring-2 focus:ring-(--primary-color)/30">
                          <span className="flex items-center gap-2">
                            <HiFolderOpen className="h-4 w-4 text-(--muted-color)" />
                            {selectedProject === "ALL"
                              ? "All projects"
                              : selectedProject}
                          </span>
                          <HiChevronDown className="h-4 w-4 text-(--muted-color)" />
                        </ListboxButton>
                        <ListboxOptions className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-(--border-color) bg-(--surface) p-1 shadow-lg focus:outline-none">
                          {projectItems.map((project) => (
                            <ListboxOption
                              key={project}
                              value={project}
                              className={({ active }) =>
                                `cursor-pointer rounded-md px-3 py-2 text-sm ${
                                  active
                                    ? "bg-slate-50 text-(--heading-color)"
                                    : "text-(--text-color)"
                                }`
                              }
                            >
                              {({ selected }) => (
                                <div className="flex items-center justify-between gap-2">
                                  <span>
                                    {project === "ALL"
                                      ? "All projects"
                                      : project}
                                  </span>
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
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-(--muted-color)">
                        From Date
                      </label>
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-full rounded-lg border border-(--border-color) bg-(--surface-soft) px-3 py-2 text-sm text-(--text-color) transition-colors focus:outline-none focus:ring-2 focus:ring-(--primary-color)/30"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-(--muted-color)">
                        To Date
                      </label>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-full rounded-lg border border-(--border-color) bg-(--surface-soft) px-3 py-2 text-sm text-(--text-color) transition-colors focus:outline-none focus:ring-2 focus:ring-(--primary-color)/30"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                      {error}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 border-t border-(--border-color) px-6 py-4">
                  <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="flex-1 rounded-lg border border-(--border-color) px-4 py-2 text-sm font-medium text-(--muted-color) transition-colors hover:bg-emerald-50 hover:text-(--heading-color) disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExport}
                    disabled={isLoading}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-(--primary-color) px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-(--primary-hover-color) disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Exporting...</span>
                      </>
                    ) : (
                      <>
                        <HiDownload className="h-4 w-4" />
                        <span>Export Defects</span>
                      </>
                    )}
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
