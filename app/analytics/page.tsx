"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import {
  HiArrowLeft,
  HiTrendingUp,
  HiUserGroup,
  HiClock,
  HiX,
} from "react-icons/hi";
import AppButton from "@/app/components/common/AppButton";
import { PageSkeleton } from "@/app/components/common/SkeletonLoader";
import {
  getDefectsByStatus,
  getAverageFixTimeByModule,
} from "@/app/actions/analytics";
import {
  getTeamPerformance,
  getTeamDefectsByStatus,
} from "@/app/actions/teamPerformance";
import {
  getMonthlyTrends,
  getSeverityTrends,
  getModuleTrends,
} from "@/app/actions/trends";

interface StatusData {
  name: string;
  value: number;
  key: "AS_IT_IS" | "HOLD" | "PENDING" | "FIXED" | "RE_OPENED";
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

interface TeamMember {
  assignedTo: string;
  totalDefects: number;
  openDefects: number;
  closedDefects: number;
  avgFixTimeDays: number | null;
  highSeverityCount: number;
}

interface TeamDefect {
  id: string;
  testCaseId: string | null;
  module: string;
  summary: string | null;
  status: string;
  dateReported: string | null;
}

const STATUS_GROUPS = [
  { key: "AS_IT_IS" as const, name: "As it is", color: "#9e9e9e" },
  { key: "HOLD" as const, name: "Hold", color: "#ff9800" },
  { key: "PENDING" as const, name: "Pending", color: "#ffc107" },
  { key: "RE_OPENED" as const, name: "Re-opened", color: "#f97316" },
  { key: "FIXED" as const, name: "Fixed", color: "#4caf50" },
];

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

const normalizeStatusKey = (status: unknown): StatusData["key"] | null => {
  const raw = String(status ?? "").trim();
  if (!raw) return null;

  const normalized = raw
    .toUpperCase()
    .replace(/[-\s]+/g, "_")
    .replace(/__+/g, "_");

  if (normalized === "AS_IT_IS" || normalized === "ASITIS") {
    return "AS_IT_IS";
  }
  if (normalized === "RE_OPENED" || normalized === "REOPENED") {
    return "RE_OPENED";
  }
  if (normalized === "ON_HOLD") return "HOLD";
  if (normalized === "HOLD") return "HOLD";
  if (normalized === "OPEN") return "PENDING";
  if (normalized === "PENDING") return "PENDING";
  if (normalized === "CLOSED") return "FIXED";
  if (normalized === "RESOLVED") return "FIXED";
  if (normalized === "DONE") return "FIXED";
  if (normalized === "FIXED") return "FIXED";

  return null;
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "PENDING":
      return "Pending";
    case "FIXED":
      return "Fixed";
    case "HOLD":
      return "Hold";
    case "RE_OPENED":
      return "Re-opened";
    case "AS_IT_IS":
      return "As it is";
    default:
      return status;
  }
};

const STATUS_BADGE_COLORS: Record<string, string> = {
  Pending: "#dc2626",
  Fixed: "#16a34a",
  Hold: "#ea580c",
  "As it is": "#64748b",
};

