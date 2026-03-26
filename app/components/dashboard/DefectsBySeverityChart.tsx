"use client";

import React from "react";
import { HiChartBar, HiInbox } from "react-icons/hi";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { Severity } from "@/lib/types";
import { SeverityEnum } from "@/lib/types";

interface DefectsBySeverityData {
  severity: Severity;
  count: number;
}

interface DefectsBySeverityChartProps {
  data: DefectsBySeverityData[];
  title?: string;
}

const COLORS: Record<string, string> = {
  [SeverityEnum.MAJOR]: "#dc2626",
  [SeverityEnum.HIGH]: "#ea580c",
  [SeverityEnum.MEDIUM]: "#ca8a04",
  [SeverityEnum.LOW]: "#16a34a",
};

const SEVERITY_ORDER: Record<Severity, number> = {
  MAJOR: 1,
  HIGH: 2,
  MEDIUM: 3,
  LOW: 4,
};

export default function DefectsBySeverityChart({
  data,
  title = "Defects by Severity",
}: DefectsBySeverityChartProps) {
  // Sort data by severity order (MAJOR -> HIGH -> MEDIUM -> LOW)
  const sortedData = [...data].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
  );

  const chartData = sortedData.map((item) => ({
    severity: item.severity,
    count: item.count,
  }));

  // Find the severity with highest count
  const highestSeverity = chartData.length > 0 
    ? [...chartData].sort((a, b) => b.count - a.count)[0]
    : null;

  // Get color based on severity
  const getBarColor = (severity: string) => {
    return COLORS[severity] || "#14b8a6";
  };

  return (
    <div className="backdrop-blur-xl bg-slate-900/50 rounded-2xl border border-slate-800/50 shadow-2xl p-8 hover:shadow-amber-500/10 transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <HiChartBar className="w-5 h-5 text-amber-400" />
            {title}
          </h3>
          <p className="text-xs text-slate-400 mt-1">Defects grouped by severity level</p>
        </div>
        {highestSeverity && (
          <div className="text-right">
            <p className="text-xs text-slate-400">Highest</p>
            <p className="text-lg font-bold" style={{ color: getBarColor(highestSeverity.severity) }}>
              {highestSeverity.severity}
            </p>
            <p className="text-sm text-slate-400">{highestSeverity.count} issues</p>
          </div>
        )}
      </div>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-slate-400">
          <div className="text-center">
            <HiInbox className="text-3xl mb-2 block mx-auto" />
            <div>No data available</div>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 5, bottom: 10 }}
          >
            <defs>
              <linearGradient id="severityBarGlow" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.9} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis 
              type="number"
              tick={{ fontSize: 12, fill: "#cbd5e1" }}
              axisLine={{ stroke: "#475569" }}
            />
            <YAxis
              type="category"
              dataKey="severity"
              tick={{ fontSize: 13, fill: "#e2e8f0", fontWeight: 600 }}
              axisLine={{ stroke: "#475569" }}
              width={90}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: "rgba(15, 23, 42, 0.95)",
                border: "1px solid rgba(71, 85, 105, 0.8)",
                borderRadius: "12px",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.45)",
                padding: "10px 12px",
              }}
              labelStyle={{ color: "#f1f5f9", fontSize: 12, fontWeight: 600 }}
              formatter={(value) => [value, "Issues"]}
              cursor={{ fill: "rgba(245, 158, 11, 0.10)" }}
            />
            <Bar 
              dataKey="count" 
              name="Issues" 
              radius={[0, 8, 8, 0]}
              barSize={20}
              background={{ fill: "rgba(51, 65, 85, 0.35)", radius: 8 }}
              isAnimationActive={true}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={index === 0 ? "url(#severityBarGlow)" : getBarColor(entry.severity)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
      
      <div className="mt-6 pt-4 border-t border-slate-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {chartData.slice(0, 4).map((item, index) => (
            <div key={item.severity} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/40 hover:border-amber-500/30 transition-colors">
              <span className="text-sm text-slate-300 font-medium">{item.severity}</span>
              <span className="text-sm font-bold" style={{ color: index === 0 ? "#f59e0b" : getBarColor(item.severity) }}>
                {item.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
