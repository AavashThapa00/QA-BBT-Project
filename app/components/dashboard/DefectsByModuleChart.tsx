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
    HSA: "#68cf88",
    KFQ: "#ffc107",
    GMST: "#8144db",
    NMST: "#ff3520",
    "Innovatetech": "#ffffff",
  };
  
  // Get color based on module name
  const getBarColor = (moduleName: string) => {
    return moduleColors[moduleName] || "#14b8a6";
  };

  return (
    <div className="backdrop-blur-xl bg-slate-900/50 rounded-2xl border border-slate-800/50 shadow-2xl p-8 hover:shadow-cyan-500/10 transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <HiChartBar className="w-5 h-5 text-cyan-400" />
            {title}
          </h3>
          <p className="text-xs text-slate-400 mt-1">Defects grouped by main platform</p>
        </div>
        {topModule && (
          <div className="text-right">
            <p className="text-xs text-slate-400">Highest</p>
            <p className="text-lg font-bold" style={{ color: moduleColors[topModule.module] || "#14b8a6" }}>
              {topModule.module}
            </p>
            <p className="text-sm text-slate-400">{topModule.count} issues</p>
          </div>
        )}
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
          <BarChart
            data={sortedData}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 5, bottom: 10 }}
          >
            <defs>
              <linearGradient id="moduleBarGlow" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.9} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis 
              type="number"
              tick={{ fontSize: 12, fill: "#cbd5e1" }}
              axisLine={{ stroke: "#475569" }}
            />
            <YAxis
              type="category"
              dataKey="module"
              tick={{ fontSize: 13, fill: "#e2e8f0", fontWeight: 600 }}
              axisLine={{ stroke: "#475569" }}
              width={90}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: "rgba(15, 23, 42, 0.95)",
                border: "1px solid rgba(71, 85, 105, 0.8)",
                borderRadius: "12px",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.45)",
                padding: "10px 12px",
              }}
              labelStyle={{ color: "#f1f5f9", fontSize: 12, fontWeight: 600 }}
              formatter={(value) => [value, "Issues"]}
              cursor={{ fill: "rgba(56, 189, 248, 0.08)" }}
            />
            <Bar 
              dataKey="count" 
              name="Issues" 
              radius={[0, 8, 8, 0]}
              barSize={20}
              background={{ fill: "rgba(51, 65, 85, 0.35)", radius: 8 }}
              isAnimationActive={true}
            >
              {sortedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={index === 0 ? "url(#moduleBarGlow)" : getBarColor(entry.module)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
      
      <div className="mt-6 pt-4 border-t border-slate-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {sortedData.slice(0, 4).map((item, index) => (
            <div key={item.module} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/40 hover:border-cyan-500/30 transition-colors">
              <span className="text-sm text-slate-300 font-medium">{item.module}</span>
              <span className="text-sm font-bold" style={{ color: index === 0 ? "#22d3ee" : moduleColors[item.module] || "#14b8a6" }}>
                {item.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
