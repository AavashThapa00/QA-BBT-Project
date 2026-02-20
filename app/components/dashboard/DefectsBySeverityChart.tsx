"use client";

import React from "react";
import { HiExclamationCircle, HiInbox } from "react-icons/hi";
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
  [SeverityEnum.CRITICAL]: "#dc2626",
  [SeverityEnum.HIGH]: "#ea580c",
  [SeverityEnum.MEDIUM]: "#ca8a04",
  [SeverityEnum.LOW]: "#16a34a",
};

const SEVERITY_ORDER: Record<Severity, number> = {
  CRITICAL: 1,
  HIGH: 2,
  MEDIUM: 3,
  LOW: 4,
};

export default function DefectsBySeverityChart({
  data,
  title = "Defects by Severity",
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
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 hover:shadow-md transition-shadow">
      <h3 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
        <span className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center text-sm"><HiExclamationCircle className="w-5 h-5" /></span>
        {title}
      </h3>
      <p className="text-xs text-slate-500 mb-6">Number of defects by severity level</p>
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
            margin={{ top: 10, right: 80, left: 80, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={true} />
            <XAxis 
              type="number"
              tick={{ fontSize: 12, fill: "#64748b" }}
              axisLine={{ stroke: "#cbd5e1" }}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 13, fill: "#64748b", fontWeight: 500 }}
              axisLine={{ stroke: "#cbd5e1" }}
              width={75}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "none",
                borderRadius: "8px",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              }}
              labelStyle={{ color: "#f1f5f9" }}
              formatter={(value) => [value, "Defects"]}
              cursor={{ fill: "rgba(0, 0, 0, 0.05)" }}
            />
            <Bar dataKey="value" name="Defects" radius={[0, 8, 8, 0]} fill="#3b82f6">
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.severity] || "#999999"} />
              ))}
              <LabelList 
                dataKey="value" 
                position="right" 
                fill="#1e293b"
                fontSize={13}
                fontWeight="600"
                offset={8}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
