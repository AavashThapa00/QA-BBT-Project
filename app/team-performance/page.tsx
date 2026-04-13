"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HiArrowLeft, HiUserGroup, HiClock, HiX } from "react-icons/hi";
import AppButton from "@/app/components/common/AppButton";
import {
  getTeamPerformance,
  getTeamDefectsByStatus,
} from "@/app/actions/teamPerformance";

interface TeamMember {
  assignedTo: string;
  totalDefects: number;
  openDefects: number;
  closedDefects: number;
  avgFixTimeDays: number | null;
  highSeverityCount: number;
}

interface TeamDefect {
  id: string;
  testCaseId: string | null;
  module: string;
  summary: string | null;
  status: string;
  dateReported: string | null;
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case "OPEN":
    case "IN_PROGRESS":
      return "Pending";
    case "CLOSED":
      return "Fixed";
    case "ON_HOLD":
      return "Hold";
    case "AS_IT_IS":
      return "As it is";
    default:
      return status;
  }
};

const STATUS_BADGE_COLORS: Record<string, string> = {
  Pending: "#dc2626",
  Fixed: "#16a34a",
  Hold: "#ea580c",
  "As it is": "#64748b",
};

export default function TeamPerformancePage() {
  const [teamData, setTeamData] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<"open" | "fixed" | null>(
    null,
  );
  const [selectedDefects, setSelectedDefects] = useState<TeamDefect[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const data = await getTeamPerformance();
        setTeamData(data);
      } catch (error) {
        console.error("Error fetching team performance:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const openDrilldown = async (team: string, type: "open" | "fixed") => {
    setSelectedTeam(team);
    setSelectedType(type);
    setIsModalOpen(true);
    setModalLoading(true);
    try {
      const defects = await getTeamDefectsByStatus(team, type);
      setSelectedDefects(defects);
    } catch (error) {
      console.error("Error fetching team defects:", error);
      setSelectedDefects([]);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTeam(null);
    setSelectedType(null);
    setSelectedDefects([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-(--page-background) p-8">
        <div className="flex items-center justify-center h-96">
          <div className="h-12 w-12 animate-spin rounded-full"></div>
        </div>
      </div>
    );
  }

  const totals = teamData.reduce(
    (acc, member) => {
      acc.total += member.totalDefects;
      acc.open += member.openDefects;
      acc.fixed += member.closedDefects;
      return acc;
    },
    { total: 0, open: 0, fixed: 0 },
  );

  return (
    <div className="min-h-screen bg-(--page-background) p-4 sm:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-screen-2xl space-y-6">
        <div className="flex items-center justify-between animate-in fade-in duration-500">
          <div>
            <Link
              href="/"
              className="group mb-3 inline-flex items-center gap-2 text-sm text-(--muted-color) transition-all duration-300 hover:translate-x-1 hover:text-(--primary-color)"
            >
              <HiArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Dashboard</span>
            </Link>
            <h1 className="text-3xl font-bold text-(--heading-color)">
              Team Performance
            </h1>
            <p className="mt-1 text-sm text-(--muted-color)">
              Who is fixing what and how fast
            </p>
          </div>
        </div>

        {teamData.length === 0 ? (
          <div className="rounded-lg border border-(--border-color) bg-(--surface) p-12 text-center">
            <HiUserGroup className="mx-auto mb-4 h-12 w-12 text-(--muted-color)" />
            <p className="text-(--muted-color)">No assigned defects found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {teamData.map((member) => (
              <div
                key={member.assignedTo}
                className="flex min-h-65 flex-col justify-between rounded-2xl border border-(--border-color) bg-(--surface) p-6 transition-all duration-300 hover:border-emerald-200 hover:shadow-sm animate-in fade-in-up"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-(--heading-color)">
                    {member.assignedTo}
                  </h3>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                    {member.totalDefects} total
                  </span>
                </div>

                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <HiClock className="h-5 w-5 text-(--primary-color)" />
                    <div>
                      <p className="text-sm text-(--muted-color)">
                        Avg Fix Time
                      </p>
                      <p className="text-xl font-bold text-(--text-color)">
                        {member.avgFixTimeDays !== null
                          ? `${member.avgFixTimeDays} days`
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-left transition-colors hover:bg-amber-100"
                      onClick={() => openDrilldown(member.assignedTo, "open")}
                    >
                      <p className="text-xs font-medium text-amber-700">Open</p>
                      <p className="text-2xl font-bold text-amber-700">
                        {member.openDefects}
                      </p>
                    </button>
                    <button
                      type="button"
                      className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-left transition-colors hover:bg-emerald-100"
                      onClick={() => openDrilldown(member.assignedTo, "fixed")}
                    >
                      <p className="text-xs font-medium text-emerald-700">
                        Fixed
                      </p>
                      <p className="text-2xl font-bold text-emerald-700">
                        {member.closedDefects}
                      </p>
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <div className="flex min-h-65 flex-col justify-between rounded-2xl border border-(--border-color) bg-(--surface) p-6 transition-all duration-300 hover:border-emerald-200 hover:shadow-sm animate-in fade-in-up">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-(--heading-color)">
                  Team Summary
                </h3>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  {totals.total} total
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-left transition-colors hover:bg-amber-100"
                  onClick={() => openDrilldown("ALL", "open")}
                >
                  <p className="text-xs font-medium text-amber-700">Open</p>
                  <p className="text-2xl font-bold text-amber-700">
                    {totals.open}
                  </p>
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-left transition-colors hover:bg-emerald-100"
                  onClick={() => openDrilldown("ALL", "fixed")}
                >
                  <p className="text-xs font-medium text-emerald-700">Fixed</p>
                  <p className="text-2xl font-bold text-emerald-700">
                    {totals.fixed}
                  </p>
                </button>
              </div>
            </div>
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-4xl max-h-200 overflow-hidden rounded-2xl border border-(--border-color) bg-(--surface) shadow-xl animate-in zoom-in duration-300">
              <div className="flex items-center justify-between border-b border-(--border-color) bg-(--surface-soft) px-6 py-4">
                <div>
                  <h3 className="text-lg font-bold text-(--heading-color)">
                    {selectedTeam === "ALL" ? "All Teams" : selectedTeam} -{" "}
                    {selectedType === "open" ? "Open" : "Fixed"} Defects
                  </h3>
                  <p className="mt-1 text-xs text-(--muted-color)">
                    Click outside or close to exit
                  </p>
                </div>
                <AppButton
                  type="button"
                  onClick={closeModal}
                  variant="secondary"
                  size="icon"
                  aria-label="Close modal"
                >
                  <HiX className="w-5 h-5" />
                </AppButton>
              </div>

              <div className="max-h-175 overflow-auto p-6">
                {modalLoading ? (
                  <div className="flex items-center justify-center h-48">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-12 w-12 animate-spin rounded-full border-2 border-emerald-200 border-t-(--primary-color)"></div>
                      <p className="text-sm font-medium text-(--muted-color)">
                        Loading defects...
                      </p>
                    </div>
                  </div>
                ) : selectedDefects.length === 0 ? (
                  <div className="rounded-xl border border-(--border-color) bg-(--surface-soft) p-8 py-12 text-center text-(--muted-color)">
                    No defects found for this selection
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="sticky top-0 z-10 border-b border-emerald-100 bg-emerald-50/60">
                          <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-(--heading-color)">
                            Test Case ID
                          </th>
                          <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-(--heading-color)">
                            Module
                          </th>
                          <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-(--heading-color)">
                            Status
                          </th>
                          <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-(--heading-color)">
                            Date Reported
                          </th>
                          <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-(--heading-color)">
                            Summary
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedDefects.map((defect) => {
                          const statusLabel = getStatusLabel(defect.status);
                          return (
                            <tr
                              key={defect.id}
                              className="group border-b border-emerald-50 transition-all duration-200 hover:bg-emerald-50/40"
                            >
                              <td className="px-4 py-3 font-mono text-xs text-(--text-color)">
                                {defect.testCaseId || defect.id.substring(0, 8)}
                              </td>
                              <td className="px-4 py-3 text-(--text-color)">
                                <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                                  {defect.module}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className="rounded px-2 py-1 text-xs font-semibold"
                                  style={{
                                    backgroundColor: `${STATUS_BADGE_COLORS[statusLabel] || "#6b7280"}20`,
                                    color:
                                      STATUS_BADGE_COLORS[statusLabel] ||
                                      "#6b7280",
                                  }}
                                >
                                  {statusLabel}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs text-(--muted-color)">
                                {defect.dateReported || "N/A"}
                              </td>
                              <td className="max-w-xs truncate px-4 py-3 text-(--text-color)">
                                {defect.summary || "N/A"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
