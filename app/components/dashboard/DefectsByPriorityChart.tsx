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
  P0: "#b91c1c",
  P1: "#dc2626",
  P2: "#ea580c",
  P3: "#ca8a04",
  P4: "#65a30d",
  CRITICAL: "#dc2626",
  HIGH: "#ea580c",
  MEDIUM: "#ca8a04",
  LOW: "#16a34a",
  UNKNOWN: "#64748b",
};

const normalizePriorityLabel = (priority: string) =>
  priority.trim().toUpperCase() || "UNKNOWN";

export default function DefectsByPriorityChart({
  data,
  title = "Defects by Priority",
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
    PRIORITY_COLORS[priority] || "#4CAF50";

  return (
    <div className="rounded-2xl border border-(--border-color) bg-(--surface) p-5 shadow-[0_10px_24px_rgba(27,94,32,0.08)] transition-all duration-300 hover:shadow-[0_14px_30px_rgba(27,94,32,0.12)]">
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
              dataKey="priority"
              tick={{ fontSize: 12, fill: "#1B5E20", fontWeight: 600 }}
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
              barSize={16}
              background={{ fill: "rgba(224, 233, 225, 0.8)", radius: 8 }}
              isAnimationActive={true}
            >
              {sortedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
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
