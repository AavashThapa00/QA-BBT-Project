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
}

export default function DefectsByModuleChart({
  data,
  title = "Defects by Module",
}: DefectsByModuleChartProps) {
  const sortedData = [...data].sort((a, b) => b.count - a.count);
  const topModule = sortedData[0] ?? null;

  // Module color mapping
  const moduleColors: Record<string, string> = {
    HSA: "#2E7D32",
    KFQ: "#F9A825",
    GMST: "#00796B",
    NMST: "#C62828",
    Innovatetech: "#1565C0",
  };

  // Get color based on module name
  const getBarColor = (moduleName: string) => {
    return moduleColors[moduleName] || "#4CAF50";
  };

  return (
    <div className="rounded-2xl border border-(--border-color) bg-(--surface) p-8 shadow-[0_10px_24px_rgba(27,94,32,0.08)] transition-all duration-300 hover:shadow-[0_14px_30px_rgba(27,94,32,0.12)]">
      <div className="flex items-center justify-between mb-6">
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
        <div className="flex items-center justify-center h-64 text-(--muted-color)">
          <div className="text-center">
            <HiInbox className="text-3xl mb-2 block mx-auto" />
            <div>No data available</div>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={sortedData}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 5, bottom: 10 }}
          >
            <defs>
              <linearGradient id="moduleBarGlow" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#66BB6A" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#2E7D32" stopOpacity={0.95} />
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
              dataKey="module"
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
              {sortedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
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

      <div className="mt-6 pt-4 border-t border-(--border-color)">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {sortedData.slice(0, 4).map((item, index) => (
            <div
              key={item.module}
              className="flex items-center justify-between p-2.5 rounded-lg bg-(--surface-soft) border border-(--border-color) hover:border-(--primary-color) transition-colors"
            >
              <span className="text-sm text-(--text-color) font-medium">
                {item.module}
              </span>
              <span
                className="text-sm font-bold"
                style={{
                  color:
                    index === 0
                      ? "#2E7D32"
                      : moduleColors[item.module] || "#4CAF50",
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
