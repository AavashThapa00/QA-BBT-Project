"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HiArrowLeft, HiUserGroup, HiClock, HiX } from "react-icons/hi";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8 overflow-hidden relative">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-30 -z-10">
        <div className="absolute top-20 left-1/3 w-80 h-80 bg-orange-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-rose-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 left-1/2 w-80 h-80 bg-amber-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-12 space-y-8">
        <div className="flex items-center justify-between animate-in fade-in duration-500">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-orange-400 transition-all duration-300 transform hover:translate-x-1 mb-4 group"
            >
              <HiArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Back to Dashboard</span>
            </Link>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-rose-400 bg-clip-text text-transparent">Team Performance</h1>
            <p className="text-slate-400 mt-2 text-sm">Who is fixing what and how fast</p>
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
                className="backdrop-blur-xl bg-slate-900/50 rounded-2xl border border-slate-800/50 p-8 hover:border-slate-700/50 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/10 min-h-[260px] flex flex-col justify-between animate-in fade-in-up duration-500"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">{member.assignedTo}</h3>
                  <span className="text-xs text-slate-400 bg-gradient-to-r from-orange-600/30 to-rose-600/30 border border-orange-500/30 px-3 py-1 rounded-full font-medium">
                    {member.totalDefects} total
                  </span>
                </div>

                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <HiClock className="w-5 h-5 text-orange-400" />
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
                      className="backdrop-blur-md bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 text-left hover:bg-slate-700/50 hover:shadow-lg hover:shadow-amber-500/20 transition-all duration-300 transform hover:scale-105"
                      onClick={() => openDrilldown(member.assignedTo, "open")}
                    >
                      <p className="text-xs text-slate-400 font-medium">Open</p>
                      <p className="text-2xl font-bold text-amber-400 group-hover:text-amber-300 transition-colors">{member.openDefects}</p>
                    </button>
                    <button
                      type="button"
                      className="backdrop-blur-md bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 text-left hover:bg-slate-700/50 hover:shadow-lg hover:shadow-green-500/20 transition-all duration-300 transform hover:scale-105"
                      onClick={() => openDrilldown(member.assignedTo, "fixed")}
                    >
                      <p className="text-xs text-slate-400 font-medium">Fixed</p>
                      <p className="text-2xl font-bold text-green-400 group-hover:text-green-300 transition-colors">{member.closedDefects}</p>
                    </button>
                  </div>

                </div>
              </div>
            ))}
            <div className="backdrop-blur-xl bg-slate-900/50 rounded-2xl border border-slate-800/50 p-8 hover:border-slate-700/50 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/10 min-h-[260px] flex flex-col justify-between animate-in fade-in-up duration-500">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Team Summary</h3>
                <span className="text-xs text-slate-400 bg-gradient-to-r from-orange-600/30 to-rose-600/30 border border-orange-500/30 px-3 py-1 rounded-full font-medium">
                  {totals.total} total
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  className="backdrop-blur-md bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 text-left hover:bg-slate-700/50 hover:shadow-lg hover:shadow-amber-500/20 transition-all duration-300 transform hover:scale-105"
                  onClick={() => openDrilldown("ALL", "open")}
                >
                  <p className="text-xs text-slate-400 font-medium">Open</p>
                  <p className="text-2xl font-bold text-amber-400 group-hover:text-amber-300 transition-colors">{totals.open}</p>
                </button>
                <button
                  type="button"
                  className="backdrop-blur-md bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 text-left hover:bg-slate-700/50 hover:shadow-lg hover:shadow-green-500/20 transition-all duration-300 transform hover:scale-105"
                  onClick={() => openDrilldown("ALL", "fixed")}
                >
                  <p className="text-xs text-slate-400 font-medium">Fixed</p>
                  <p className="text-2xl font-bold text-green-400 group-hover:text-green-300 transition-colors">{totals.fixed}</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="backdrop-blur-xl bg-slate-900/90 rounded-2xl border border-slate-800/50 w-full max-w-4xl max-h-[80vh] overflow-hidden shadow-2xl shadow-orange-500/10 animate-in zoom-in duration-300">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/50 bg-gradient-to-r from-orange-600/5 to-rose-600/5">
                <div>
                  <h3 className="text-lg font-bold bg-gradient-to-r from-orange-400 to-rose-400 bg-clip-text text-transparent">
                    {selectedTeam === "ALL" ? "All Teams" : selectedTeam} - {selectedType === "open" ? "Open" : "Fixed"} Defects
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Click outside or close to exit
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="text-slate-400 hover:text-orange-400 transition-all duration-300 hover:bg-orange-500/10 p-2 rounded-lg"
                >
                  <HiX className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-auto max-h-[70vh]">
                {modalLoading ? (
                  <div className="flex items-center justify-center h-48">
                    <div className="flex flex-col items-center gap-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-700 border-t-orange-500"></div>
                      <p className="text-sm text-slate-400 font-medium">Loading defects...</p>
                    </div>
                  </div>
                ) : selectedDefects.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 bg-slate-800/20 rounded-xl border border-slate-700/30 p-8">
                    No defects found for this selection
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="border-b border-slate-700/50 bg-gradient-to-r from-orange-600/5 to-rose-600/5 sticky top-0 z-10">
                          <th className="py-4 px-4 text-orange-300 font-semibold uppercase tracking-wide text-xs">Test Case ID</th>
                          <th className="py-4 px-4 text-orange-300 font-semibold uppercase tracking-wide text-xs">Module</th>
                          <th className="py-4 px-4 text-orange-300 font-semibold uppercase tracking-wide text-xs">Status</th>
                          <th className="py-4 px-4 text-orange-300 font-semibold uppercase tracking-wide text-xs">Date Reported</th>
                          <th className="py-4 px-4 text-orange-300 font-semibold uppercase tracking-wide text-xs">Summary</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedDefects.map((defect) => {
                          const statusLabel = getStatusLabel(defect.status);
                          return (
                            <tr key={defect.id} className="border-b border-slate-800/30 hover:bg-slate-800/50 transition-all duration-200 group">
                              <td className="py-3 px-4 text-slate-200 group-hover:text-orange-300 transition-colors font-mono text-xs">
                                {defect.testCaseId || defect.id.substring(0, 8)}
                              </td>
                              <td className="py-3 px-4 text-slate-200 group-hover:text-slate-100 transition-colors">
                                <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-800/50 text-slate-300 text-xs font-medium">
                                  {defect.module}
                                </span>
                              </td>
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
                              <td className="py-3 px-4 text-slate-400 group-hover:text-slate-200 transition-colors text-xs">
                                {defect.dateReported || "N/A"}
                              </td>
                              <td className="py-3 px-4 text-slate-200 group-hover:text-slate-100 transition-colors truncate max-w-xs">
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
