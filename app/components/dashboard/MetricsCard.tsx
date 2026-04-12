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
      className={`rounded-2xl border border-(--border-color) bg-(--surface) p-6 shadow-[0_10px_26px_rgba(27,94,32,0.08)] transition-all ${onClick ? "cursor-pointer hover:-translate-y-0.5 hover:border-(--primary-color) hover:shadow-[0_14px_30px_rgba(27,94,32,0.14)]" : ""} ${className}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-(--muted-color) text-xs font-semibold uppercase tracking-wide">
            {title}
          </p>
          <p className="mt-3 text-4xl font-bold text-(--heading-color)">
            {value}
          </p>
          <div className="mt-4 h-1 w-12 rounded-full bg-(--primary-color)"></div>
        </div>
        {icon && (
          <div className="ml-4 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-(--primary-color)">
            {React.isValidElement(icon)
              ? React.cloneElement(icon as any, { className: "w-6 h-6" })
              : icon}
          </div>
        )}
      </div>
    </div>
  );
}
