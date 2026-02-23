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
    <div className={`bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-950 rounded-xl shadow-lg border border-indigo-800 p-6 hover:shadow-2xl hover:-translate-y-0.5 transition-all backdrop-blur-sm ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-slate-300 text-xs font-semibold uppercase tracking-wide">{title}</p>
          <p className="mt-3 text-4xl font-bold text-white">{value}</p>
          <div className="mt-4 h-1 w-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
        </div>
        {icon && (
          <div className="ml-4 p-3 bg-indigo-900 text-indigo-200 rounded-lg">
            {React.isValidElement(icon) ? React.cloneElement(icon as any, { className: 'w-6 h-6' }) : icon}
          </div>
        )}
      </div>
    </div>
  );
}
