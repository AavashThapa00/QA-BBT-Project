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
    <div className="backdrop-blur-xl bg-slate-900/50 rounded-2xl border border-slate-800/50 shadow-2xl p-8 hover:shadow-cyan-500/10 transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
            <HiTrendingUp className="w-5 h-5 text-cyan-400" />
            {title}
          </h3>
          <p className="text-xs text-slate-400">Historical trends of defect reports</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Latest Delta</p>
          <p className={`text-lg font-bold ${trendSummary >= 0 ? "text-amber-300" : "text-emerald-300"}`}>
            {trendSummary >= 0 ? "+" : ""}{trendSummary}
          </p>
        </div>
      </div>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-slate-400">
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
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: "#cbd5e1" }}
              axisLine={{ stroke: "#475569" }}
              interval={Math.max(0, Math.floor(data.length / 10) - 1)}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: "#cbd5e1" }}
              axisLine={{ stroke: "#475569" }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: "rgba(15, 23, 42, 0.95)",
                border: "1px solid rgba(71, 85, 105, 0.8)",
                borderRadius: "12px",
                boxShadow: "0 10px 24px -4px rgba(0, 0, 0, 0.35)",
              }}
              labelStyle={{ color: "#f1f5f9", fontWeight: 600 }}
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
              stroke="#22d3ee"
              strokeWidth={3.5}
              dot={{ r: 0 }}
              activeDot={{ r: 5, fill: "#22d3ee", stroke: "#0f172a", strokeWidth: 2 }}
              name="Defects"
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
