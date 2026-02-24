"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getDefectById } from "@/app/actions/detailsActions";
import { Defect, SeverityEnum, StatusEnum } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { HiArrowLeft, HiCheckCircle, HiExclamationCircle, HiClock } from "react-icons/hi";

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  CLOSED: "Fixed",
  ON_HOLD: "Pending",
  AS_IT_IS: "As it is",
};

const SEVERITY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  MAJOR: { bg: "bg-red-900", text: "text-red-200", label: "Major" },
  HIGH: { bg: "bg-orange-900", text: "text-orange-200", label: "High" },
  MEDIUM: { bg: "bg-yellow-900", text: "text-yellow-200", label: "Medium" },
  LOW: { bg: "bg-green-900", text: "text-green-200", label: "Low" },
};

const STATUS_COLORS_MAP: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  OPEN: { bg: "bg-blue-900", text: "text-blue-200", icon: <HiExclamationCircle /> },
  IN_PROGRESS: { bg: "bg-purple-900", text: "text-purple-200", icon: <HiClock /> },
  CLOSED: { bg: "bg-green-900", text: "text-green-200", icon: <HiCheckCircle /> },
  ON_HOLD: { bg: "bg-red-900", text: "text-red-200", icon: <HiClock /> },
  AS_IT_IS: { bg: "bg-slate-700", text: "text-slate-200", icon: <HiCheckCircle /> },
};

export default function DefectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [defect, setDefect] = useState<Defect | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDefect = async () => {
      try {
        const data = await getDefectById(id);
        if (data) {
          setDefect(data);
        } else {
          setError("Defect not found");
        }
      } catch (err) {
        setError("Failed to fetch defect details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDefect();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-700 border-t-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading defect details...</p>
        </div>
      </div>
    );
  }

  if (error || !defect) {
    return (
      <div className="min-h-screen bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2 px-4 py-2 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <HiArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-8 text-center">
            <HiExclamationCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-slate-300 text-lg">{error || "Defect not found"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 shadow-sm border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.back()}
            className="mb-4 flex items-center gap-2 px-4 py-2 text-blue-400 hover:text-blue-300 transition-colors rounded-lg hover:bg-slate-800"
          >
            <HiArrowLeft className="w-5 h-5" />
            Back to Defects
          </button>
          <h1 className="text-3xl font-bold text-white">Defect Details</h1>
          <p className="text-slate-400 mt-2">
            {defect.testCaseId ? `Test Case ID: ${defect.testCaseId}` : `ID: ${defect.id}`}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status & Severity */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Status</h3>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${STATUS_COLORS_MAP[defect.status].bg}`}>
                    <div className={STATUS_COLORS_MAP[defect.status].text}>
                      {STATUS_COLORS_MAP[defect.status].icon}
                    </div>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-lg">
                      {STATUS_LABELS[defect.status] || defect.status}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Severity</h3>
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-full ${SEVERITY_COLORS[defect.severity]?.bg} ${SEVERITY_COLORS[defect.severity]?.text}`}>
                    <p className="font-semibold text-sm">{SEVERITY_COLORS[defect.severity]?.label || defect.severity}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">Module</h3>
                <p className="text-white text-lg font-medium">{defect.module}</p>
              </div>

              <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">Priority</h3>
                <p className="text-white text-lg font-medium">{defect.priority}</p>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">Date Reported</h3>
                <p className="text-white text-lg font-medium">
                  {defect.dateReported ? formatDate(defect.dateReported) : "N/A"}
                </p>
              </div>

              <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">Date Fixed</h3>
                <p className="text-white text-lg font-medium">
                  {defect.dateFixed ? formatDate(defect.dateFixed) : "Not yet fixed"}
                </p>
              </div>
            </div>

            {/* Expected Result */}
            <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Expected Result</h3>
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {defect.expectedResult || "No expected result specified"}
                </p>
              </div>
            </div>

            {/* Actual Result */}
            <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Actual Result</h3>
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {defect.actualResult || "No actual result specified"}
                </p>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Summary */}
          <div>
            <div className="bg-slate-900 rounded-lg border border-slate-800 p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-white mb-6">Summary</h2>

              <div className="space-y-4">
                {defect.testCaseId && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Test Case ID</p>
                    <p className="text-slate-300 font-mono text-sm">{defect.testCaseId}</p>
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">{defect.testCaseId ? "Internal ID" : "ID"}</p>
                  <p className="text-slate-300 font-mono text-sm break-all">{defect.id}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Status</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS_MAP[defect.status].bg} ${STATUS_COLORS_MAP[defect.status].text}`}>
                    {STATUS_LABELS[defect.status] || defect.status}
                  </span>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Severity</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${SEVERITY_COLORS[defect.severity]?.bg} ${SEVERITY_COLORS[defect.severity]?.text}`}>
                    {SEVERITY_COLORS[defect.severity]?.label || defect.severity}
                  </span>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Module</p>
                  <p className="text-slate-300">{defect.module}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Priority</p>
                  <p className="text-slate-300">{defect.priority}</p>
                </div>

                <div className="pt-4 border-t border-slate-700">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Reported</p>
                  <p className="text-slate-300 text-sm">
                    {defect.dateReported ? formatDate(defect.dateReported) : "Unknown"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Fixed</p>
                  <p className="text-slate-300 text-sm">
                    {defect.dateFixed ? formatDate(defect.dateFixed) : "Not yet fixed"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
