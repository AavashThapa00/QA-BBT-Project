"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HiArrowLeft, HiTrendingUp } from "react-icons/hi";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import {
  getMonthlyTrends,
  getSeverityTrends,
  getModuleTrends,
} from "@/app/actions/trends";

interface MonthlyTrend {
  month: string;
  reported: number;
  fixed: number;
}

interface SeverityTrend {
  severity: string;
  count: number;
}

interface ModuleTrend {
  module: string;
  count: number;
}

const SEVERITY_COLORS: Record<string, string> = {
  MAJOR: "#dc2626",
  HIGH: "#ea580c",
  MEDIUM: "#ca8a04",
  LOW: "#16a34a",
};

const MODULE_COLORS: Record<string, string> = {
  HSA: "#2e7d32",
  KFQ: "#f59e0b",
  GMST: "#7c3aed",
  NMST: "#dc2626",
  Innovatetech: "#1b5e20",
  Alston: "#db2777",
  Other: "#6b7280",
};

export default function TrendsPage() {
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [severityTrends, setSeverityTrends] = useState<SeverityTrend[]>([]);
  const [moduleTrends, setModuleTrends] = useState<ModuleTrend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [monthly, severity, module] = await Promise.all([
          getMonthlyTrends(),
          getSeverityTrends(),
          getModuleTrends(),
        ]);

        setMonthlyTrends(monthly);
        setSeverityTrends(severity);
        setModuleTrends(module);
      } catch (error) {
        console.error("Error fetching trends:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-(--page-background) p-8">
        <div className="flex items-center justify-center h-96">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-emerald-200 border-t-(--primary-color)"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--page-background) p-4 sm:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-screen-2xl space-y-6">
        <div className="flex items-center justify-between animate-in fade-in duration-500">
          <div>
            <Link
              href="/"
              className="group mb-3 inline-flex items-center gap-2 text-sm text-(--muted-color) transition-all duration-300 hover:translate-x-1 hover:text-(--primary-color)"
            >
              <HiArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Dashboard</span>
            </Link>
            <h1 className="text-3xl font-bold text-(--heading-color)">
              Trends & Insights
            </h1>
            <p className="mt-1 text-sm text-(--muted-color)">
              Defect patterns and trends over time
            </p>
          </div>
        </div>

        {/* Monthly Trends */}
        <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm transition-all duration-300 animate-in fade-in-up">
          <div className="mb-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-(--heading-color)">
              <HiTrendingUp className="h-5 w-5 text-(--primary-color)" />
              Monthly Defect Trends
            </h2>
            <p className="mt-1 text-xs text-(--muted-color)">
              Reported vs Fixed defects by month
            </p>
          </div>
          <div className="h-87.5">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlyTrends}
                margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    color: "#334155",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="reported"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={{ fill: "#f59e0b" }}
                />
                <Line
                  type="monotone"
                  dataKey="fixed"
                  stroke="#16a34a"
                  strokeWidth={3}
                  dot={{ fill: "#16a34a" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Severity Distribution */}
          <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm transition-all duration-300 animate-in fade-in-up">
            <h2 className="mb-4 text-lg font-semibold text-(--heading-color)">
              Severity Distribution
            </h2>
            <div className="h-75">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={severityTrends} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#d1d5db"
                    vertical={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fill: "#64748b", fontSize: 12 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="severity"
                    tick={{ fill: "#334155", fontSize: 13, fontWeight: 600 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      color: "#334155",
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {severityTrends.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={SEVERITY_COLORS[entry.severity] || "#64748b"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Module Distribution */}
          <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm transition-all duration-300 animate-in fade-in-up">
            <h2 className="mb-4 text-lg font-semibold text-(--heading-color)">
              Module Distribution
            </h2>
            <div className="h-75">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={moduleTrends} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#d1d5db"
                    vertical={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fill: "#64748b", fontSize: 12 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="module"
                    tick={{ fill: "#334155", fontSize: 13, fontWeight: 600 }}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      color: "#334155",
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {moduleTrends.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={MODULE_COLORS[entry.module] || "#64748b"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
