"use server";

import { backendJson } from "@/lib/backend/request";

interface TeamMember {
  assignedTo: string;
  totalDefects: number;
  openDefects: number;
  closedDefects: number;
  avgFixTimeDays: number | null;
  highSeverityCount: number;
  resolutionPercentage?: number;
}

interface TeamDefect {
  id: string;
  testCaseId: string | null;
  module: string;
  summary: string | null;
  status: string;
  dateReported: string | null;
}

export async function getTeamPerformance(): Promise<TeamMember[]> {
  return backendJson<TeamMember[]>("/api/analytics/team/performance", {
    method: "GET",
  });
}

export async function getTeamDefectsByStatus(
  team?: string,
  type?: "open" | "fixed",
): Promise<TeamDefect[]> {
  const query = new URLSearchParams();
  if (team) query.set("team", team);
  if (type) query.set("type", type);

  return backendJson<TeamDefect[]>(
    `/api/analytics/team/defects-by-status${query.toString() ? `?${query.toString()}` : ""}`,
    {
    method: "GET",
    },
  );
}
