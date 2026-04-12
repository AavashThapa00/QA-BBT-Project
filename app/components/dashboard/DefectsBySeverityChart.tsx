"use client";

import React from "react";
import { HiChartBar, HiInbox } from "react-icons/hi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
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
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );

  const chartData = sortedData.map((item) => ({
    severity: item.severity,
    count: item.count,
  }));

  // Find the severity with highest count
  const highestSeverity =
    chartData.length > 0
      ? [...chartData].sort((a, b) => b.count - a.count)[0]
      : null;

  // Get color based on severity
  const getBarColor = (severity: string) => COLORS[severity] || "#4CAF50";

  return (
    <div className="rounded-2xl border border-(--border-color) bg-(--surface) p-8 shadow-[0_10px_24px_rgba(27,94,32,0.08)] transition-all duration-300 hover:shadow-[0_14px_30px_rgba(27,94,32,0.12)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-(--heading-color) flex items-center gap-2">
            <HiChartBar className="w-5 h-5 text-(--primary-color)" />
            {title}
          </h3>
          <p className="text-xs text-(--muted-color) mt-1">
            Defects grouped by severity level
          </p>
        </div>
        {highestSeverity && (
          <div className="text-right">
            <p className="text-xs text-(--muted-color)">Highest</p>
            <p
              className="text-lg font-bold"
              style={{ color: getBarColor(highestSeverity.severity) }}
            >
              {highestSeverity.severity}
            </p>
            <p className="text-sm text-(--muted-color)">
              {highestSeverity.count} issues
            </p>
          </div>
        )}
      </div>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-(--muted-color)">
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
                <stop offset="0%" stopColor="#FBC02D" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#E53935" stopOpacity={0.95} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#E5EDE6"
              vertical={false}
            />
            <XAxis
              type="number"
              tick={{ fontSize: 12, fill: "#6B7A6D" }}
              axisLine={{ stroke: "#D7E1D8" }}
            />
            <YAxis
              type="category"
              dataKey="severity"
              tick={{ fontSize: 13, fill: "#1B5E20", fontWeight: 600 }}
              axisLine={{ stroke: "#D7E1D8" }}
              width={90}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.97)",
                border: "1px solid #D7E1D8",
                borderRadius: "12px",
                boxShadow: "0 8px 24px rgba(27, 94, 32, 0.12)",
                padding: "10px 12px",
              }}
              labelStyle={{ color: "#1B5E20", fontSize: 12, fontWeight: 600 }}
              formatter={(value) => [value, "Issues"]}
              cursor={{ fill: "rgba(76, 175, 80, 0.12)" }}
            />
            <Bar
              dataKey="count"
              name="Issues"
              radius={[0, 8, 8, 0]}
              barSize={20}
              background={{ fill: "rgba(224, 233, 225, 0.8)", radius: 8 }}
              isAnimationActive={true}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    index === 0
                      ? "url(#severityBarGlow)"
                      : getBarColor(entry.severity)
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}

      <div className="mt-6 pt-4 border-t border-(--border-color)">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {chartData.slice(0, 4).map((item, index) => (
            <div
              key={item.severity}
              className="flex items-center justify-between p-2.5 rounded-lg bg-(--surface-soft) border border-(--border-color) hover:border-(--primary-color) transition-colors"
            >
              <span className="text-sm text-(--text-color) font-medium">
                {item.severity}
              </span>
              <span
                className="text-sm font-bold"
                style={{
                  color: index === 0 ? "#2E7D32" : getBarColor(item.severity),
                }}
              >
                {item.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
