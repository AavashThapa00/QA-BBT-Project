"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HiArrowLeft, HiUserGroup, HiClock, HiExclamationCircle, HiX } from "react-icons/hi";
import { getTeamPerformance, getTeamDefectsByStatus } from "@/app/actions/teamPerformance";

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
  Pending: "#ef4444",
  Fixed: "#10b981",
  Hold: "#f97316",
  "As it is": "#9ca3af",
};

export default function TeamPerformancePage() {
  const [teamData, setTeamData] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<"open" | "fixed" | null>(null);
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
      <div className="min-h-screen bg-slate-950 p-8">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-700 border-t-blue-500"></div>
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
    { total: 0, open: 0, fixed: 0 }
  );

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
            >
              <HiArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Dashboard</span>
            </Link>
            <h1 className="text-3xl font-bold text-white">Team Performance</h1>
            <p className="text-slate-400 mt-1">Who is fixing what and how fast</p>
          </div>
        </div>

        {teamData.length === 0 ? (
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-12 text-center">
            <HiUserGroup className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No assigned defects found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamData.map((member) => (
              <div
                key={member.assignedTo}
                className="bg-slate-900 rounded-xl border border-slate-800 p-8 hover:border-slate-700 transition-colors min-h-[260px] flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">{member.assignedTo}</h3>
                  <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded">
                    {member.totalDefects} total
                  </span>
                </div>

                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <HiClock className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-sm text-slate-400">Avg Fix Time</p>
                      <p className="text-xl font-bold text-white">
                        {member.avgFixTimeDays !== null ? `${member.avgFixTimeDays} days` : "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      className="bg-slate-800 rounded-lg p-3 text-left hover:bg-slate-700 transition-colors"
                      onClick={() => openDrilldown(member.assignedTo, "open")}
                    >
                      <p className="text-xs text-slate-400">Open</p>
                      <p className="text-lg font-bold text-amber-400">{member.openDefects}</p>
                    </button>
                    <button
                      type="button"
                      className="bg-slate-800 rounded-lg p-3 text-left hover:bg-slate-700 transition-colors"
                      onClick={() => openDrilldown(member.assignedTo, "fixed")}
                    >
                      <p className="text-xs text-slate-400">Fixed</p>
                      <p className="text-lg font-bold text-green-400">{member.closedDefects}</p>
                    </button>
                  </div>

                </div>
              </div>
            ))}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-8 hover:border-slate-700 transition-colors min-h-[260px] flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Team Summary</h3>
                <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded">
                  {totals.total} total
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  className="bg-slate-800 rounded-lg p-3 text-left hover:bg-slate-700 transition-colors"
                  onClick={() => openDrilldown("ALL", "open")}
                >
                  <p className="text-xs text-slate-400">Open</p>
                  <p className="text-lg font-bold text-amber-400">{totals.open}</p>
                </button>
                <button
                  type="button"
                  className="bg-slate-800 rounded-lg p-3 text-left hover:bg-slate-700 transition-colors"
                  onClick={() => openDrilldown("ALL", "fixed")}
                >
                  <p className="text-xs text-slate-400">Fixed</p>
                  <p className="text-lg font-bold text-green-400">{totals.fixed}</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
            <div className="bg-slate-900 rounded-lg border border-slate-800 w-full max-w-4xl max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {selectedTeam === "ALL" ? "All Teams" : selectedTeam} - {selectedType === "open" ? "Open" : "Fixed"} Defects
                  </h3>
                  <p className="text-xs text-slate-400">
                    Click outside or close to exit
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <HiX className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-auto max-h-[70vh]">
                {modalLoading ? (
                  <div className="flex items-center justify-center h-48">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-700 border-t-blue-500"></div>
                  </div>
                ) : selectedDefects.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    No defects found for this selection
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="py-3 px-4 text-slate-300">Test Case ID</th>
                          <th className="py-3 px-4 text-slate-300">Module</th>
                          <th className="py-3 px-4 text-slate-300">Status</th>
                          <th className="py-3 px-4 text-slate-300">Date Reported</th>
                          <th className="py-3 px-4 text-slate-300">Summary</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedDefects.map((defect) => {
                          const statusLabel = getStatusLabel(defect.status);
                          return (
                            <tr key={defect.id} className="border-b border-slate-800 hover:bg-slate-800">
                              <td className="py-3 px-4 text-slate-200">
                                {defect.testCaseId || defect.id.substring(0, 8)}
                              </td>
                              <td className="py-3 px-4 text-slate-200">{defect.module}</td>
                              <td className="py-3 px-4">
                                <span
                                  className="px-2 py-1 rounded text-xs font-semibold"
                                  style={{
                                    backgroundColor: `${STATUS_BADGE_COLORS[statusLabel] || "#6b7280"}20`,
                                    color: STATUS_BADGE_COLORS[statusLabel] || "#6b7280",
                                  }}
                                >
                                  {statusLabel}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-200">
                                {defect.dateReported || "N/A"}
                              </td>
                              <td className="py-3 px-4 text-slate-200">
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
