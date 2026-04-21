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

interface DefectsByModuleData {
  module: string;
  count: number;
}

interface DefectsByModuleChartProps {
  data: DefectsByModuleData[];
  title?: string;
  onModuleClick?: (moduleName: string) => void;
}

export default function DefectsByModuleChart({
  data,
  title = "Defects by Module",
  onModuleClick,
}: DefectsByModuleChartProps) {
  const sortedData = [...data].sort((a, b) => b.count - a.count);
  const topModule = sortedData[0] ?? null;

  // Module color mapping
  const moduleColors: Record<string, string> = {
    HSA: "var(--chart-positive-color)",
    KFQ: "var(--warning-color)",
    GMST: "var(--info-color)",
    NMST: "var(--danger-color)",
    Innovatetech: "var(--primary-color)",
  };

  // Get color based on module name
  const getBarColor = (moduleName: string) => {
    return moduleColors[moduleName] || "var(--chart-positive-color)";
  };

  return (
    <div className="rounded-2xl border border-(--border-color) bg-(--surface) p-5 shadow-card transition-all duration-300 hover:shadow-glow">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-(--heading-color) flex items-center gap-2">
            <HiChartBar className="w-5 h-5 text-(--primary-color)" />
            {title}
          </h3>
          <p className="text-xs text-(--muted-color) mt-1">
            Defects grouped by main platform
          </p>
        </div>
        {topModule && (
          <div className="text-right">
            <p className="text-xs text-(--muted-color)">Highest</p>
            <p
              className="text-lg font-bold"
              style={{ color: moduleColors[topModule.module] || "#14b8a6" }}
            >
              {topModule.module}
            </p>
            <p className="text-sm text-(--muted-color)">
              {topModule.count} issues
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
            data={sortedData}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 5, bottom: 10 }}
          >
            <defs>
              <linearGradient id="moduleBarGlow" x1="0" y1="0" x2="1" y2="0">
                <stop
                  offset="0%"
                  stopColor="var(--accent-color)"
                  stopOpacity={0.95}
                />
                <stop
                  offset="100%"
                  stopColor="var(--primary-color)"
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
              dataKey="module"
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
              cursor={onModuleClick ? "pointer" : "default"}
            >
              {sortedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  onClick={() => onModuleClick?.(entry.module)}
                  fill={
                    index === 0
                      ? "url(#moduleBarGlow)"
                      : getBarColor(entry.module)
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
