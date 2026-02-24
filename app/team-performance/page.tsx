"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HiArrowLeft, HiUserGroup, HiClock, HiExclamationCircle } from "react-icons/hi";
import { getTeamPerformance } from "@/app/actions/teamPerformance";

interface TeamMember {
  assignedTo: string;
  totalDefects: number;
  openDefects: number;
  closedDefects: number;
  avgFixTimeDays: number | null;
  highSeverityCount: number;
}

export default function TeamPerformancePage() {
  const [teamData, setTeamData] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-8">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-700 border-t-blue-500"></div>
        </div>
      </div>
    );
  }

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamData.map((member) => (
              <div
                key={member.assignedTo}
                className="bg-slate-900 rounded-lg border border-slate-800 p-6 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">{member.assignedTo}</h3>
                  <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded">
                    {member.totalDefects} total
                  </span>
                </div>

                <div className="space-y-4">
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
                    <div className="bg-slate-800 rounded-lg p-3">
                      <p className="text-xs text-slate-400">Open</p>
                      <p className="text-lg font-bold text-amber-400">{member.openDefects}</p>
                    </div>
                    <div className="bg-slate-800 rounded-lg p-3">
                      <p className="text-xs text-slate-400">Fixed</p>
                      <p className="text-lg font-bold text-green-400">{member.closedDefects}</p>
                    </div>
                  </div>

                  {member.highSeverityCount > 0 && (
                    <div className="flex items-center gap-2 text-xs text-red-400">
                      <HiExclamationCircle className="w-4 h-4" />
                      <span>{member.highSeverityCount} high priority defects</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
