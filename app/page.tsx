"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import ExportDefectsPanel from "@/app/components/exports/ExportDefectsPanel";
import {
  HiDownload,
  HiClipboardList,
  HiChartBar,
  HiExclamationCircle,
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
  const [state, setState] = useState<DashboardState>({
    metrics: null,
    defectsByModule: [],
    defectsBySeverity: [],
    defectsTrend: [],
    defects: [],
    averageResolutionTime: 0,
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
    ) => {
      setTableLoading(true);
      try {
        const defectsResponse = await getDefects(filters, {
          page: pageNum,
          pageSize: 10,
          sortBy,
          sortOrder,
        });

        setState((prev) => ({
          ...prev,
          defects: defectsResponse.defects,
          currentPage: defectsResponse.page,
          totalPages: defectsResponse.totalPages,
        }));
      } catch (error) {
        console.error("Failed to load table data:", error);
      } finally {
        setTableLoading(false);
      }
    },
    [filters, state.sortBy, state.sortOrder],
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
      // Navigate to all-defects page
      router.push("/all-defects");
      return;
    }

    let newFilters: DefectFilters = {};

    switch (filterType) {
      case "open":
        // Show all open defects: Open, In Progress, On Hold (Pending)
        newFilters = { status: ["OPEN", "IN_PROGRESS", "ON_HOLD"] };
        break;
      case "closed":
        // Show closed defects: Fixed (Closed) and As it is
        newFilters = { status: ["CLOSED", "AS_IT_IS"] };
        break;
      case "critical":
        // Show only major severity defects (regardless of status)
        newFilters = { severity: ["MAJOR"] };
        break;
    }

    setFilters(newFilters);
    scrollToDefectsTable();
  };

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
        className={`relative w-full space-y-8 px-4 py-8 transition-all duration-200 sm:px-6 lg:px-10 xl:px-12 ${
          isExportPanelOpen ? "blur-sm opacity-50 pointer-events-none" : ""
        }`}
      >
        <div className="animate-in fade-in-up rounded-3xl border border-(--border-color) bg-[rgba(255,255,255,0.9)] px-6 py-6 shadow-[0_16px_40px_rgba(27,94,32,0.07)] duration-500">
          <h1 className="pb-1 text-4xl font-bold leading-[1.15] text-(--heading-color) md:text-5xl">
            Defect Intelligence Dashboard
          </h1>
          <p className="mt-2 text-sm text-(--muted-color) md:text-base">
            Live visibility across modules, priorities, and trend movement.
          </p>
        </div>

        {/* Filters */}
        <FilterPanel
          onFiltersChange={setFilters}
          availableModules={state.availableModules}
          isLoading={state.isLoading || !moduleSeverityLoaded}
        />

        {/* Metrics Grid */}
        {state.isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : state.metrics ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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

        {/* Trend Chart */}
        <div className="rounded-3xl border border-(--border-color) bg-[rgba(255,255,255,0.88)] p-4 shadow-[0_10px_28px_rgba(27,94,32,0.06)] sm:p-5">
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
          <div className="rounded-2xl border border-(--border-color) bg-(--surface) p-6 shadow-[0_12px_32px_rgba(27,94,32,0.08)] transition-all duration-300 hover:shadow-[0_16px_36px_rgba(27,94,32,0.12)]">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-(--muted-color)">
              Average Resolution Time
            </h3>
            <p className="text-5xl font-bold text-(--heading-color)">
              {state.averageResolutionTime}
            </p>
            <p className="mt-2 text-sm text-(--muted-color)">
              days to resolve defects
            </p>
          </div>
        ) : null}

        {/* Data Table */}
        <div
          ref={defectsTableRef}
          className="rounded-3xl border border-(--border-color) bg-(--surface) p-4 shadow-[0_12px_30px_rgba(27,94,32,0.07)] sm:p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-(--heading-color)">
              <HiClipboardList className="h-5 w-5 text-(--primary-color)" />
              Defects List
            </h2>
            <button
              onClick={handleExportCSV}
              disabled={state.isLoading}
              className="flex items-center gap-2 rounded-lg bg-(--primary-color) px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-(--primary-hover-color) hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            >
              <HiDownload className="h-4 w-4" />
              <span>Export All</span>
            </button>
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
      </div>
    </div>
  );
}
