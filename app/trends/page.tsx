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
import { getMonthlyTrends, getSeverityTrends, getModuleTrends } from "@/app/actions/trends";

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
  HSA: "#68cf88",
  KFQ: "#ffc107",
  GMST: "#8144db",
  NMST: "#ff3520",
  Innovatetech: "#ffffff",
  Alston: "#ec4899",
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
      <div className="min-h-screen bg-slate-950 p-8">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-700 border-t-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
            >
              <HiArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Dashboard</span>
            </Link>
            <h1 className="text-3xl font-bold text-white">Trends & Insights</h1>
            <p className="text-slate-400 mt-1">Defect patterns and trends over time</p>
          </div>
        </div>

        {/* Monthly Trends */}
        <div className="bg-slate-900 rounded-lg border border-slate-800 shadow-sm p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <HiTrendingUp className="w-5 h-5 text-blue-400" />
              Monthly Defect Trends
            </h2>
            <p className="text-xs text-slate-400 mt-1">Reported vs Fixed defects by month</p>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrends} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" tick={{ fill: "#cbd5e1", fontSize: 12 }} />
                <YAxis tick={{ fill: "#cbd5e1", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #475569",
                    borderRadius: "8px",
                    color: "#f1f5f9",
                  }}
                />
                <Line type="monotone" dataKey="reported" stroke="#f59e0b" strokeWidth={3} dot={{ fill: "#f59e0b" }} />
                <Line type="monotone" dataKey="fixed" stroke="#10b981" strokeWidth={3} dot={{ fill: "#10b981" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Severity Distribution */}
          <div className="bg-slate-900 rounded-lg border border-slate-800 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Severity Distribution</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={severityTrends} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis type="number" tick={{ fill: "#cbd5e1", fontSize: 12 }} />
                  <YAxis type="category" dataKey="severity" tick={{ fill: "#e2e8f0", fontSize: 13, fontWeight: 600 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #475569",
                      borderRadius: "8px",
                      color: "#f1f5f9",
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {severityTrends.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[entry.severity] || "#64748b"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Module Distribution */}
          <div className="bg-slate-900 rounded-lg border border-slate-800 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Module Distribution</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={moduleTrends} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis type="number" tick={{ fill: "#cbd5e1", fontSize: 12 }} />
                  <YAxis type="category" dataKey="module" tick={{ fill: "#e2e8f0", fontSize: 13, fontWeight: 600 }} width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #475569",
                      borderRadius: "8px",
                      color: "#f1f5f9",
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {moduleTrends.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={MODULE_COLORS[entry.module] || "#64748b"} />
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
