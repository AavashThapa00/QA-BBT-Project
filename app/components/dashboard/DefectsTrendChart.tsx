"use client";

import React from "react";
import { HiTrendingUp, HiInbox } from "react-icons/hi";
import {
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DefectsTrendData {
  date: string;
  count: number;
}

interface DefectsTrendChartProps {
  data: DefectsTrendData[];
  title?: string;
}

export default function DefectsTrendChart({
  data,
  title = "Defects Trend Over Time",
}: DefectsTrendChartProps) {
  const trendSummary =
    data.length >= 2
      ? data[data.length - 1].count - data[data.length - 2].count
      : 0;

  return (
    <div className="rounded-2xl border border-(--border-color) bg-(--surface) p-8 shadow-card transition-all duration-300 hover:shadow-glow">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-(--heading-color) mb-2 flex items-center gap-2">
            <HiTrendingUp className="w-5 h-5 text-(--primary-color)" />
            {title}
          </h3>
          <p className="text-xs text-(--muted-color)">
            Historical trends of defect reports
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-(--muted-color)">Latest Delta</p>
          <p
            className="text-lg font-bold"
            style={{
              color:
                trendSummary >= 0
                  ? "var(--warning-color)"
                  : "var(--success-color)",
            }}
          >
            {trendSummary >= 0 ? "+" : ""}
            {trendSummary}
          </p>
        </div>
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
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <defs>
              <linearGradient id="trendAreaFill" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--chart-positive-color)"
                  stopOpacity={0.28}
                />
                <stop
                  offset="100%"
                  stopColor="var(--chart-positive-color)"
                  stopOpacity={0.03}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: "var(--muted-color)" }}
              axisLine={{ stroke: "var(--border-color)" }}
              interval={Math.max(0, Math.floor(data.length / 10) - 1)}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "var(--muted-color)" }}
              axisLine={{ stroke: "var(--border-color)" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--surface-elevated)",
                border: "1px solid var(--border-color)",
                borderRadius: "12px",
                boxShadow: "var(--shadow-card)",
              }}
              labelStyle={{ color: "var(--heading-color)", fontWeight: 600 }}
            />
            <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="circle" />
            <Area
              type="monotone"
              dataKey="count"
              stroke="none"
              fill="url(#trendAreaFill)"
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="var(--chart-positive-color)"
              strokeWidth={3.5}
              dot={{ r: 0 }}
              activeDot={{
                r: 5,
                fill: "var(--chart-positive-color)",
                stroke: "var(--surface)",
                strokeWidth: 2,
              }}
              name="Defects"
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
