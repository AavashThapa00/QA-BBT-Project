"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
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
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 hover:shadow-md transition-shadow">
      <h3 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
        <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm">📊</span>
        {title}
      </h3>
      <p className="text-xs text-slate-500 mb-6">Distribution of defects across modules</p>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-slate-400">
          <div className="text-center">
            <span className="text-3xl mb-2 block">📭</span>
            No data available
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              type="number"
              tick={{ fontSize: 12, fill: "#64748b" }}
              axisLine={{ stroke: "#cbd5e1" }}
            />
            <YAxis
              type="category"
              dataKey="module"
              tick={{ fontSize: 11, fill: "#64748b" }}
              axisLine={{ stroke: "#cbd5e1" }}
              width={115}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "none",
                borderRadius: "8px",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              }}
              labelStyle={{ color: "#f1f5f9" }}
              formatter={(value) => [value, "Defects"]}
            />
            <Legend wrapperStyle={{ paddingTop: "20px" }} />
            <Bar dataKey="count" fill="#2563eb" name="Defects" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
