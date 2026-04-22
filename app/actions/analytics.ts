"use server";

import { backendJson } from "@/lib/backend/request";

interface StatusCount {
  status: string;
  count: number;
}

interface ModuleFixTime {
  module: string;
  avgDays: number | null;
  totalFixed: number;
  uncertainCount: number;
}

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

interface TeamMember {
  assignedTo: string;
  totalDefects: number;
  openDefects: number;
  closedDefects: number;
  resolutionPercentage: number;
}

interface TeamDefect {
  id: string;
  testCaseId: string | null;
  module: string;
  summary: string | null;
  status: string;
  dateReported: string | null;
}

interface QCStatus {
  status: string;
  count: number;
}

interface QCSummary {
  totalDefects: number;
  passedQC: number;
  failedQC: number;
  pendingQC: number;
  rejectedQC: number;
  passPercentage: number;
}

export async function getDefectsByStatus(): Promise<StatusCount[]> {
  return backendJson<StatusCount[]>("/api/analytics/defects/status-counts", {
    method: "GET",
  });
}

export async function getAverageFixTimeByModule(): Promise<ModuleFixTime[]> {
  return backendJson<ModuleFixTime[]>("/api/analytics/defects/average-fix-time-by-module", {
    method: "GET",
  });
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

export async function getTeamPerformance(): Promise<TeamMember[]> {
  return backendJson<TeamMember[]>("/api/analytics/team/performance", {
    method: "GET",
  });
}

export async function getTeamDefectsByStatus(): Promise<TeamDefect[]> {
  return backendJson<TeamDefect[]>("/api/analytics/team/defects-by-status", {
    method: "GET",
  });
}

export async function getQCStatusCounts(): Promise<QCStatus[]> {
  return backendJson<QCStatus[]>("/api/analytics/qc/status-counts", {
    method: "GET",
  });
}

export async function getQCSummary(): Promise<QCSummary> {
  return backendJson<QCSummary>("/api/analytics/qc/summary", {
    method: "GET",
  });
}

export async function getRecentQCDefects(): Promise<TeamDefect[]> {
  return backendJson<TeamDefect[]>("/api/analytics/qc/recent-defects", {
    method: "GET",
  });
}
