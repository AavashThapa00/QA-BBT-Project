"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HiArrowLeft, HiCheckCircle, HiClock, HiExclamationCircle } from "react-icons/hi";
import { Defect } from "@/lib/types";
import { getAllDefectsSorted } from "@/app/actions/detailsActions";
import { formatDate } from "@/lib/utils";

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  OPEN: { bg: "bg-blue-900", text: "text-blue-200", icon: <HiExclamationCircle /> },
  IN_PROGRESS: { bg: "bg-purple-900", text: "text-purple-200", icon: <HiClock /> },
  CLOSED: { bg: "bg-green-900", text: "text-green-200", icon: <HiCheckCircle /> },
  ON_HOLD: { bg: "bg-red-900", text: "text-red-200", icon: <HiClock /> },
  AS_IT_IS: { bg: "bg-slate-700", text: "text-slate-200", icon: <HiCheckCircle /> },
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  CLOSED: "Fixed",
  ON_HOLD: "Pending",
  AS_IT_IS: "As it is",
};

const MODULES = ["ALL", "HSA", "KFQ", "GMST", "NMST", "Innovatetech"];

export default function AllDefectsPage() {
  const router = useRouter();
  const [defects, setDefects] = useState<Defect[]>([]);
  const [filteredDefects, setFilteredDefects] = useState<Defect[]>([]);
  const [selectedModule, setSelectedModule] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDefects();
  }, []);

  useEffect(() => {
    if (selectedModule === "ALL") {
      setFilteredDefects(defects);
    } else {
      const filtered = defects.filter((defect) => 
        defect.module.toLowerCase().includes(selectedModule.toLowerCase())
      );
      setFilteredDefects(filtered);
    }
  }, [selectedModule, defects]);

  const loadDefects = async () => {
    setIsLoading(true);
    try {
      const data = await getAllDefectsSorted();
      setDefects(data);
      setFilteredDefects(data);
    } catch (error) {
      console.error("Error loading defects:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/")}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <HiArrowLeft className="w-5 h-5 text-slate-400" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-white">All Defects</h1>
                <p className="text-sm text-slate-400">
                  {filteredDefects.length} defect{filteredDefects.length !== 1 ? "s" : ""}
                  {selectedModule !== "ALL" && ` in ${selectedModule}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Module Navigation */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {MODULES.map((module) => (
            <button
              key={module}
              onClick={() => setSelectedModule(module)}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                selectedModule === module
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              {module}
            </button>
          ))}
        </div>

        {/* Defects List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-700 border-t-blue-500"></div>
          </div>
        ) : filteredDefects.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-400">No defects found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDefects.map((defect) => (
              <div
                key={defect.id}
                className="bg-slate-900 rounded-lg border border-slate-800 p-6 hover:border-slate-700 transition-colors cursor-pointer"
                onClick={() => router.push(`/defects/${defect.id}`)}
              >
                {/* Summary/Title Header */}
                {defect.summary && (
                  <h2 className="text-lg font-semibold text-white mb-4 leading-relaxed">
                    {defect.summary}
                  </h2>
                )}

                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-mono text-slate-500">
                        {defect.testCaseId || defect.id.substring(0, 8)}
                      </span>
                      <span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300">
                        {defect.module}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          STATUS_COLORS[defect.status].bg
                        } ${STATUS_COLORS[defect.status].text}`}
                      >
                        {STATUS_COLORS[defect.status].icon}
                        {STATUS_LABELS[defect.status]}
                      </span>
                    </div>
                    {defect.dateReported && (
                      <p className="text-xs text-slate-500">
                        Reported: {formatDate(defect.dateReported)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Expected Result */}
                  <div>
                    <h3 className="text-sm font-semibold text-green-400 mb-2">
                      ✓ Expected Result
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {defect.expectedResult}
                    </p>
                  </div>

                  {/* Actual Result */}
                  <div>
                    <h3 className="text-sm font-semibold text-red-400 mb-2">
                      ✗ Actual Result
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {defect.actualResult}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-4 text-xs text-slate-500">
                  <span>Severity: <span className="text-slate-300 font-medium">{defect.severity}</span></span>
                  <span>Priority: <span className="text-slate-300 font-medium">{defect.priority}</span></span>
                  {defect.dateFixed && (
                    <span>Fixed: <span className="text-slate-300">{formatDate(defect.dateFixed)}</span></span>
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