const renderPieLabel = ({
  name,
  percent,
}: {
  name?: string | number;
  percent?: number;
}) => {
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
  const [teamData, setTeamData] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<"open" | "fixed" | null>(
    null,
  );
  const [selectedDefects, setSelectedDefects] = useState<TeamDefect[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [statusCounts, fixTimes, monthly, severity, module, team] =
          await Promise.all([
            getDefectsByStatus(),
            getAverageFixTimeByModule(),
            getMonthlyTrends(),
            getSeverityTrends(),
            getModuleTrends(),
            getTeamPerformance(),
          ]);

        const groupedCounts: Record<StatusData["key"], number> = {
          AS_IT_IS: 0,
          HOLD: 0,
          PENDING: 0,
          RE_OPENED: 0,
          FIXED: 0,
        };

        statusCounts.forEach((item) => {
          const normalizedKey = normalizeStatusKey(item.status);
          if (!normalizedKey) return;
          groupedCounts[normalizedKey] += item.count;
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
        setTeamData(team);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const openDrilldown = async (team: string, type: "open" | "fixed") => {
    setSelectedTeam(team);
    setSelectedType(type);
    setIsModalOpen(true);
    setModalLoading(true);

    try {
      const defects = await getTeamDefectsByStatus(team, type);
      setSelectedDefects(defects);
    } catch (error) {
      console.error("Error fetching team defects:", error);
      setSelectedDefects([]);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTeam(null);
    setSelectedType(null);
    setSelectedDefects([]);
  };

  if (loading) {
    return <PageSkeleton variant="dashboard" />;
  }

  const totals = teamData.reduce(
    (acc, member) => {
      acc.total += member.totalDefects;
      acc.open += member.openDefects;
      acc.fixed += member.closedDefects;
      return acc;
    },
    { total: 0, open: 0, fixed: 0 },
  );

  const pieChartData = statusData.filter((item) => item.value > 0);
  const isStatusDataEmpty = pieChartData.length === 0;

  return (
    <div className="min-h-screen">
      <div className="relative mx-auto w-full max-w-screen-2xl space-y-6 px-4 py-6 sm:px-6">
        {/* Header */}
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
              Analytics, Trends & Team Performance
            </h1>
            <p className="mt-1 text-sm text-(--muted-color)">
              Defect distribution, trend movement, and team execution insights
            </p>
          </div>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="flex items-center gap-3 text-xl font-bold text-(--heading-color)">
              <svg
                className="h-5 w-5 text-(--primary-color)"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
              </svg>
              Issue Status Distribution
            </h2>
            <p className="mt-1 text-xs text-(--muted-color)">
              Overview of all issues by current status
            </p>
          </div>
          <div className="h-100">
            {isStatusDataEmpty ? (
              <div className="flex h-full items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50/30 text-sm text-(--muted-color)">
                No status data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    startAngle={90}
                    endAngle={-270}
                    labelLine={{
                      stroke: "#94a3b8",
                      strokeWidth: 1,
                    }}
                    label={renderPieLabel}
                    outerRadius={130}
                    innerRadius={74}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={4}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          STATUS_GROUPS.find((group) => group.key === entry.key)
                            ?.color || "#64748b"
                        }
                        stroke="#e2e8f0"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #d1d5db",
                      borderRadius: "12px",
                      color: "#334155",
                      fontSize: "14px",
                      fontWeight: "500",
                      padding: "10px 12px",
                      boxShadow: "0 8px 24px -8px rgba(0, 0, 0, 0.2)",
                    }}
                    itemStyle={{
                      color: "#334155",
                    }}
                  />
                  <Legend
                    wrapperStyle={{
                      paddingTop: "20px",
                    }}
                    iconType="circle"
                    formatter={(value) => (
                      <span
                        style={{
                          color: "#64748b",
                          fontSize: "13px",
                          fontWeight: "500",
                        }}
                      >
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Average Fix Time by Module */}
        <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm transition-all duration-300 animate-in fade-in-up">
          <div className="mb-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-(--heading-color)">
              <svg
                className="h-5 w-5 text-(--primary-color)"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
              Average Fix Time by Module
            </h2>
            <p className="mt-1 text-xs text-(--muted-color)">
              Time taken from report to resolution
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {moduleFixTime.map((module) => (
              <div
                key={module.module}
                className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-5 transition-all duration-300 hover:bg-emerald-50/60"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3
                    className="text-lg font-semibold"
                    style={{ color: MODULE_COLORS[module.module] || "#fff" }}
                  >
                    {module.module}
                  </h3>
                  <span className="rounded border border-emerald-200 bg-emerald-100 px-2 py-1 text-xs text-emerald-700">
                    {module.totalFixed} fixed
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-(--text-color)">
                      {module.avgDays !== null ? module.avgDays : "N/A"}
                    </span>
                    {module.avgDays !== null && (
                      <span className="text-sm text-(--muted-color)">
                        days avg
                      </span>
                    )}
                  </div>

                  {module.uncertainCount > 0 && (
                    <div className="mt-3 border-t border-amber-200 pt-3">
                      <p className="text-xs text-amber-400 flex items-center gap-1">
                        <span>⚠️</span>
                        <span className="text-amber-700">
                          {module.uncertainCount} defect
                          {module.uncertainCount !== 1 ? "s" : ""} with
                          uncertain fix date
                        </span>
                      </p>
                    </div>
                  )}

                  {module.avgDays === null && module.totalFixed > 0 && (
                    <p className="mt-2 text-xs italic text-(--muted-color)">
                      All fixed defects have uncertain fix dates
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {moduleFixTime.length === 0 && (
            <div className="text-center py-12">
              <p className="text-(--muted-color)">No fixed defects found</p>
            </div>
          )}
        </div>

        {/* Monthly Trends */}
        <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm transition-all duration-300 animate-in fade-in-up">
          <div className="mb-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-(--heading-color)">
              <HiTrendingUp className="h-5 w-5 text-(--primary-color)" />
              Monthly Issue Trends
            </h2>
            <p className="mt-1 text-xs text-(--muted-color)">
              Reported vs fixed issues by month
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
                  <defs>
                    <linearGradient
                      id="analyticsSeverityGlow"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                    >
                      <stop
                        offset="0%"
                        stopColor="#f59e0b"
                        stopOpacity={0.95}
                      />
                      <stop
                        offset="100%"
                        stopColor="#ef4444"
                        stopOpacity={0.95}
                      />
                    </linearGradient>
                  </defs>
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
                      borderRadius: "12px",
                      color: "#334155",
                    }}
                  />
                  <Bar
                    dataKey="count"
                    radius={[0, 8, 8, 0]}
                    barSize={20}
                    background={{ fill: "#ecfeff", radius: 8 }}
                  >
                    {severityTrends.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          index === 0
                            ? "url(#analyticsSeverityGlow)"
                            : SEVERITY_COLORS[entry.severity] || "#64748b"
                        }
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
                  <defs>
                    <linearGradient
                      id="analyticsModuleGlow"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                    >
                      <stop
                        offset="0%"
                        stopColor="#22d3ee"
                        stopOpacity={0.95}
                      />
                      <stop
                        offset="100%"
                        stopColor="#3b82f6"
                        stopOpacity={0.95}
                      />
                    </linearGradient>
                  </defs>
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
                      borderRadius: "12px",
                      color: "#334155",
                    }}
                  />
                  <Bar
                    dataKey="count"
                    radius={[0, 8, 8, 0]}
                    barSize={20}
                    background={{ fill: "#ecfeff", radius: 8 }}
                  >
                    {moduleTrends.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          index === 0
                            ? "url(#analyticsModuleGlow)"
                            : MODULE_COLORS[entry.module] || "#64748b"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {statusData.map((item) => (
            <div
              key={item.key}
              className="rounded-xl border border-emerald-100 bg-white p-4 transition-all duration-300 hover:bg-emerald-50/30"
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-4 w-4 rounded-full"
                  style={{
                    backgroundColor:
                      STATUS_GROUPS.find((group) => group.key === item.key)
                        ?.color || "#64748b",
                  }}
                ></div>
                <div>
                  <p className="text-sm text-(--muted-color)">{item.name}</p>
                  <p className="text-2xl font-bold text-(--text-color)">
                    {item.value}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm transition-all duration-300 animate-in fade-in-up">
          <div className="mb-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-(--heading-color)">
              <HiUserGroup className="h-5 w-5 text-(--primary-color)" />
              Team Performance
            </h2>
            <p className="mt-1 text-xs text-(--muted-color)">
              Who is fixing what and how fast
            </p>
          </div>

          {teamData.length === 0 ? (
            <div className="rounded-lg border border-(--border-color) bg-(--surface) p-12 text-center">
              <HiUserGroup className="mx-auto mb-4 h-12 w-12 text-(--muted-color)" />
              <p className="text-(--muted-color)">No assigned defects found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {teamData.map((member) => (
                <div
                  key={member.assignedTo}
                  className="flex min-h-65 flex-col justify-between rounded-2xl border border-(--border-color) bg-(--surface) p-6 transition-all duration-300 hover:border-emerald-200 hover:shadow-sm animate-in fade-in-up"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-(--heading-color)">
                      {member.assignedTo}
                    </h3>
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                      {member.totalDefects} total
                    </span>
                  </div>

                  <div className="space-y-5">
                    <div className="flex items-center gap-3">
                      <HiClock className="h-5 w-5 text-(--primary-color)" />
                      <div>
                        <p className="text-sm text-(--muted-color)">
                          Avg Fix Time
                        </p>
                        <p className="text-xl font-bold text-(--text-color)">
                          {member.avgFixTimeDays !== null
                            ? `${member.avgFixTimeDays} days`
                            : "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-left transition-colors hover:bg-amber-100"
                        onClick={() => openDrilldown(member.assignedTo, "open")}
                      >
                        <p className="text-xs font-medium text-amber-700">
                          Open
                        </p>
                        <p className="text-2xl font-bold text-amber-700">
                          {member.openDefects}
                        </p>
                      </button>
                      <button
                        type="button"
                        className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-left transition-colors hover:bg-emerald-100"
                        onClick={() =>
                          openDrilldown(member.assignedTo, "fixed")
                        }
                      >
                        <p className="text-xs font-medium text-emerald-700">
                          Fixed
                        </p>
                        <p className="text-2xl font-bold text-emerald-700">
                          {member.closedDefects}
                        </p>
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex min-h-65 flex-col justify-between rounded-2xl border border-(--border-color) bg-(--surface) p-6 transition-all duration-300 hover:border-emerald-200 hover:shadow-sm animate-in fade-in-up">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-(--heading-color)">
                    Team Summary
                  </h3>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                    {totals.total} total
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-left transition-colors hover:bg-amber-100"
                    onClick={() => openDrilldown("ALL", "open")}
                  >
                    <p className="text-xs font-medium text-amber-700">Open</p>
                    <p className="text-2xl font-bold text-amber-700">
                      {totals.open}
                    </p>
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-left transition-colors hover:bg-emerald-100"
                    onClick={() => openDrilldown("ALL", "fixed")}
                  >
                    <p className="text-xs font-medium text-emerald-700">
                      Fixed
                    </p>
                    <p className="text-2xl font-bold text-emerald-700">
                      {totals.fixed}
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <Transition appear show={isModalOpen} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={closeModal}>
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

            <div className="fixed inset-0 overflow-hidden p-4">
              <div className="flex h-full items-center justify-center">
                <TransitionChild
                  as={Fragment}
                  enter="ease-out duration-200"
                  enterFrom="opacity-0 translate-y-4 scale-95"
                  enterTo="opacity-100 translate-y-0 scale-100"
                  leave="ease-in duration-150"
                  leaveFrom="opacity-100 translate-y-0 scale-100"
                  leaveTo="opacity-0 translate-y-4 scale-95"
                >
                  <DialogPanel className="flex h-full max-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-(--border-color) bg-(--surface) shadow-xl">
                    <div className="flex items-center justify-between border-b border-(--border-color) bg-(--surface-soft) px-6 py-4">
                      <div>
                        <DialogTitle className="text-lg font-bold text-(--heading-color)">
                          {selectedTeam === "ALL" ? "All Teams" : selectedTeam}{" "}
                          - {selectedType === "open" ? "Open" : "Fixed"} Defects
                        </DialogTitle>
                        <p className="mt-1 text-xs text-(--muted-color)">
                          Click outside or close to exit
                        </p>
                      </div>
                      <AppButton
                        type="button"
                        onClick={closeModal}
                        variant="secondary"
                        size="icon"
                        aria-label="Close modal"
                      >
                        <HiX className="h-5 w-5" />
                      </AppButton>
                    </div>

                    <div className="overflow-y-auto p-6">
                      {modalLoading ? (
                        <div className="flex h-48 items-center justify-center">
                          <div className="flex flex-col items-center gap-4">
                            <div className="h-12 w-12 animate-spin rounded-full border-2 border-emerald-200 border-t-(--primary-color)"></div>
                            <p className="text-sm font-medium text-(--muted-color)">
                              Loading defects...
                            </p>
                          </div>
                        </div>
                      ) : selectedDefects.length === 0 ? (
                        <div className="rounded-xl border border-(--border-color) bg-(--surface-soft) p-8 py-12 text-center text-(--muted-color)">
                          No defects found for this selection
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                            <thead>
                              <tr className="sticky top-0 z-10 border-b border-emerald-100 bg-emerald-50/60">
                                <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-(--heading-color)">
                                  Test Case ID
                                </th>
                                <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-(--heading-color)">
                                  Module
                                </th>
                                <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-(--heading-color)">
                                  Status
                                </th>
                                <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-(--heading-color)">
                                  Date Reported
                                </th>
                                <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-(--heading-color)">
                                  Summary
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedDefects.map((defect) => {
                                const statusLabel = getStatusLabel(
                                  defect.status,
                                );

                                return (
                                  <tr
                                    key={defect.id}
                                    className="group border-b border-emerald-50 transition-all duration-200 hover:bg-emerald-50/40"
                                  >
                                    <td className="px-4 py-3 font-mono text-xs text-(--text-color)">
                                      {defect.testCaseId ||
                                        defect.id.substring(0, 8)}
                                    </td>
                                    <td className="px-4 py-3 text-(--text-color)">
                                      <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                                        {defect.module}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3">
                                      <span
                                        className="whitespace-nowrap rounded px-2 py-1 text-xs font-semibold"
                                        style={{
                                          backgroundColor: `${STATUS_BADGE_COLORS[statusLabel] || "#6b7280"}20`,
                                          color:
                                            STATUS_BADGE_COLORS[statusLabel] ||
                                            "#6b7280",
                                        }}
                                      >
                                        {statusLabel}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-(--muted-color)">
                                      {defect.dateReported || "N/A"}
                                    </td>
                                    <td className="max-w-xs truncate px-4 py-3 text-(--text-color)">
                                      {defect.summary || "N/A"}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </DialogPanel>
                </TransitionChild>
              </div>
            </div>
          </Dialog>
        </Transition>
      </div>
    </div>
  );
}
