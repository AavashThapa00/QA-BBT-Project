"use client";

import React, { useState, useCallback, useEffect } from "react";
import CSVUpload from "@/app/components/uploads/CSVUpload";
import MetricsCard from "@/app/components/dashboard/MetricsCard";
import DefectsByModuleChart from "@/app/components/dashboard/DefectsByModuleChart";
import DefectsBySeverityChart from "@/app/components/dashboard/DefectsBySeverityChart";
import DefectsTrendChart from "@/app/components/dashboard/DefectsTrendChart";
import DefectsTable from "@/app/components/table/DefectsTable";
import FilterPanel from "@/app/components/filters/FilterPanel";
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
          getDefectsByModule(filters),
          getDefectsBySeverity(filters),
          getDefectsTrend(filters, "day"),
          getDefects(filters, {
            page: pageNum,
            pageSize: 10,
            sortBy: state.sortBy,
            sortOrder: state.sortOrder,
          }),
          getAverageResolutionTime(filters),
        ]);

        // Extract unique modules for filter
        const modules = Array.from(
          new Set(defectsResponse.defects.map((d) => d.module))
        );

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

  const handleUploadSuccess = (result: UploadResult) => {
    if (result.success && result.inserted > 0) {
      setState((prev) => ({ ...prev, currentPage: 1 }));
      loadDashboardData(1);
    }
  };

  const handlePageChange = (newPage: number) => {
    loadDashboardData(newPage);
  };

  const handleSortChange = (
    sortBy: "date" | "severity" | "status",
    sortOrder: "asc" | "desc"
  ) => {
    setState((prev) => ({ ...prev, sortBy, sortOrder, currentPage: 1 }));
  };

  const handleExportCSV = () => {
    const enrichedDefects = enrichDefectsWithCalculations(state.defects);
    exportToCSV(enrichedDefects, "defects-export.csv");
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              QA/BBT Defect Analytics
            </h1>
            <p className="text-gray-600 mt-1">Dashboard</p>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={state.defects.length === 0 || state.isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Export CSV
          </button>
        </div>

        {/* CSV Upload */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Upload Defects
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

        {/* Metrics */}
        {state.metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricsCard title="Total Defects" value={state.metrics.totalDefects} icon="📊" />
            <MetricsCard title="Open Defects" value={state.metrics.openDefects} icon="🔴" />
            <MetricsCard title="Closed Defects" value={state.metrics.closedDefects} icon="✓" />
            <MetricsCard title="Critical Severity" value={state.metrics.highSeverityCount} icon="⚠️" />
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <DefectsByModuleChart data={state.defectsByModule} />
          <DefectsBySeverityChart data={state.defectsBySeverity} />
        </div>

        {/* Trend Chart */}
        <div>
          <DefectsTrendChart data={state.defectsTrend} />
        </div>

        {/* Additional Metrics */}
        {state.averageResolutionTime > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Average Resolution Time
            </h3>
            <p className="text-3xl font-bold text-blue-600">
              {state.averageResolutionTime} days
            </p>
          </div>
        )}

        {/* Data Table */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Defects List</h2>
          <DefectsTable
            defects={state.defects}
            isLoading={state.isLoading}
            currentPage={state.currentPage}
            totalPages={state.totalPages}
            onPageChange={handlePageChange}
            sortBy={state.sortBy}
            sortOrder={state.sortOrder}
            onSortChange={handleSortChange}
          />
        </div>
      </div>
    </div>
  );
}