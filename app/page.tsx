"use client";

import React, { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import CSVUpload from "@/app/components/uploads/CSVUpload";
import ExportDefectsPanel from "@/app/components/exports/ExportDefectsPanel";
import { HiDownload, HiFolder, HiClipboardList, HiChartBar, HiExclamationCircle, HiViewList } from "react-icons/hi";
import MetricsCard from "@/app/components/dashboard/MetricsCard";
import DefectsByModuleChart from "@/app/components/dashboard/DefectsByModuleChart";
import DefectsBySeverityChart from "@/app/components/dashboard/DefectsBySeverityChart";
import DefectsTrendChart from "@/app/components/dashboard/DefectsTrendChart";
import DefectsTable from "@/app/components/table/DefectsTable";
import FilterPanel from "@/app/components/filters/FilterPanel";
import { SkeletonCard, SkeletonChart, SkeletonTable } from "@/app/components/common/SkeletonLoader";
import { UploadResult } from "@/app/actions/csv";
import {
  getDefectMetrics,
  getDefectsByModule,
  getDefectsBySeverity,
  getDefectsTrend,
  getDefects,
  getAverageResolutionTime,
} from "@/app/actions/defects";
import { DefectFilters, DashboardMetrics, DefectByModule, DefectBySeverity, DefectTrend, Defect } from "@/lib/types";
import { enrichDefectsWithCalculations, exportToCSV } from "@/lib/utils";

// Helper function to extract main module name
function extractMainModule(moduleName: string): string | null {
  if (!moduleName) return null;
  
  // Extract the part before "-" or before a space followed by parenthesis
  // e.g., "HSA- Mock Exam" → "HSA", "KFQ Stage-Host Live" → "KFQ"
  const lowerName = moduleName.toLowerCase();
  
  // Check for known module prefixes
  if (lowerName.includes("hsa")) return "HSA";
  if (lowerName.includes("kfq")) return "KFQ";
  if (lowerName.includes("gmst")) return "GMST";
  if (lowerName.includes("nmst")) return "NMST";
  if (lowerName.includes("mst")) return "GMST";
  if (lowerName.includes("alston") || lowerName.includes("innovatetech")) return "Innovatetech";
  
  // If no known prefix, use the first word
  const match = moduleName.match(/^([A-Z0-9]+)/);
  return match ? match[1] : null;
}

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

  const loadDashboardData = useCallback(
    async (pageNum = 1) => {
      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        const [
          metricsData,
          moduleData,
          severityData,
          trendData,
          defectsResponse,
          avgResolutionTime,
        ] = await Promise.all([
          getDefectMetrics(filters),
          getDefectsByModule(), // No filters - always show all data
          getDefectsBySeverity(), // No filters - always show all data
          getDefectsTrend(filters, "day"),
          getDefects(filters, {
            page: pageNum,
            pageSize: 10,
            sortBy: state.sortBy,
            sortOrder: state.sortOrder,
          }),
          getAverageResolutionTime(filters),
        ]);

        // Extract unique main modules for filter (HSA, GMST, KFQ, NMST only)
        const modules = Array.from(
          new Set(
            defectsResponse.defects
              .map((d) => extractMainModule(d.module))
              .filter((module): module is string => module !== null)
          )
        ).sort();

        setState((prev) => ({
          ...prev,
          metrics: metricsData,
          defectsByModule: moduleData,
          defectsBySeverity: severityData,
          defectsTrend: trendData,
          defects: defectsResponse.defects,
          currentPage: defectsResponse.page,
          totalPages: defectsResponse.totalPages,
          averageResolutionTime: avgResolutionTime,
          availableModules: modules,
          isLoading: false,
        }));
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [filters, state.sortBy, state.sortOrder]
  );

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Fetch only the table data (used for pagination and sort changes)
  const fetchTableData = useCallback(
    async (pageNum = 1) => {
      setTableLoading(true);
      try {
        const defectsResponse = await getDefects(filters, {
          page: pageNum,
          pageSize: 10,
          sortBy: state.sortBy,
          sortOrder: state.sortOrder,
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
    [filters, state.sortBy, state.sortOrder]
  );

  const handleUploadSuccess = (result: UploadResult) => {
    if (result.success && result.inserted > 0) {
      setState((prev) => ({ ...prev, currentPage: 1 }));
      loadDashboardData(1);
    }
  };

  const handlePageChange = (newPage: number) => {
    // Load only the table page to avoid reloading charts and metrics
    fetchTableData(newPage);
  };

  const handleSortChange = (
    sortBy: "date" | "severity" | "status",
    sortOrder: "asc" | "desc"
  ) => {
    setState((prev) => ({ ...prev, sortBy, sortOrder, currentPage: 1 }));
    // Refresh only the table when sort changes
    fetchTableData(1);
  };

  const handleExportCSV = () => {
    setIsExportPanelOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Export Panel Modal */}
      <ExportDefectsPanel
        isOpen={isExportPanelOpen}
        onClose={() => setIsExportPanelOpen(false)}
        currentFilters={filters}
      />

      {/* Main Content */}
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 transition-all duration-200 ${
        isExportPanelOpen ? "blur-sm opacity-50 pointer-events-none" : ""
      }`}>
        {/* CSV Upload */}
        <div className="bg-slate-900 rounded-lg border border-slate-800 shadow-sm">
          <div className="p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <HiFolder className="w-5 h-5 text-blue-400" />
              Upload Defects Data
            </h2>
            <CSVUpload onUploadSuccess={handleUploadSuccess} />
          </div>
        </div>

        {/* Filters */}
        <FilterPanel
          onFiltersChange={setFilters}
          availableModules={state.availableModules}
          isLoading={state.isLoading}
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
            <MetricsCard title="Total Defects" value={state.metrics.totalDefects} icon={<HiChartBar />} />
            <MetricsCard title="Open Defects" value={state.metrics.openDefects} icon={<HiExclamationCircle />} />
            <MetricsCard title="Closed Defects" value={state.metrics.closedDefects} icon={<HiClipboardList />} />
            <MetricsCard title="Critical Priority Issues" value={state.metrics.highSeverityCount} icon={<HiExclamationCircle />} />
          </div>
        ) : null}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
        <div>
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
          <div className="bg-slate-900 rounded-lg border border-slate-800 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Average Resolution Time
            </h3>
            <p className="text-5xl font-bold text-white">
              {state.averageResolutionTime}
            </p>
            <p className="text-slate-400 text-sm mt-2">days to resolve defects</p>
          </div>
        ) : null}

        {/* Data Table */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <HiClipboardList className="w-5 h-5 text-blue-400" />
              Defects List
            </h2>
            <button
              onClick={handleExportCSV}
              disabled={state.isLoading}
              className="px-4 py-2 bg-green-600 text-white font-medium text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all flex items-center gap-2"
            >
              <HiDownload className="w-4 h-4" />
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