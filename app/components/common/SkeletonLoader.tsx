"use client";

import React from "react";

export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-(--border-color) bg-(--surface) p-6 shadow-[0_10px_26px_rgba(27,94,32,0.08)]">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-3 h-4 w-24 rounded bg-emerald-100"></div>
          <div className="mb-4 h-10 w-32 rounded bg-emerald-100"></div>
          <div className="h-1 w-12 rounded-full bg-emerald-100"></div>
        </div>
        <div className="h-12 w-12 rounded-xl bg-emerald-100"></div>
      </div>
    </div>
  );
}

export function SkeletonChart() {
  // Use deterministic heights based on index instead of Math.random()
  const heights = ["65%", "45%", "70%", "55%"];

  return (
    <div className="animate-pulse rounded-2xl border border-(--border-color) bg-(--surface) p-8 shadow-[0_10px_26px_rgba(27,94,32,0.08)]">
      <div className="mb-6">
        <div className="mb-2 h-4 w-32 rounded bg-emerald-100"></div>
        <div className="h-3 w-48 rounded bg-emerald-50"></div>
      </div>
      <div className="flex items-end justify-around h-64 gap-4 p-4">
        {heights.map((height, i) => (
          <div
            key={i}
            className="flex-1 rounded-lg bg-emerald-100"
            style={{ height }}
          ></div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-(--border-color) bg-(--surface) shadow-[0_10px_26px_rgba(27,94,32,0.08)]">
      <div className="p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-emerald-100"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
