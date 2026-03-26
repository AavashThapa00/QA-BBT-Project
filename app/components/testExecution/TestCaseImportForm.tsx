"use client";

import React, { useState, useRef } from "react";
import { HiArrowUp, HiCheckCircle, HiExclamationCircle } from "react-icons/hi";
import * as XLSX from "xlsx";

interface TestCaseImportProps {
  onImportSuccess?: (cycleName: string, imported: number) => void;
  onImportError?: (error: string) => void;
}

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function isTestCaseHeaderRow(row: unknown[]): boolean {
  const headers = row.map(normalizeHeader).filter(Boolean);

  const hasId = headers.some((h) => h.includes("test case id") || h === "id" || h.includes("tc id"));
  const hasTitle = headers.some((h) => h.includes("use case") || h.includes("scenario") || h.includes("description"));
  const hasSteps = headers.some((h) => h.includes("step"));

  return hasId && hasTitle && hasSteps;
}

function findHeaderRowIndex(rows: unknown[][]): number {
  const searchLimit = Math.min(rows.length, 30);
  for (let i = 0; i < searchLimit; i++) {
    if (isTestCaseHeaderRow(rows[i] ?? [])) {
      return i;
    }
  }
  return -1;
}

function rowsToCsv(rows: string[][]): string {
  return rows
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

export default function TestCaseImportForm({ onImportSuccess, onImportError }: TestCaseImportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [cycleName, setCycleName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const lowerName = file?.name.toLowerCase() || "";
    if (file && (lowerName.endsWith(".csv") || lowerName.endsWith(".xlsx"))) {
      setCsvFile(file);
    } else {
      onImportError?.("Please select a CSV or XLSX file");
      setCsvFile(null);
    }
  };

  const handleImport = async () => {
    if (!csvFile || !cycleName.trim()) {
      onImportError?.("Please select a file and enter a cycle name");
      return;
    }

    try {
      setLoading(true);
      let csvContent: string;

      if (csvFile.name.toLowerCase().endsWith(".xlsx")) {
        // Parse XLSX and keep only sheets that look like test-case sheets.
        const arrayBuffer = await csvFile.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const mergedRows: string[][] = [];
        const ignoredSheets: string[] = [];
        let headerIncluded = false;

        for (const sheetName of workbook.SheetNames) {
          const worksheet = workbook.Sheets[sheetName];
          const sheetRows = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            raw: false,
            defval: "",
          }) as unknown[][];

          if (!sheetRows.length) {
            ignoredSheets.push(sheetName);
            continue;
          }

          const headerRowIndex = findHeaderRowIndex(sheetRows);
          if (headerRowIndex === -1) {
            ignoredSheets.push(sheetName);
            continue;
          }

          const relevantRows = sheetRows
            .slice(headerRowIndex)
            .map((row) => row.map((cell) => String(cell ?? "").trim()));

          if (!relevantRows.length) {
            ignoredSheets.push(sheetName);
            continue;
          }

          if (!headerIncluded) {
            mergedRows.push(...relevantRows);
            headerIncluded = true;
          } else {
            mergedRows.push(...relevantRows.slice(1));
          }
        }

        if (mergedRows.length < 2) {
          const ignored = ignoredSheets.length ? ` Ignored sheets: ${ignoredSheets.join(", ")}.` : "";
          throw new Error(
            "No valid test-case sheet found in this XLSX file. Required columns: Test Case ID, Use Case/Scenario, Steps." +
              ignored
          );
        }

        csvContent = rowsToCsv(mergedRows);
      } else {
        // Read CSV file as text
        csvContent = await csvFile.text();
      }

      const response = await fetch("/api/v1/test-cases/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csvContent,
          cycleName: cycleName.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        onImportSuccess?.(data.data.cycleName, data.data.imported);
        setTimeout(() => {
          setIsOpen(false);
          setCsvFile(null);
          setCycleName("");
          setResult(null);
        }, 2000);
      } else {
        onImportError?.(data.error?.message || "Import failed");
        setResult(null);
      }
    } catch (error) {
      onImportError?.(error instanceof Error ? error.message : "Import failed");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-900/50 hover:bg-blue-900/70 text-blue-200 rounded-lg font-semibold transition-colors"
      >
        <HiArrowUp className="w-4 h-4" />
        Import Test Cases
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-8 animate-in fade-in zoom-in">
        <h3 className="text-lg font-bold text-white mb-6">Import Test Cases from CSV</h3>

        <div className="space-y-4">
          {/* Cycle Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Test Cycle Name</label>
            <input
              type="text"
              value={cycleName}
              onChange={(e) => setCycleName(e.target.value)}
              placeholder="e.g., HSA - Authentication"
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-400 mt-1">This cycle will be created if it doesn't exist</p>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">File</label>
            <label className="flex items-center justify-center px-4 py-6 bg-slate-800/50 border-2 border-dashed border-slate-700/50 rounded-lg cursor-pointer hover:border-blue-500/50 hover:bg-slate-800/70 transition-all">
              <div className="text-center">
                <HiArrowUp className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-300">
                  {csvFile ? csvFile.name : "Click to select or drag CSV/XLSX file"}
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            <p className="text-xs text-slate-400 mt-1">
              Supports CSV and XLSX formats. Must contain: Test Case ID, Use Case, Steps, Result columns
            </p>
          </div>

          {/* Result */}
          {result && (
            <div className="p-3 bg-green-900/30 border border-green-700/50 rounded-lg">
              <div className="flex items-start gap-2">
                <HiCheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-green-200 font-semibold">
                    Successfully imported {result.imported} test cases
                  </p>
                  {result.failed > 0 && (
                    <p className="text-green-300 text-xs mt-1">{result.failed} rows skipped</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <button
              onClick={() => {
                setIsOpen(false);
                setCsvFile(null);
                setCycleName("");
                setResult(null);
              }}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800 text-slate-300 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={loading || !csvFile || !cycleName.trim()}
              className="flex-1 px-4 py-2 bg-blue-900/50 hover:bg-blue-900/70 disabled:bg-slate-700 text-blue-200 disabled:text-slate-400 rounded-lg font-semibold transition-colors"
            >
              {loading ? "Importing..." : "Import"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
