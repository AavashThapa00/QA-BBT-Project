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
    <div className="rounded-2xl border border-(--border-color) bg-(--surface) p-8 shadow-[0_10px_24px_rgba(27,94,32,0.08)] transition-all duration-300 hover:shadow-[0_14px_30px_rgba(27,94,32,0.12)]">
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
            className={`text-lg font-bold ${trendSummary >= 0 ? "text-amber-700" : "text-emerald-700"}`}
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
                <stop offset="0%" stopColor="#66BB6A" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#66BB6A" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5EDE6" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: "#6B7A6D" }}
              axisLine={{ stroke: "#D7E1D8" }}
              interval={Math.max(0, Math.floor(data.length / 10) - 1)}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#6B7A6D" }}
              axisLine={{ stroke: "#D7E1D8" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.97)",
                border: "1px solid #D7E1D8",
                borderRadius: "12px",
                boxShadow: "0 10px 24px -4px rgba(27, 94, 32, 0.15)",
              }}
              labelStyle={{ color: "#1B5E20", fontWeight: 600 }}
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
              stroke="#2E7D32"
              strokeWidth={3.5}
              dot={{ r: 0 }}
              activeDot={{
                r: 5,
                fill: "#2E7D32",
                stroke: "#FFFFFF",
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
