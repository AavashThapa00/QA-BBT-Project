"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { HiArrowLeft } from "react-icons/hi";
import { getDefectsByStatus, getAverageFixTimeByModule } from "@/app/actions/analytics";
import { Status } from "@/lib/types";

interface StatusData {
  name: string;
  value: number;
  status: Status;
}

interface ModuleFixTime {
  module: string;
  avgDays: number | null;
  totalFixed: number;
  uncertainCount: number;
}

const STATUS_LABELS: Record<Status, string> = {
  OPEN: "Pending",
  IN_PROGRESS: "In Progress",
  CLOSED: "Fixed",
  ON_HOLD: "On Hold",
  AS_IT_IS: "As It Is",
};

const STATUS_COLORS: Record<Status, string> = {
  OPEN: "#ffc107",
  IN_PROGRESS: "#2196f3",
  CLOSED: "#4caf50",
  ON_HOLD: "#ff9800",
  AS_IT_IS: "#9e9e9e",
};

const MODULE_COLORS: Record<string, string> = {
  HSA: "#68cf88",
  KFQ: "#ffc107",
  GMST: "#8144db",
  NMST: "#ff3520",
  Innovatetech: "#ffffff",
  MST: "#3b82f6",
  Alston: "#ec4899",
  Other: "#6b7280",
};

export default function AnalyticsPage() {
  const [statusData, setStatusData] = useState<StatusData[]>([]);
  const [moduleFixTime, setModuleFixTime] = useState<ModuleFixTime[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [statusCounts, fixTimes] = await Promise.all([
          getDefectsByStatus(),
          getAverageFixTimeByModule(),
        ]);

        console.log("Status counts:", statusCounts);
        console.log("Fix times:", fixTimes);

        // Transform status data for pie chart
        const chartData: StatusData[] = statusCounts.map(item => ({
          name: STATUS_LABELS[item.status],
          value: item.count,
          status: item.status,
        }));

        setStatusData(chartData);
        setModuleFixTime(fixTimes);
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
            >
              <HiArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Dashboard</span>
            </Link>
            <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
            <p className="text-slate-400 mt-1">Defect status distribution and fix time analysis</p>
          </div>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="bg-slate-900 rounded-lg border border-slate-800 shadow-sm p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
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
                  labelLine={{
                    stroke: '#64748b',
                    strokeWidth: 1,
                  }}
                  label={({ name, value, percent }) => 
                    `${name}: ${value} (${percent ? (percent * 100).toFixed(0) : '0'}%)`
                  }
                  outerRadius={130}
                  innerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={2}
                >
                  {statusData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={STATUS_COLORS[entry.status]}
                      stroke="#0f172a"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    color: '#f1f5f9',
                    fontSize: '14px',
                    fontWeight: '500',
                    padding: '8px 12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
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
        <div className="bg-slate-900 rounded-lg border border-slate-800 shadow-sm p-8">
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
                className="bg-slate-800 rounded-lg border border-slate-700 p-5 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 
                    className="text-lg font-semibold"
                    style={{ color: MODULE_COLORS[module.module] || '#fff' }}
                  >
                    {module.module}
                  </h3>
                  <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded">
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

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {statusData.map((item) => (
            <div
              key={item.status}
              className="bg-slate-900 rounded-lg border border-slate-800 p-4"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: STATUS_COLORS[item.status] }}
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
