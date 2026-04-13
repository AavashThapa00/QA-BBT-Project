"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import ExportDefectsPanel from "@/app/components/exports/ExportDefectsPanel";
import {
  HiDownload,
  HiClipboardList,
  HiChartBar,
  HiExclamationCircle,
  HiFilter,
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
  getDefectsBySeverity,
  getDefectsTrend,
  getDefects,
  getAverageResolutionTime,
} from "@/app/actions/defects";
import {
  DefectFilters,
  DashboardMetrics,
  DefectByModule,
  DefectBySeverity,
  DefectTrend,
  Defect,
} from "@/lib/types";

const DefectsByModuleChart = dynamic(
  () => import("@/app/components/dashboard/DefectsByModuleChart"),
  { ssr: false, loading: () => <SkeletonChart /> },
);

const DefectsBySeverityChart = dynamic(
  () => import("@/app/components/dashboard/DefectsBySeverityChart"),
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
  defectsBySeverity: DefectBySeverity[];
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
    defectsBySeverity: [],
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
  const [moduleSeverityLoaded, setModuleSeverityLoaded] = useState(false);
  const defectsTableRef = React.useRef<HTMLDivElement>(null);

  const tableFilters = useMemo(
    () =>
      metricQuickFilter
        ? { ...filters, ...metricQuickFilter.filters }
        : filters,
    [filters, metricQuickFilter],
  );

  const loadStaticChartData = useCallback(async () => {
    try {
      const [moduleData, severityData] = await Promise.all([
        getDefectsByModule(),
        getDefectsBySeverity(),
      ]);

      const modules = moduleData.map((m) => m.module).sort();

      setState((prev) => ({
        ...prev,
        defectsByModule: moduleData,
        defectsBySeverity: severityData,
        availableModules: modules,
      }));
      setModuleSeverityLoaded(true);
    } catch (error) {
      console.error("Failed to load static chart data:", error);
    }
  }, []);

  const loadDashboardData = useCallback(
    async (pageNum = 1) => {
      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        const [metricsData, trendData, defectsResponse, avgResolutionTime] =
          await Promise.all([
            getDefectMetrics(filters),
            getDefectsTrend(filters, "day"),
            getDefects(filters, {
              page: pageNum,
              pageSize: 10,
              sortBy: state.sortBy,
              sortOrder: state.sortOrder,
            }),
            getAverageResolutionTime(filters),
          ]);

        setState((prev) => ({
          ...prev,
          metrics: metricsData,
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
    loadStaticChartData();
  }, [loadStaticChartData]);

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
        // Show all open defects: Open, In Progress, On Hold (Pending)
        newFilters = { status: ["OPEN", "IN_PROGRESS", "ON_HOLD"] };
        filterLabel = "Open Defects";
        break;
      case "closed":
        // Show closed defects: Fixed (Closed) and As it is
        newFilters = { status: ["CLOSED", "AS_IT_IS"] };
        filterLabel = "Closed Defects";
        break;
      case "critical":
        // Show only major severity defects (regardless of status)
        newFilters = { severity: ["MAJOR"] };
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
  };

  const activeFilterChips = useMemo(() => {
    const chips: string[] = [];

    if (metricQuickFilter?.label) {
      chips.push(`Metric: ${metricQuickFilter.label}`);
    }

    if (tableFilters.searchTerm?.trim()) {
      chips.push(`Search: ${tableFilters.searchTerm.trim()}`);
    }

    if (tableFilters.dateFrom) {
      chips.push(
        `From: ${new Date(tableFilters.dateFrom).toLocaleDateString()}`,
      );
    }

    if (tableFilters.dateTo) {
      chips.push(`To: ${new Date(tableFilters.dateTo).toLocaleDateString()}`);
    }

    if (tableFilters.severity?.length) {
      chips.push(`Severity: ${tableFilters.severity.join(", ")}`);
    }

    if (tableFilters.status?.length) {
      chips.push(`Status: ${tableFilters.status.join(", ")}`);
    }

    if (tableFilters.module?.length) {
      const moduleLabel =
        tableFilters.module.length > 3
          ? `${tableFilters.module.slice(0, 3).join(", ")} +${
              tableFilters.module.length - 3
            } more`
          : tableFilters.module.join(", ");
      chips.push(`Modules: ${moduleLabel}`);
    }

    return chips;
  }, [tableFilters, metricQuickFilter]);

  const hasActiveTableFilters = activeFilterChips.length > 0;

  return (
    <div className="min-h-screen bg-(--page-background)">
      {/* Export Panel Modal */}
      <ExportDefectsPanel
        isOpen={isExportPanelOpen}
        onClose={() => setIsExportPanelOpen(false)}
        currentFilters={filters}
      />

      {/* Main Content */}
      <div
        className={`relative w-full space-y-6 px-4 py-6 transition-all duration-200 sm:px-6 lg:px-8 xl:px-10 ${
          isExportPanelOpen ? "blur-sm opacity-50 pointer-events-none" : ""
        }`}
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <FilterPanel
              onFiltersChange={handleFiltersChange}
              availableModules={state.availableModules}
              isLoading={state.isLoading || !moduleSeverityLoaded}
            />
          </aside>

          <section className="space-y-5">
            <div className="rounded-xl border border-(--border-color) bg-(--surface) px-5 py-4 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-2xl font-bold leading-tight text-(--heading-color) md:text-3xl">
                    Defect Dashboard
                  </h1>
                  <p className="mt-1.5 text-sm text-(--muted-color)">
                    Use filters first, then review cards and charts, then open
                    rows for details.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push("/all-defects")}
                    className="rounded-md border border-(--border-color) bg-(--surface) px-4 py-2 text-sm font-medium text-(--heading-color) transition-colors hover:border-(--primary-color) hover:bg-slate-50"
                  >
                    View All Defects
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

            {state.isLoading ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : state.metrics ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricsCard
                  title="Total Defects"
                  value={state.metrics.totalDefects}
                  icon={<HiChartBar />}
                  onClick={() => handleMetricClick("all")}
                />
                <MetricsCard
                  title="Open Defects"
                  value={state.metrics.openDefects}
                  icon={<HiExclamationCircle />}
                  onClick={() => handleMetricClick("open")}
                />
                <MetricsCard
                  title="Closed Defects"
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
                  <DefectsByModuleChart data={state.defectsByModule} />
                  <DefectsBySeverityChart data={state.defectsBySeverity} />
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
                  days to resolve defects
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
                      Defects List
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
                    <span>Export All</span>
                  </button>
                </div>

                {hasActiveTableFilters ? (
                  <div className="rounded-lg border border-(--border-color) bg-slate-50 px-3 py-2.5">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-(--muted-color)">
                      <HiFilter className="h-3.5 w-3.5" />
                      Active Filters ({activeFilterChips.length})
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {activeFilterChips.map((chip) => (
                        <span
                          key={chip}
                          className="rounded-full border border-(--border-color) bg-white px-2.5 py-1 text-xs font-medium text-(--text-color)"
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-(--border-color) bg-slate-50 px-3 py-2 text-xs text-(--muted-color)">
                    No active filters. You are viewing the full defects list.
                  </div>
                )}
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
    </div>
  );
}
