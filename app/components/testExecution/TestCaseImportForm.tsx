"use client";

import React, { useState, useRef } from "react";
import { HiArrowUp, HiCheckCircle } from "react-icons/hi";
import * as XLSX from "xlsx";
import AppButton from "@/app/components/common/AppButton";

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

  const hasId = headers.some(
    (h) => h.includes("test case id") || h === "id" || h.includes("tc id"),
  );
  const hasTitle = headers.some(
    (h) =>
      h.includes("use case") ||
      h.includes("scenario") ||
      h.includes("description"),
  );
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

export default function TestCaseImportForm({
  onImportSuccess,
  onImportError,
}: TestCaseImportProps) {
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
          const ignored = ignoredSheets.length
            ? ` Ignored sheets: ${ignoredSheets.join(", ")}.`
            : "";
          throw new Error(
            "No valid test-case sheet found in this XLSX file. Required columns: Test Case ID, Use Case/Scenario, Steps." +
              ignored,
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
      <AppButton onClick={() => setIsOpen(true)} variant="primary">
        <HiArrowUp className="w-4 h-4" />
        Import Test Cases
      </AppButton>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-emerald-100 bg-white p-8 shadow-xl animate-in fade-in zoom-in">
        <h3 className="mb-6 text-lg font-bold text-(--heading-color)">
          Import Test Cases from CSV
        </h3>

        <div className="space-y-4">
          {/* Cycle Name */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-(--heading-color)">
              Test Cycle Name
            </label>
            <input
              type="text"
              value={cycleName}
              onChange={(e) => setCycleName(e.target.value)}
              placeholder="e.g., HSA - Authentication"
              className="w-full rounded-lg border border-emerald-200 bg-emerald-50/40 px-3 py-2 text-sm text-(--text-color) focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="mt-1 text-xs text-(--muted-color)">
              This cycle will be created if it doesn't exist
            </p>
          </div>

          {/* File Upload */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-(--heading-color)">
              File
            </label>
            <label className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-emerald-300 bg-emerald-50/50 px-4 py-6 transition-all hover:border-emerald-500 hover:bg-emerald-100/50">
              <div className="text-center">
                <HiArrowUp className="mx-auto mb-2 h-8 w-8 text-emerald-700" />
                <p className="text-sm text-(--text-color)">
                  {csvFile
                    ? csvFile.name
                    : "Click to select or drag CSV/XLSX file"}
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
            <p className="mt-1 text-xs text-(--muted-color)">
              Supports CSV and XLSX formats. Must contain: Test Case ID, Use
              Case, Steps, Result columns
            </p>
          </div>

          {/* Result */}
          {result && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <div className="flex items-start gap-2">
                <HiCheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <div className="text-sm">
                  <p className="font-semibold text-emerald-700">
                    Successfully imported {result.imported} test cases
                  </p>
                  {result.failed > 0 && (
                    <p className="mt-1 text-xs text-emerald-700/80">
                      {result.failed} rows skipped
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <AppButton
              onClick={() => {
                setIsOpen(false);
                setCsvFile(null);
                setCycleName("");
                setResult(null);
              }}
              disabled={loading}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </AppButton>
            <AppButton
              onClick={handleImport}
              disabled={loading || !csvFile || !cycleName.trim()}
              variant="primary"
              className="flex-1"
            >
              {loading ? "Importing..." : "Import"}
            </AppButton>
          </div>
        </div>
      </div>
    </div>
  );
}
