"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, Sector } from "recharts";
import { HiArrowLeft, HiTrendingUp } from "react-icons/hi";
import { getDefectsByStatus, getAverageFixTimeByModule } from "@/app/actions/analytics";
import { getMonthlyTrends, getSeverityTrends, getModuleTrends } from "@/app/actions/trends";

interface StatusData {
  name: string;
  value: number;
  key: "AS_IT_IS" | "HOLD" | "PENDING" | "FIXED";
}

interface ModuleFixTime {
  module: string;
  avgDays: number | null;
  totalFixed: number;
  uncertainCount: number;
}

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

const STATUS_GROUPS = [
  { key: "AS_IT_IS" as const, name: "As it is", color: "#9e9e9e" },
  { key: "HOLD" as const, name: "Hold", color: "#ff9800" },
  { key: "PENDING" as const, name: "Pending", color: "#ffc107" },
  { key: "FIXED" as const, name: "Fixed", color: "#4caf50" },
];

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

const renderPieLabel = ({ name, percent }: { name?: string | number; percent?: number }) => {
  const label = typeof name === "string" ? name : String(name ?? "");
  const pct = percent ? Math.round(percent * 100) : 0;
  return `${label} ${pct}%`;
};

export default function AnalyticsPage() {
  const [statusData, setStatusData] = useState<StatusData[]>([]);
  const [moduleFixTime, setModuleFixTime] = useState<ModuleFixTime[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [severityTrends, setSeverityTrends] = useState<SeverityTrend[]>([]);
  const [moduleTrends, setModuleTrends] = useState<ModuleTrend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [statusCounts, fixTimes, monthly, severity, module] = await Promise.all([
          getDefectsByStatus(),
          getAverageFixTimeByModule(),
          getMonthlyTrends(),
          getSeverityTrends(),
          getModuleTrends(),
        ]);

        const groupedCounts: Record<StatusData["key"], number> = {
          AS_IT_IS: 0,
          HOLD: 0,
          PENDING: 0,
          FIXED: 0,
        };

        statusCounts.forEach((item) => {
          const status = String(item.status);

          switch (status) {
            case "AS_IT_IS":
              groupedCounts.AS_IT_IS += item.count;
              break;
            case "ON_HOLD":
            case "HOLD":
              groupedCounts.HOLD += item.count;
              break;
            case "OPEN":
            case "IN_PROGRESS":
            case "PENDING":
              groupedCounts.PENDING += item.count;
              break;
            case "CLOSED":
            case "FIXED":
              groupedCounts.FIXED += item.count;
              break;
          }
        });

        const chartData: StatusData[] = STATUS_GROUPS.map((group) => ({
          key: group.key,
          name: group.name,
          value: groupedCounts[group.key],
        }));

        setStatusData(chartData);
        setModuleFixTime(fixTimes);
        setMonthlyTrends(monthly);
        setSeverityTrends(severity);
        setModuleTrends(module);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8 overflow-hidden relative">
        {/* Animated Background */}
        <div className="fixed inset-0 opacity-30 -z-10">
          <div className="absolute top-20 left-0 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-1/2 right-0 w-80 h-80 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-0 left-1/2 w-80 h-80 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob" style={{ animationDelay: '4s' }}></div>
        </div>

        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-700 border-t-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8 overflow-hidden relative">
      <div className="fixed inset-0 opacity-30 -z-10">
        <div className="absolute top-20 left-0 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-1/2 right-0 w-80 h-80 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-0 left-1/2 w-80 h-80 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-12 space-y-8 relative">
        {/* Header */}
          <div className="flex items-center justify-between animate-in fade-in duration-500">
          <div>
            <Link
              href="/"
                className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-all duration-300 transform hover:translate-x-1 mb-4 group"
            >
                <HiArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-medium">Back to Dashboard</span>
            </Link>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Analytics & Trends</h1>
              <p className="text-slate-400 mt-2 text-sm">Performance, trends, and defect distribution insights</p>
          </div>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="backdrop-blur-xl bg-slate-900/50 rounded-2xl border border-slate-800/50 shadow-2xl p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
              </svg>
              Defect Status Distribution
            </h2>
            <p className="text-xs text-slate-400 mt-1">Overview of all defects by current status</p>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  startAngle={90}
                  endAngle={-270}
                  labelLine={{
                    stroke: '#64748b',
                    strokeWidth: 1,
                  }}
                  label={renderPieLabel}
                  outerRadius={130}
                  innerRadius={74}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={4}
                  activeShape={(props) => (
                    <Sector
                      {...props}
                      stroke="#0f172a"
                      strokeWidth={2}
                    />
                  )}
                >
                  {statusData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={STATUS_GROUPS.find((group) => group.key === entry.key)?.color || "#64748b"}
                      stroke="#1e293b"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  cursor={{ fill: "transparent" }}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '12px',
                    color: '#f1f5f9',
                    fontSize: '14px',
                    fontWeight: '500',
                    padding: '10px 12px',
                    boxShadow: '0 10px 24px -4px rgba(0, 0, 0, 0.35)'
                  }}
                  itemStyle={{
                    color: '#f1f5f9',
                  }}
                />
                <Legend 
                  wrapperStyle={{ 
                    paddingTop: '20px',
                  }}
                  iconType="circle"
                  formatter={(value) => (
                    <span style={{ 
                      color: '#e2e8f0', 
                      fontSize: '13px',
                      fontWeight: '500'
                    }}>
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Average Fix Time by Module */}
        <div className="backdrop-blur-xl bg-slate-900/50 rounded-2xl border border-slate-800/50 shadow-2xl p-8 hover:shadow-blue-500/10 transition-all duration-300 animate-in fade-in-up duration-500">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Average Fix Time by Module
            </h2>
            <p className="text-xs text-slate-400 mt-1">Time taken from report to resolution</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {moduleFixTime.map((module) => (
              <div
                key={module.module}
                className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5 hover:border-blue-500/30 hover:bg-slate-800/70 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 
                    className="text-lg font-semibold"
                    style={{ color: MODULE_COLORS[module.module] || '#fff' }}
                  >
                    {module.module}
                  </h3>
                  <span className="text-xs text-slate-300 bg-slate-700/70 border border-slate-600/50 px-2 py-1 rounded">
                    {module.totalFixed} fixed
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white">
                      {module.avgDays !== null ? module.avgDays : "N/A"}
                    </span>
                    {module.avgDays !== null && (
                      <span className="text-sm text-slate-400">days avg</span>
                    )}
                  </div>
                  
                  {module.uncertainCount > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-700">
                      <p className="text-xs text-amber-400 flex items-center gap-1">
                        <span>⚠️</span>
                        <span>{module.uncertainCount} defect{module.uncertainCount !== 1 ? 's' : ''} with uncertain fix date</span>
                      </p>
                    </div>
                  )}
                  
                  {module.avgDays === null && module.totalFixed > 0 && (
                    <p className="text-xs text-slate-500 italic mt-2">
                      All fixed defects have uncertain fix dates
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {moduleFixTime.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-400">No fixed defects found</p>
            </div>
          )}
        </div>

        {/* Monthly Trends */}
        <div className="backdrop-blur-xl bg-slate-900/50 rounded-2xl border border-slate-800/50 shadow-2xl p-8 hover:shadow-blue-500/10 transition-all duration-300 animate-in fade-in-up duration-500">
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
          <div className="backdrop-blur-xl bg-slate-900/50 rounded-2xl border border-slate-800/50 shadow-2xl p-6 hover:shadow-blue-500/10 transition-all duration-300 animate-in fade-in-up duration-500">
            <h2 className="text-lg font-semibold text-white mb-4">Severity Distribution</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={severityTrends} layout="vertical">
                  <defs>
                    <linearGradient id="analyticsSeverityGlow" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0.95} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis type="number" tick={{ fill: "#cbd5e1", fontSize: 12 }} />
                  <YAxis type="category" dataKey="severity" tick={{ fill: "#e2e8f0", fontSize: 13, fontWeight: 600 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #475569",
                      borderRadius: "12px",
                      color: "#f1f5f9",
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={20} background={{ fill: "rgba(51, 65, 85, 0.35)", radius: 8 }}>
                    {severityTrends.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? "url(#analyticsSeverityGlow)" : (SEVERITY_COLORS[entry.severity] || "#64748b")} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Module Distribution */}
          <div className="backdrop-blur-xl bg-slate-900/50 rounded-2xl border border-slate-800/50 shadow-2xl p-6 hover:shadow-blue-500/10 transition-all duration-300 animate-in fade-in-up duration-500">
            <h2 className="text-lg font-semibold text-white mb-4">Module Distribution</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={moduleTrends} layout="vertical">
                  <defs>
                    <linearGradient id="analyticsModuleGlow" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.95} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis type="number" tick={{ fill: "#cbd5e1", fontSize: 12 }} />
                  <YAxis type="category" dataKey="module" tick={{ fill: "#e2e8f0", fontSize: 13, fontWeight: 600 }} width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #475569",
                      borderRadius: "12px",
                      color: "#f1f5f9",
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={20} background={{ fill: "rgba(51, 65, 85, 0.35)", radius: 8 }}>
                    {moduleTrends.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? "url(#analyticsModuleGlow)" : (MODULE_COLORS[entry.module] || "#64748b")} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {statusData.map((item) => (
            <div
              key={item.key}
              className="backdrop-blur-xl bg-slate-900/50 rounded-xl border border-slate-800/50 p-4 hover:border-blue-500/30 transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{
                    backgroundColor: STATUS_GROUPS.find((group) => group.key === item.key)?.color || "#64748b",
                  }}
                ></div>
                <div>
                  <p className="text-sm text-slate-400">{item.name}</p>
                  <p className="text-2xl font-bold text-white">{item.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
