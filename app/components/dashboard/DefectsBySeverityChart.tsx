"use client";

import React from "react";
import { HiChartBar, HiInbox } from "react-icons/hi";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";
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
  title = "Defects by Priority",
}: DefectsBySeverityChartProps) {
  // Sort data by severity order (CRITICAL -> HIGH -> MEDIUM -> LOW)
  const sortedData = [...data].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
  );

  const chartData = sortedData.map((item) => ({
    name: item.severity,
    value: item.count,
    severity: item.severity,
  }));

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-800 shadow-sm p-8">
      <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
        <HiChartBar className="w-5 h-5 text-blue-400" />
        {title}
      </h3>
      <p className="text-xs text-slate-400 mb-6">Number of defects by priority level</p>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-slate-400">
          <div className="text-center">
            <HiInbox className="text-3xl mb-2 block mx-auto" />
            <div>No data available</div>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={480}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 20, right: 40, left: 5, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis 
              type="number"
              tick={{ fontSize: 13, fill: "#cbd5e1", fontWeight: 500 }}
              axisLine={{ stroke: "#475569" }}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 15, fill: "#e2e8f0", fontWeight: 700 }}
              axisLine={{ stroke: "#475569" }}
              width={100}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #475569",
                borderRadius: "10px",
                boxShadow: "0 8px 16px rgba(0, 0, 0, 0.3)",
                padding: "12px",
              }}
              labelStyle={{ color: "#f1f5f9", fontSize: 14, fontWeight: 600 }}
              formatter={(value) => [value, "Defects"]}
              cursor={{ fill: "rgba(200, 41, 54, 0.05)" }}
            />
            <Bar dataKey="value" name="Defects" radius={[0, 10, 10, 0]} fill="#3b82f6">
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.severity] || "#999999"} />
              ))}
              <LabelList 
                dataKey="value" 
                position="right" 
                fill="#e2e8f0"
                fontSize={14}
                fontWeight="700"
                offset={10}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
