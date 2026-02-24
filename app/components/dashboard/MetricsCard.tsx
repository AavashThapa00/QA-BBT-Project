"use client";

import React from "react";

interface MetricsCardProps {
  title: string;
  value: number;
  icon?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function MetricsCard({
  title,
  value,
  icon,
  className = "",
  onClick,
}: MetricsCardProps) {
  return (
    <div 
      className={`bg-slate-900 rounded-lg border border-slate-800 shadow-sm p-6 hover:border-slate-700 transition-colors ${onClick ? 'cursor-pointer hover:shadow-lg hover:border-blue-600' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-slate-300 text-xs font-semibold uppercase tracking-wide">{title}</p>
          <p className="mt-3 text-4xl font-bold text-white">{value}</p>
          <div className="mt-4 h-1 w-12 bg-blue-600 rounded-full"></div>
        </div>
        {icon && (
          <div className="ml-4 p-3 bg-slate-800 text-blue-400 rounded-lg">
            {React.isValidElement(icon) ? React.cloneElement(icon as any, { className: 'w-6 h-6' }) : icon}
          </div>
        )}
      </div>
    </div>
  );
}
