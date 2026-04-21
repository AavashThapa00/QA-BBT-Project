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

interface DefectsByPriorityData {
  priority: string;
  count: number;
}

interface DefectsByPriorityChartProps {
  data: DefectsByPriorityData[];
  title?: string;
  onPriorityClick?: (priorityName: string) => void;
}

const PRIORITY_ORDER: Record<string, number> = {
  P0: 1,
  P1: 2,
  P2: 3,
  P3: 4,
  P4: 5,
  CRITICAL: 6,
  HIGH: 7,
  MEDIUM: 8,
  LOW: 9,
  UNKNOWN: 10,
};

const PRIORITY_COLORS: Record<string, string> = {
  P0: "var(--danger-color)",
  P1: "var(--danger-color)",
  P2: "var(--warning-color)",
  P3: "var(--chart-attention-color)",
  P4: "var(--success-color)",
  CRITICAL: "var(--danger-color)",
  HIGH: "var(--warning-color)",
  MEDIUM: "var(--chart-attention-color)",
  LOW: "var(--success-color)",
  UNKNOWN: "var(--muted-color)",
};

const normalizePriorityLabel = (priority: string) =>
  priority.trim().toUpperCase() || "UNKNOWN";

export default function DefectsByPriorityChart({
  data,
  title = "Defects by Priority",
  onPriorityClick,
}: DefectsByPriorityChartProps) {
  const sortedData = [...data]
    .map((item) => ({
      priority: normalizePriorityLabel(item.priority),
      count: item.count,
    }))
    .sort((a, b) => {
      const rankA = PRIORITY_ORDER[a.priority] ?? Number.MAX_SAFE_INTEGER;
      const rankB = PRIORITY_ORDER[b.priority] ?? Number.MAX_SAFE_INTEGER;

      if (rankA !== rankB) return rankA - rankB;
      if (b.count !== a.count) return b.count - a.count;
      return a.priority.localeCompare(b.priority);
    });

  const highestPriority =
    sortedData.length > 0
      ? [...sortedData].sort((a, b) => b.count - a.count)[0]
      : null;

  const getBarColor = (priority: string) =>
    PRIORITY_COLORS[priority] || "var(--success-color)";

  return (
    <div className="rounded-2xl border border-(--border-color) bg-(--surface) p-5 shadow-card transition-all duration-300 hover:shadow-glow">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-(--heading-color) flex items-center gap-2">
            <HiChartBar className="w-5 h-5 text-(--primary-color)" />
            {title}
          </h3>
          <p className="text-xs text-(--muted-color) mt-1">
            Defects grouped by priority level
          </p>
        </div>
        {highestPriority && (
          <div className="text-right">
            <p className="text-xs text-(--muted-color)">Highest</p>
            <p
              className="text-lg font-bold"
              style={{ color: getBarColor(highestPriority.priority) }}
            >
              {highestPriority.priority}
            </p>
            <p className="text-sm text-(--muted-color)">
              {highestPriority.count} issues
            </p>
          </div>
        )}
      </div>

      {sortedData.length === 0 ? (
        <div className="flex h-52 items-center justify-center text-(--muted-color)">
          <div className="text-center">
            <HiInbox className="text-3xl mb-2 block mx-auto" />
            <div>No data available</div>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            data={sortedData}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 5, bottom: 10 }}
          >
            <defs>
              <linearGradient id="priorityBarGlow" x1="0" y1="0" x2="1" y2="0">
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
              dataKey="priority"
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
              cursor={onPriorityClick ? "pointer" : "default"}
            >
              {sortedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  onClick={() => onPriorityClick?.(entry.priority)}
                  fill={
                    index === 0
                      ? "url(#priorityBarGlow)"
                      : getBarColor(entry.priority)
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
