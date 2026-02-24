"use client";

import React from "react";

export function SkeletonCard() {
  return (
    <div className="bg-slate-900 rounded-lg border border-slate-800 shadow-sm p-6 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-4 bg-slate-700 rounded w-24 mb-3"></div>
          <div className="h-10 bg-slate-700 rounded w-32 mb-4"></div>
          <div className="h-1 w-12 bg-slate-700 rounded-full"></div>
        </div>
        <div className="w-12 h-12 rounded-lg bg-slate-800"></div>
      </div>
    </div>
  );
}

export function SkeletonChart() {
  // Use deterministic heights based on index instead of Math.random()
  const heights = ["65%", "45%", "70%", "55%"];
  
  return (
    <div className="bg-slate-900 rounded-lg border border-slate-800 shadow-sm p-8 animate-pulse">
      <div className="mb-6">
        <div className="h-4 bg-slate-700 rounded w-32 mb-2"></div>
        <div className="h-3 bg-slate-800 rounded w-48"></div>
      </div>
      <div className="flex items-end justify-around h-64 gap-4 p-4">
        {heights.map((height, i) => (
          <div
            key={i}
            className="flex-1 bg-slate-700 rounded-lg"
            style={{ height }}
          ></div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden shadow-sm animate-pulse">
      <div className="p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-800 rounded-lg"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
