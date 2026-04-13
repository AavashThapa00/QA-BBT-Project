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
      className={`rounded-xl border border-(--border-color) bg-(--surface) p-5 shadow-sm transition-colors ${onClick ? "cursor-pointer hover:border-(--primary-color)" : ""} ${className}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-(--muted-color) text-xs font-semibold uppercase tracking-wide">
            {title}
          </p>
          <p className="mt-2.5 text-3xl font-semibold text-(--heading-color)">
            {value}
          </p>
          <div className="mt-3 h-0.5 w-10 rounded-full bg-(--primary-color)"></div>
        </div>
        {icon && (
          <div className="ml-4 rounded-lg border border-(--border-color) bg-(--surface-soft) p-2.5 text-(--primary-color)">
            {React.isValidElement(icon)
              ? React.cloneElement(icon as any, { className: "w-6 h-6" })
              : icon}
          </div>
        )}
      </div>
    </div>
  );
}
