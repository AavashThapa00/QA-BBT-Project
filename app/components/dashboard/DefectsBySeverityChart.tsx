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
  [SeverityEnum.MAJOR]: "var(--danger-color)",
  [SeverityEnum.HIGH]: "var(--warning-color)",
  [SeverityEnum.MEDIUM]: "var(--chart-attention-color)",
  [SeverityEnum.LOW]: "var(--success-color)",
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
  const getBarColor = (severity: string) =>
    COLORS[severity] || "var(--success-color)";

  return (
    <div className="rounded-2xl border border-(--border-color) bg-(--surface) p-5 shadow-card transition-all duration-300 hover:shadow-glow">
      <div className="mb-4 flex items-center justify-between">
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
        <div className="flex h-52 items-center justify-center text-(--muted-color)">
          <div className="text-center">
            <HiInbox className="text-3xl mb-2 block mx-auto" />
            <div>No data available</div>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 5, bottom: 10 }}
          >
            <defs>
              <linearGradient id="severityBarGlow" x1="0" y1="0" x2="1" y2="0">
                <stop
                  offset="0%"
                  stopColor="var(--warning-color)"
                  stopOpacity={0.95}
                />
                <stop
                  offset="100%"
                  stopColor="var(--danger-color)"
                  stopOpacity={0.95}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border-color)"
              vertical={false}
            />
            <XAxis
              type="number"
              tick={{ fontSize: 12, fill: "var(--muted-color)" }}
              axisLine={{ stroke: "var(--border-color)" }}
            />
            <YAxis
              type="category"
              dataKey="severity"
              tick={{
                fontSize: 12,
                fill: "var(--heading-color)",
                fontWeight: 600,
              }}
              axisLine={{ stroke: "var(--border-color)" }}
              width={90}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--surface-elevated)",
                border: "1px solid var(--border-color)",
                borderRadius: "12px",
                boxShadow: "var(--shadow-card)",
                padding: "10px 12px",
              }}
              labelStyle={{
                color: "var(--heading-color)",
                fontSize: 12,
                fontWeight: 600,
              }}
              formatter={(value) => [value, "Issues"]}
              cursor={{ fill: "rgba(45, 212, 191, 0.12)" }}
            />
            <Bar
              dataKey="count"
              name="Issues"
              radius={[0, 8, 8, 0]}
              barSize={16}
              background={{ fill: "rgba(148, 163, 184, 0.14)", radius: 8 }}
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
    </div>
  );
}
