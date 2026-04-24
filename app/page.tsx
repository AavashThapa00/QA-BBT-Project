"use client";

import React, {
  Fragment,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import ExportDefectsPanel from "@/app/components/exports/ExportDefectsPanel";
import {
  HiDownload,
  HiClipboardList,
  HiChartBar,
  HiExclamationCircle,
  HiFilter,
  HiX,
} from "react-icons/hi";
import MetricsCard from "@/app/components/dashboard/MetricsCard";
import FilterPanel from "@/app/components/filters/FilterPanel";
import {
  SkeletonCard,
  SkeletonChart,
  SkeletonTable,
} from "@/app/components/common/SkeletonLoader";
import {
  getDefectMetrics,
  getDefectsByModule,
  getDefectsByPriority,
  getDefectsTrend,
  getDefects,
  getAverageResolutionTime,
} from "@/app/actions/defects";
import {
  DefectFilters,
  DashboardMetrics,
  DefectByModule,
  DefectByPriority,
  DefectTrend,
  Defect,
} from "@/lib/types";

const DefectsByModuleChart = dynamic(
  () => import("@/app/components/dashboard/DefectsByModuleChart"),
  { ssr: false, loading: () => <SkeletonChart /> },
);

const DefectsByPriorityChart = dynamic(
  () => import("@/app/components/dashboard/DefectsByPriorityChart"),
  { ssr: false, loading: () => <SkeletonChart /> },
);

const DefectsTrendChart = dynamic(
  () => import("@/app/components/dashboard/DefectsTrendChart"),
  { ssr: false, loading: () => <SkeletonChart /> },
);

const DefectsTable = dynamic(
  () => import("@/app/components/table/DefectsTable"),
  { ssr: false, loading: () => <SkeletonTable /> },
);

interface DashboardState {
  metrics: DashboardMetrics | null;
  defectsByModule: DefectByModule[];
  defectsByPriority: DefectByPriority[];
  defectsTrend: DefectTrend[];
  defects: Defect[];
  averageResolutionTime: number;
  totalRecords: number;
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  availableModules: string[];
  sortBy?: "date" | "severity" | "status";
  sortOrder?: "asc" | "desc";
}

export default function Home() {
  const router = useRouter();
  const [filters, setFilters] = useState<DefectFilters>({});
  const [metricQuickFilter, setMetricQuickFilter] = useState<{
    label: string;
    filters: DefectFilters;
  } | null>(null);
  const [state, setState] = useState<DashboardState>({
    metrics: null,
    defectsByModule: [],
    defectsByPriority: [],
    defectsTrend: [],
    defects: [],
    averageResolutionTime: 0,
    totalRecords: 0,
    currentPage: 1,
    totalPages: 1,
    isLoading: true,
    availableModules: [],
    sortBy: "date",
    sortOrder: "desc",
  });
  const [tableLoading, setTableLoading] = useState(false);
  const [isExportPanelOpen, setIsExportPanelOpen] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [moduleSeverityLoaded, setModuleSeverityLoaded] = useState(false);
  const defectsTableRef = React.useRef<HTMLDivElement>(null);

  const tableFilters = useMemo(
    () =>
      metricQuickFilter
        ? { ...filters, ...metricQuickFilter.filters }
        : filters,
    [filters, metricQuickFilter],
  );

  const loadAvailableModules = useCallback(async () => {
    try {
      const moduleData = await getDefectsByModule();

      const modules = moduleData.map((m) => m.module).sort();

      setState((prev) => ({
        ...prev,
        availableModules: modules,
      }));
      setModuleSeverityLoaded(true);
    } catch (error) {
      console.error("Failed to load available modules:", error);
    }
  }, []);

  const loadDashboardData = useCallback(
    async (pageNum = 1) => {
      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        const [
          metricsData,
          trendData,
          defectsResponse,
          avgResolutionTime,
          moduleData,
          priorityData,
        ] = await Promise.all([
          getDefectMetrics(filters),
          getDefectsTrend(filters, "day"),
          getDefects(filters, {
            page: pageNum,
            pageSize: 10,
            sortBy: state.sortBy,
            sortOrder: state.sortOrder,
          }),
          getAverageResolutionTime(filters),
          getDefectsByModule(filters),
          getDefectsByPriority(filters),
        ]);

        setState((prev) => ({
          ...prev,
          metrics: metricsData,
          defectsByModule: moduleData,
          defectsByPriority: priorityData,
          defectsTrend: trendData,
          defects: defectsResponse.defects,
          totalRecords: defectsResponse.total,
          currentPage: defectsResponse.page,
          totalPages: defectsResponse.totalPages,
          averageResolutionTime: avgResolutionTime,
          isLoading: false,
        }));
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [filters, state.sortBy, state.sortOrder],
  );

  useEffect(() => {
    loadAvailableModules();
  }, [loadAvailableModules]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Fetch only the table data (used for pagination and sort changes)
  const fetchTableData = useCallback(
    async (
      pageNum = 1,
      sortBy: "date" | "severity" | "status" = state.sortBy || "date",
      sortOrder: "asc" | "desc" = state.sortOrder || "desc",
      activeFilters: DefectFilters = tableFilters,
    ) => {
      setTableLoading(true);
      try {
        const defectsResponse = await getDefects(activeFilters, {
          page: pageNum,
          pageSize: 10,
          sortBy,
          sortOrder,
        });

        setState((prev) => ({
          ...prev,
          defects: defectsResponse.defects,
          totalRecords: defectsResponse.total,
          currentPage: defectsResponse.page,
          totalPages: defectsResponse.totalPages,
        }));
      } catch (error) {
        console.error("Failed to load table data:", error);
      } finally {
        setTableLoading(false);
      }
    },
    [tableFilters, state.sortBy, state.sortOrder],
  );

  const handlePageChange = (newPage: number) => {
    // Load only the table page to avoid reloading charts and metrics
    fetchTableData(newPage);
  };

  const handleSortChange = (
    sortBy: "date" | "severity" | "status",
    sortOrder: "asc" | "desc",
  ) => {
    setState((prev) => ({ ...prev, sortBy, sortOrder, currentPage: 1 }));
    // Refresh only the table using the requested sort, avoiding stale state reads
    fetchTableData(1, sortBy, sortOrder);
  };

  const handleExportCSV = () => {
    setIsFilterPanelOpen(false);
    setIsExportPanelOpen(true);
  };

  const scrollToDefectsTable = () => {
    setTimeout(() => {
      defectsTableRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  const handleMetricClick = (
    filterType: "all" | "open" | "closed" | "critical",
  ) => {
    if (filterType === "all") {
      // Clear quick metric filter and restore table to the main dashboard filters.
      setMetricQuickFilter(null);
      fetchTableData(
        1,
        state.sortBy || "date",
        state.sortOrder || "desc",
        filters,
      );
      scrollToDefectsTable();
      return;
    }

    let newFilters: DefectFilters = {};
    let filterLabel = "";

    switch (filterType) {
      case "open":
        // Show all open defects: Pending, Re-opened, Hold
        newFilters = { status: ["PENDING", "RE_OPENED", "HOLD"] };
        filterLabel = "Open Defects";
        break;
      case "closed":
        // Show closed defects: Fixed and As it is
        newFilters = { status: ["FIXED", "AS_IT_IS"] };
        filterLabel = "Closed Defects";
        break;
      case "critical":
        // Show only major priority defects (regardless of status)
        newFilters = { priority: ["MAJOR"] };
        filterLabel = "Critical Priority Issues";
        break;
    }

    setMetricQuickFilter({
      label: filterLabel,
      filters: newFilters,
    });
    fetchTableData(1, state.sortBy || "date", state.sortOrder || "desc", {
      ...filters,
      ...newFilters,
    });
    scrollToDefectsTable();
  };

  const handleFiltersChange = (newFilters: DefectFilters) => {
    // Reset quick metric drill-down whenever sidebar filters change.
    setMetricQuickFilter(null);
    setFilters(newFilters);
    setIsFilterPanelOpen(false);
  };

  const activeFilterChips = useMemo(() => {
    const chips: Array<{ id: string; label: string; onRemove: () => void }> =
      [];

    if (metricQuickFilter?.label) {
      chips.push({
        id: "metric",
        label: `Metric: ${metricQuickFilter.label}`,
        onRemove: () => {
          setMetricQuickFilter(null);
          fetchTableData(
            1,
            state.sortBy || "date",
            state.sortOrder || "desc",
            filters,
          );
        },
      });
    }

    if (filters.searchTerm?.trim()) {
      chips.push({
        id: "search",
        label: `Search: ${filters.searchTerm.trim()}`,
        onRemove: () => {
          setFilters((prev) => {
            const next = { ...prev };
            delete next.searchTerm;
            return next;
          });
        },
      });
    }

    if (filters.dateFrom) {
      chips.push({
        id: "dateFrom",
        label: `From: ${new Date(filters.dateFrom).toLocaleDateString()}`,
        onRemove: () => {
          setFilters((prev) => {
            const next = { ...prev };
            delete next.dateFrom;
            return next;
          });
        },
      });
    }

    if (filters.dateTo) {
      chips.push({
        id: "dateTo",
        label: `To: ${new Date(filters.dateTo).toLocaleDateString()}`,
        onRemove: () => {
          setFilters((prev) => {
            const next = { ...prev };
            delete next.dateTo;
            return next;
          });
        },
      });
    }

    if (filters.priority?.length) {
      filters.priority.forEach((priority) => {
        chips.push({
          id: `priority:${priority}`,
          label: `Priority: ${priority}`,
          onRemove: () => {
            setFilters((prev) => {
              const current = prev.priority || [];
              const nextPriority = current.filter((item) => item !== priority);
              const next = { ...prev };
              if (nextPriority.length) {
                next.priority = nextPriority;
              } else {
                delete next.priority;
              }
              return next;
            });
          },
        });
      });
    }

    if (filters.status?.length) {
      filters.status.forEach((status) => {
        chips.push({
          id: `status:${status}`,
          label: `Status: ${status}`,
          onRemove: () => {
            setFilters((prev) => {
              const current = prev.status || [];
              const nextStatus = current.filter((item) => item !== status);
              const next = { ...prev };
              if (nextStatus.length) {
                next.status = nextStatus;
              } else {
                delete next.status;
              }
              return next;
            });
          },
        });
      });
    }

    if (filters.module?.length) {
      filters.module.forEach((moduleName) => {
        chips.push({
          id: `module:${moduleName}`,
          label: `Module: ${moduleName}`,
          onRemove: () => {
            setFilters((prev) => {
              const current = prev.module || [];
              const nextModules = current.filter((item) => item !== moduleName);
              const next = { ...prev };
              if (nextModules.length) {
                next.module = nextModules;
              } else {
                delete next.module;
              }
              return next;
            });
          },
        });
      });
    }

    return chips;
  }, [
    fetchTableData,
    filters,
    metricQuickFilter,
    state.sortBy,
    state.sortOrder,
  ]);

  const hasActiveTableFilters = activeFilterChips.length > 0;

  return (
    <div className="min-h-screen">
      {/* Export Panel Modal */}
      <ExportDefectsPanel
        isOpen={isExportPanelOpen}
        onClose={() => setIsExportPanelOpen(false)}
        currentFilters={filters}
      />

      {/* Filters Dialog */}
      <Transition appear show={isFilterPanelOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-60"
          onClose={setIsFilterPanelOpen}
        >
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm" />
          </TransitionChild>

          <div className="fixed inset-0 overflow-y-auto p-4 sm:p-6">
            <div className="flex min-h-full items-center justify-center">
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 translate-y-4 scale-95"
                enterTo="opacity-100 translate-y-0 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0 scale-100"
                leaveTo="opacity-0 translate-y-4 scale-95"
              >
                <DialogPanel className="w-full max-w-3xl overflow-visible rounded-2xl border border-(--border-color) bg-(--surface) shadow-panel">
                  <div className="flex items-start rounded-2xl justify-between gap-3 border-b border-(--border-color) bg-(--surface-soft) px-3 py-3 sm:px-4">
                    <div>
                      <DialogTitle className="text-base font-semibold text-(--heading-color) sm:text-lg">
                        Refine Dashboard Filters
                      </DialogTitle>
                      <p className="mt-1 text-xs text-(--muted-color) sm:text-sm">
                        Adjust date range, module, status, and priority.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsFilterPanelOpen(false)}
                      className="rounded-lg border border-(--border-color) bg-(--surface) p-2 text-(--muted-color) transition-colors hover:border-(--primary-color) hover:text-(--heading-color)"
                      aria-label="Close filters"
                    >
                      <HiX className="h-4.5 w-4.5" />
                    </button>
                  </div>

                  <div className="p-3 sm:p-4">
                    <FilterPanel
                      onFiltersChange={handleFiltersChange}
                      currentFilters={filters}
                      availableModules={state.availableModules}
                      isLoading={state.isLoading || !moduleSeverityLoaded}
                      showSearch={false}
                      compact
                    />
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Main Content */}
      <div
        className={`relative mx-auto w-full max-w-screen-2xl space-y-6 px-4 py-6 transition-all duration-200 sm:px-6 ${
          isExportPanelOpen ? "blur-sm opacity-50 pointer-events-none" : ""
        }`}
      >
        <section className="space-y-5">
          <div className="rounded-xl border border-(--border-color) bg-(--surface) px-5 py-4 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold leading-tight text-(--heading-color) md:text-3xl">
                  Issue Dashboard
                </h1>
                <p className="mt-1.5 text-sm text-(--muted-color)">
                  Use filters first, then review cards and charts, then open
                  rows for details.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsFilterPanelOpen(true)}
                  className="inline-flex items-center gap-1 rounded-md border border-(--border-color) bg-(--surface) px-3 py-2 text-sm font-medium text-(--heading-color) transition-colors hover:border-(--primary-color) hover:bg-slate-50"
                >
                  <HiFilter className="h-4 w-4" />
                  <span>Open Filters</span>
                </button>
                <button
                  onClick={() => router.push("/all-defects")}
                  className="rounded-md border border-(--border-color) bg-(--surface) px-4 py-2 text-sm font-medium text-(--heading-color) transition-colors hover:border-(--primary-color) hover:bg-slate-50"
                >
                  View All Issues
                </button>
                <button
                  onClick={scrollToDefectsTable}
                  className="rounded-md bg-(--primary-color) px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-(--primary-hover-color)"
                >
                  Jump to Table
                </button>
              </div>
            </div>
          </div>

          {hasActiveTableFilters ? (
            <div className="rounded-xl border border-(--primary-color) bg-slate-50 px-4 py-3 shadow-sm ring-1 ring-blue-100">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-(--muted-color)">
                <HiFilter className="h-3.5 w-3.5" />
                Applied Filters ({activeFilterChips.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {activeFilterChips.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={chip.onRemove}
                    className="inline-flex items-center gap-1 rounded-full border border-(--border-color) bg-white px-2.5 py-1 text-xs font-medium text-(--text-color) transition-colors hover:border-(--primary-color)"
                    title={`Remove ${chip.label}`}
                    aria-label={`Remove ${chip.label}`}
                  >
                    <span>{chip.label}</span>
                    <HiX className="h-3.5 w-3.5 text-(--muted-color)" />
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {state.isLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : state.metrics ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricsCard
                title="Total Issues"
                value={state.metrics.totalDefects}
                icon={<HiChartBar />}
                onClick={() => handleMetricClick("all")}
              />
              <MetricsCard
                title="Open Issues"
                value={state.metrics.openDefects}
                icon={<HiExclamationCircle />}
                onClick={() => handleMetricClick("open")}
              />
              <MetricsCard
                title="Closed Issues"
                value={state.metrics.closedDefects}
                icon={<HiClipboardList />}
                onClick={() => handleMetricClick("closed")}
              />
              <MetricsCard
                title="Critical Priority Issues"
                value={state.metrics.highSeverityCount}
                icon={<HiExclamationCircle />}
                onClick={() => handleMetricClick("critical")}
              />
            </div>
          ) : null}

          {metricQuickFilter ? (
            <div className="flex items-center justify-between rounded-lg border border-(--border-color) bg-slate-50 px-4 py-3">
              <p className="text-sm font-medium text-(--heading-color)">
                Quick filter active: {metricQuickFilter.label}
              </p>
              <button
                onClick={() => {
                  setMetricQuickFilter(null);
                  fetchTableData(
                    1,
                    state.sortBy || "date",
                    state.sortOrder || "desc",
                    filters,
                  );
                }}
                className="rounded-md border border-(--border-color) bg-white px-3 py-1.5 text-xs font-semibold text-(--text-color) transition-colors hover:bg-slate-100"
              >
                Back to Main Dashboard
              </button>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {state.isLoading ? (
              <>
                <SkeletonChart />
                <SkeletonChart />
              </>
            ) : (
              <>
                <DefectsByModuleChart
                  data={state.defectsByModule}
                  onModuleClick={(moduleName) =>
                    router.push(
                      `/all-defects?module=${encodeURIComponent(moduleName)}`,
                    )
                  }
                />
                <DefectsByPriorityChart
                  data={state.defectsByPriority}
                  onPriorityClick={(priorityName) =>
                    router.push(
                      `/all-defects?priority=${encodeURIComponent(priorityName)}`,
                    )
                  }
                />
              </>
            )}
          </div>

          <div className="rounded-xl border border-(--border-color) bg-(--surface) p-3.5 shadow-sm sm:p-4">
            {state.isLoading ? (
              <SkeletonChart />
            ) : (
              <DefectsTrendChart data={state.defectsTrend} />
            )}
          </div>

          {/* Additional Metrics */}
          {state.isLoading ? (
            <SkeletonCard />
          ) : state.averageResolutionTime > 0 ? (
            <div className="rounded-xl border border-(--border-color) bg-(--surface) p-4 shadow-sm transition-colors">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-(--muted-color)">
                Average Resolution Time
              </h3>
              <p className="text-4xl font-bold text-(--heading-color)">
                {state.averageResolutionTime}
              </p>
              <p className="mt-1 text-sm text-(--muted-color)">
                days to resolve issues
              </p>
            </div>
          ) : null}

          {/* Data Table */}
          <div
            ref={defectsTableRef}
            className={`rounded-xl border bg-(--surface) p-3.5 shadow-sm sm:p-4 ${
              hasActiveTableFilters
                ? "border-(--primary-color) ring-1 ring-blue-100"
                : "border-(--border-color)"
            }`}
          >
            <div className="mb-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-(--heading-color)">
                    <HiClipboardList className="h-5 w-5 text-(--primary-color)" />
                    Issues List
                  </h2>
                  <p className="mt-1 text-xs text-(--muted-color)">
                    Showing {state.defects.length} on this page •{" "}
                    {state.totalRecords} total results
                  </p>
                </div>

                <button
                  onClick={handleExportCSV}
                  disabled={state.isLoading}
                  className="flex items-center gap-2 rounded-md bg-(--primary-color) px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-(--primary-hover-color) disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <HiDownload className="h-4 w-4" />
                  <span>Export Data</span>
                </button>
              </div>

              <div className="rounded-xl border border-(--border-color) bg-slate-50 px-3 py-2 text-xs text-(--muted-color)">
                {hasActiveTableFilters
                  ? "Use Applied Filters above to remove filters quickly."
                  : "No active filters. You are viewing the full issues list."}
              </div>
            </div>
            {state.isLoading ? (
              <SkeletonTable />
            ) : (
              <DefectsTable
                defects={state.defects}
                isLoading={tableLoading}
                currentPage={state.currentPage}
                totalPages={state.totalPages}
                onPageChange={handlePageChange}
                sortBy={state.sortBy}
                sortOrder={state.sortOrder}
                onSortChange={handleSortChange}
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
