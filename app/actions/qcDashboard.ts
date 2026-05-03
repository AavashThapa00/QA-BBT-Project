"use server";

import { backendJson } from "@/lib/backend/request";

interface QCStatus {
  status: "PASSED" | "FAILED" | "PENDING" | "REJECTED";
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

interface QCRecentDefect {
  id: string;
  testCaseId: string | null;
  module: string;
  status: string;
  qcStatusBbt: string;
  dateReported: string | null;
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

export async function getRecentQCDefects(): Promise<QCRecentDefect[]> {
  return backendJson<QCRecentDefect[]>("/api/analytics/qc/recent-defects", {
    method: "GET",
  });
}
