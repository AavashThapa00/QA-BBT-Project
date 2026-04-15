"use client";

import React from "react";

export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-(--border-color) bg-(--surface) p-6 shadow-card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-3 h-4 w-24 rounded bg-(--surface-soft)"></div>
          <div className="mb-4 h-10 w-32 rounded bg-(--surface-soft)"></div>
          <div className="h-1 w-12 rounded-full bg-(--surface-soft)"></div>
        </div>
        <div className="h-12 w-12 rounded-xl bg-(--surface-soft)"></div>
      </div>
    </div>
  );
}

export function SkeletonChart() {
  // Use deterministic heights based on index instead of Math.random()
  const heights = ["65%", "45%", "70%", "55%"];

  return (
    <div className="animate-pulse rounded-2xl border border-(--border-color) bg-(--surface) p-8 shadow-card">
      <div className="mb-6">
        <div className="mb-2 h-4 w-32 rounded bg-(--surface-soft)"></div>
        <div className="h-3 w-48 rounded bg-(--surface-soft)"></div>
      </div>
      <div className="flex items-end justify-around h-64 gap-4 p-4">
        {heights.map((height, i) => (
          <div
            key={i}
            className="flex-1 rounded-lg bg-(--surface-soft)"
            style={{ height }}
          ></div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-(--border-color) bg-(--surface) shadow-card">
      <div className="p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-(--surface-soft)"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

type PageSkeletonVariant = "dashboard" | "table" | "detail" | "form" | "auth";

type PageSkeletonProps = {
  variant?: PageSkeletonVariant;
};

export function PageSkeleton({ variant = "dashboard" }: PageSkeletonProps) {
  if (variant === "auth") {
    return (
      <div className="min-h-screen bg-(--page-background) px-6 py-10">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center justify-center">
          <div className="w-full animate-pulse overflow-hidden rounded-4xl border border-(--border-color) bg-(--surface-elevated) shadow-dialog">
            <div className="h-1 bg-(--surface-soft)" />
            <div className="px-8 py-7">
              <div className="h-9 w-44 rounded bg-(--surface-soft)" />
              <div className="mt-3 h-4 w-64 rounded bg-(--surface-soft)" />
              <div className="mt-6 space-y-4">
                <div className="h-11 rounded-xl bg-(--surface-soft)" />
                <div className="h-11 rounded-xl bg-(--surface-soft)" />
                <div className="h-12 rounded-xl bg-(--surface-soft)" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "detail") {
    return (
      <div className="min-h-screen bg-(--page-background) p-4 sm:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-screen-2xl animate-pulse space-y-6">
          <div className="h-4 w-40 rounded bg-(--surface-soft)" />
          <div className="rounded-2xl border border-(--border-color) bg-(--surface) p-6 shadow-sm">
            <div className="h-4 w-28 rounded bg-(--surface-soft)" />
            <div className="mt-4 h-10 w-72 rounded bg-(--surface-soft)" />
            <div className="mt-3 h-4 w-96 max-w-full rounded bg-(--surface-soft)" />
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[...Array(2)].map((_, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-(--border-color) bg-(--surface-soft) p-4"
                >
                  <div className="h-4 w-32 rounded bg-(--surface-elevated)" />
                  <div className="mt-4 h-28 rounded-lg bg-(--surface-elevated)" />
                </div>
              ))}
            </div>
            <div className="mt-6 h-40 rounded-xl bg-(--surface-soft)" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === "form") {
    return (
      <div className="min-h-screen bg-(--page-background) p-4 sm:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-screen-2xl animate-pulse space-y-6">
          <div className="h-4 w-40 rounded bg-(--surface-soft)" />
          <div className="rounded-2xl border border-(--border-color) bg-(--surface) p-6 shadow-sm">
            <div className="h-4 w-48 rounded bg-(--surface-soft)" />
            <div className="mt-3 h-4 w-80 max-w-full rounded bg-(--surface-soft)" />
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="space-y-2">
                  <div className="h-3 w-24 rounded bg-(--surface-soft)" />
                  <div className="h-11 rounded-lg bg-(--surface-soft)" />
                </div>
              ))}
            </div>
            <div className="mt-6 h-11 w-40 rounded-xl bg-(--surface-soft)" />
          </div>
          <div className="rounded-2xl border border-(--border-color) bg-(--surface) p-6 shadow-sm">
            <div className="h-4 w-36 rounded bg-(--surface-soft)" />
            <div className="mt-5 space-y-3">
              {[...Array(6)].map((_, index) => (
                <div
                  key={index}
                  className="h-10 rounded-lg bg-(--surface-soft)"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className="min-h-screen bg-(--page-background) p-4 sm:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-screen-2xl animate-pulse space-y-6">
          <div className="h-4 w-40 rounded bg-(--surface-soft)" />
          <div className="rounded-2xl border border-(--border-color) bg-(--surface) p-6 shadow-sm">
            <div className="h-4 w-44 rounded bg-(--surface-soft)" />
            <div className="mt-5 rounded-xl border border-(--border-color) bg-(--surface-soft) p-3">
              <div className="grid gap-3 md:grid-cols-4">
                {[...Array(4)].map((_, index) => (
                  <div
                    key={index}
                    className="h-11 rounded-lg bg-(--surface-elevated)"
                  />
                ))}
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {[...Array(7)].map((_, index) => (
                <div
                  key={index}
                  className="h-12 rounded-lg bg-(--surface-soft)"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--page-background) p-4 sm:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-screen-2xl animate-pulse space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-4 w-36 rounded bg-(--surface-soft)" />
            <div className="mt-3 h-9 w-64 rounded bg-(--surface-soft)" />
            <div className="mt-3 h-4 w-72 rounded bg-(--surface-soft)" />
          </div>
          <div className="h-10 w-28 rounded-xl bg-(--surface-soft)" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-(--border-color) bg-(--surface) p-6 shadow-card"
            >
              <div className="h-4 w-24 rounded bg-(--surface-soft)" />
              <div className="mt-4 h-10 w-32 rounded bg-(--surface-soft)" />
              <div className="mt-6 h-28 rounded-xl bg-(--surface-soft)" />
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-(--border-color) bg-(--surface) p-6 shadow-card">
            <div className="h-4 w-40 rounded bg-(--surface-soft)" />
            <div className="mt-6 h-64 rounded-xl bg-(--surface-soft)" />
          </div>
          <div className="rounded-2xl border border-(--border-color) bg-(--surface) p-6 shadow-card">
            <div className="h-4 w-36 rounded bg-(--surface-soft)" />
            <div className="mt-6 h-64 rounded-xl bg-(--surface-soft)" />
          </div>
        </div>

        <div className="rounded-2xl border border-(--border-color) bg-(--surface) p-6 shadow-card">
          <div className="h-4 w-40 rounded bg-(--surface-soft)" />
          <div className="mt-5 space-y-3">
            {[...Array(5)].map((_, index) => (
              <div
                key={index}
                className="h-12 rounded-lg bg-(--surface-soft)"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
