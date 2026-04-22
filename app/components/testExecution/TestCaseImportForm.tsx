"use client";

import React, { useEffect, useState, useRef } from "react";
import { HiArrowUp, HiCheckCircle } from "react-icons/hi";
import * as XLSX from "xlsx";
import AppButton from "@/app/components/common/AppButton";
import { TestCycle } from "@/lib/testCaseTypes";

interface TestCaseImportProps {
  onImportSuccess?: (cycleName: string, imported: number) => void;
  onImportError?: (error: string) => void;
  cycleNodes?: TestCycle[];
  defaultParentId?: string;
  defaultCycleName?: string;
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
  cycleNodes = [],
  defaultParentId = "",
  defaultCycleName = "",
}: TestCaseImportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [cycleName, setCycleName] = useState("");
  const [parentId, setParentId] = useState("");
  const [moduleName, setModuleName] = useState("");
  const [sectionName, setSectionName] = useState("");
  const [loading, setLoading] = useState(false);
  const [publicImportLoading, setPublicImportLoading] = useState(false);
  const [publicWorkbookFileName, setPublicWorkbookFileName] =
    useState("HSA.xlsx");
  const [result, setResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setParentId(defaultParentId || "");
  }, [defaultParentId]);

  useEffect(() => {
    if (!defaultCycleName) return;
    setCycleName(defaultCycleName);
  }, [defaultCycleName]);

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

      const response = await fetch("/backend/v1/test-cases/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csvContent,
          cycleName: cycleName.trim(),
          parentId: parentId || null,
          moduleName: moduleName.trim() || null,
          sectionName: sectionName.trim() || null,
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
          setParentId("");
          setModuleName("");
          setSectionName("");
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

  const handleImportPublicWorkbook = async () => {
    try {
      setPublicImportLoading(true);

      const response = await fetch(
        "/backend/v1/test-cases/import-public-workbook",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: publicWorkbookFileName.trim() || "HSA.xlsx",
            cycleName: "Test Cycle 1",
          }),
        },
      );

      const data = await response.json();
      if (!data.success) {
        onImportError?.(data.error?.message || "Workbook import failed");
        return;
      }

      setResult(data.data);
      onImportSuccess?.(data.data.cycleName, data.data.imported);
    } catch (error) {
      onImportError?.(
        error instanceof Error ? error.message : "Workbook import failed",
      );
    } finally {
      setPublicImportLoading(false);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center overlay-backdrop p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-emerald-100 bg-white p-8 shadow-xl animate-in fade-in zoom-in">
        <h3 className="mb-6 text-lg font-bold text-(--heading-color)">
          Import Test Cases from CSV/XLSX
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
              This cycle will be created under the selected folder (if any)
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-(--heading-color)">
              Parent Folder (Optional)
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full rounded-lg border border-emerald-200 bg-emerald-50/40 px-3 py-2 text-sm text-(--text-color) focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">No parent (root)</option>
              {cycleNodes
                .filter((node) => (node.kind ?? "cycle") === "folder")
                .map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-(--heading-color)">
              Parent Section (Optional)
            </label>
            <input
              type="text"
              value={moduleName}
              onChange={(e) => setModuleName(e.target.value)}
              placeholder="e.g., Authentication / Discover / Challenges / Dojos"
              className="w-full rounded-lg border border-emerald-200 bg-emerald-50/40 px-3 py-2 text-sm text-(--text-color) focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-(--heading-color)">
              Test Case Heading (Optional)
            </label>
            <input
              type="text"
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
              placeholder="e.g., Login Test Cases"
              className="w-full rounded-lg border border-emerald-200 bg-emerald-50/40 px-3 py-2 text-sm text-(--text-color) focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
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
                  {result.fileName && (
                    <p className="mt-1 text-xs text-emerald-700/80">
                      Workbook: {result.fileName} → {result.rootFolderName} /{" "}
                      {result.cycleName}
                    </p>
                  )}
                  {result.failed > 0 && (
                    <p className="mt-1 text-xs text-emerald-700/80">
                      {result.failed} rows skipped
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
            <p className="text-xs text-(--muted-color)">
              One-click option: import a workbook from public/. Root folder is
              auto-created from workbook name (for example, HSA.xlsx → HSA),
              then seed into Test Cycle 1 with mapped scopes.
            </p>
            <input
              type="text"
              value={publicWorkbookFileName}
              onChange={(e) => setPublicWorkbookFileName(e.target.value)}
              placeholder="Workbook in public folder (e.g., HSA.xlsx)"
              className="mt-3 w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-(--text-color) focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <AppButton
              onClick={handleImportPublicWorkbook}
              disabled={
                loading ||
                publicImportLoading ||
                !publicWorkbookFileName.trim().toLowerCase().endsWith(".xlsx")
              }
              variant="secondary"
              className="mt-3 w-full"
            >
              {publicImportLoading
                ? "Importing public workbook..."
                : `Import from public/${publicWorkbookFileName.trim() || "HSA.xlsx"}`}
            </AppButton>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <AppButton
              onClick={() => {
                setIsOpen(false);
                setCsvFile(null);
                setCycleName("");
                setParentId("");
                setSectionName("");
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
              disabled={
                loading || publicImportLoading || !csvFile || !cycleName.trim()
              }
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
