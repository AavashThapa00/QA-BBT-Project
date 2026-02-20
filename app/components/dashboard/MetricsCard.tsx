"use client";

import React from "react";

interface MetricsCardProps {
  title: string;
  value: number;
  icon?: React.ReactNode;
  className?: string;
}

export default function MetricsCard({
  title,
  value,
  icon,
  className = "",
}: MetricsCardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide">{title}</p>
          <p className="mt-3 text-4xl font-bold text-slate-900">{value}</p>
          <div className="mt-4 h-1 w-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
        </div>
        {icon && (
          <div className="ml-4 text-3xl p-3 bg-slate-50 rounded-lg">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
