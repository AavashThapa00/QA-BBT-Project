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
  // Find the module with highest defects for highlighting
  const maxCount = data.length > 0 ? Math.max(...data.map(d => d.count)) : 0;
  
  // Module color mapping
  const moduleColors: Record<string, string> = {
    HSA: "#68cf88",
    KFQ: "#ffc107",
    GMST: "#8144db",
    NMST: "#ff3520",
    "Innovatetech": "#ffffff",
  };
  
  // Get color based on module name
  const getBarColor = (moduleName: string, count: number) => {
    const color = moduleColors[moduleName] || "#14b8a6"; // Default teal if module not found
    // If this is the highest module, keep the color but ensure it's visible
    return color;
  };

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-800 shadow-sm p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <HiChartBar className="w-5 h-5 text-blue-400" />
            {title}
          </h3>
          <p className="text-xs text-slate-400 mt-1">Defects grouped by main platform</p>
        </div>
        {data.length > 0 && (
          <div className="text-right">
            <p className="text-xs text-slate-400">Highest</p>
            <p className="text-lg font-bold" style={{ color: moduleColors[data[0].module] || "#14b8a6" }}>
              {data[0].module}
            </p>
            <p className="text-sm text-slate-400">{data[0].count} issues</p>
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
            data={data}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 5, bottom: 10 }}
          >
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
                backgroundColor: "#1e293b",
                border: "1px solid #475569",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
                padding: "10px",
              }}
              labelStyle={{ color: "#f1f5f9", fontSize: 12, fontWeight: 600 }}
              formatter={(value) => [value, "Issues"]}
              cursor={{ fill: "rgba(20, 184, 255, 0.05)" }}
            />
            <Bar 
              dataKey="count" 
              name="Issues" 
              radius={[0, 8, 8, 0]}
              isAnimationActive={true}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.module, entry.count)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
      
      <div className="mt-6 pt-4 border-t border-slate-700">
        <div className="grid grid-cols-2 gap-4">
          {data.slice(0, 4).map((item) => (
            <div key={item.module} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50">
              <span className="text-sm text-slate-300 font-medium">{item.module}</span>
              <span className="text-sm font-bold" style={{ color: moduleColors[item.module] || "#14b8a6" }}>
                {item.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
