"use server";

import { backendJson } from "@/lib/backend/request";

interface MonthlyTrend {
  month: string;
  reported: number;
  fixed: number;
}

interface SeverityTrend {
  severity: string;
  count: number;
}

interface ModuleTrend {
  module: string;
  count: number;
}

export async function getMonthlyTrends(): Promise<MonthlyTrend[]> {
  return backendJson<MonthlyTrend[]>("/api/analytics/trends/monthly", {
    method: "GET",
  });
}

export async function getSeverityTrends(): Promise<SeverityTrend[]> {
  return backendJson<SeverityTrend[]>("/api/analytics/trends/severity", {
    method: "GET",
  });
}

export async function getModuleTrends(): Promise<ModuleTrend[]> {
  return backendJson<ModuleTrend[]>("/api/analytics/trends/module", {
    method: "GET",
  });
}
