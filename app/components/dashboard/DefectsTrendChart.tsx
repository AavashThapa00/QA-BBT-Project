"use client";

import React from "react";
import { HiTrendingUp, HiInbox } from "react-icons/hi";
import {
  LineChart,
  Line,
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
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 hover:shadow-md transition-shadow">
      <h3 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
        <span className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-600 flex items-center justify-center text-sm"><HiTrendingUp className="w-5 h-5"/></span>
        {title}
      </h3>
      <p className="text-xs text-slate-500 mb-6">Historical trends of defect reports</p>
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
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: "#64748b" }}
              axisLine={{ stroke: "#cbd5e1" }}
              interval={Math.max(0, Math.floor(data.length / 10) - 1)}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: "#64748b" }}
              axisLine={{ stroke: "#cbd5e1" }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "none",
                borderRadius: "8px",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              }}
              labelStyle={{ color: "#f1f5f9" }}
            />
            <Legend wrapperStyle={{ paddingTop: "20px" }} />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#06b6d4"
              strokeWidth={3}
              dot={false}
              name="Defects"
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
