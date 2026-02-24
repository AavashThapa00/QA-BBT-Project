"use client";

import React, { useState, useRef } from "react";
import { HiCheckCircle, HiXCircle, HiClipboardList } from "react-icons/hi";
import { uploadCSV, UploadResult } from "@/app/actions/csv";
import Toast from "@/app/components/common/Toast";

interface CSVUploadProps {
  onUploadSuccess?: (result: UploadResult) => void;
  onUploadError?: (error: string) => void;
  onModulesSelected?: (modules: string[]) => void;
}

export default function CSVUpload({
  onUploadSuccess,
  onUploadError,
  onModulesSelected,
}: CSVUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [modulesInFile, setModulesInFile] = useState<string[]>([]);
  const [selectedModules, setSelectedModules] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      const error = "Please upload a CSV file";
      onUploadError?.(error);
      setResult(null);
      return;
    }

    setIsLoading(true);

    try {
      const text = await file.text();
      const uploadResult = await uploadCSV(text);
      setResult(uploadResult);

        // populate modules list if present
        if (uploadResult.modules && uploadResult.modules.length > 0) {
          setModulesInFile(uploadResult.modules);
          const sel: Record<string, boolean> = {};
          uploadResult.modules.forEach((m) => (sel[m] = false));
          setSelectedModules(sel);
        } else {
          setModulesInFile([]);
          setSelectedModules({});
        }

      if (uploadResult.success) {
        onUploadSuccess?.(uploadResult);
        setShowToast(true);
      } else {
        onUploadError?.(uploadResult.message);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      onUploadError?.(errorMessage);
      setResult(null);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center w-full">
        <label
          htmlFor="csv-upload"
          className="flex flex-col items-center justify-center w-full h-40 border-2 border-slate-700 border-dashed rounded-lg cursor-pointer bg-slate-800 hover:border-blue-600 hover:bg-slate-700 transition-all group"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg
              className="w-10 h-10 mb-4 text-slate-500 group-hover:text-blue-400 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="mb-2 text-sm">
              <span className="font-semibold text-white group-hover:text-blue-400 transition-colors">Click to upload</span>
              <span className="text-slate-400"> or drag and drop</span>
            </p>
            <p className="text-xs text-slate-500">CSV file from Google Sheets (max 50MB)</p>
          </div>
          <input
            ref={fileInputRef}
            id="csv-upload"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            disabled={isLoading}
            className="hidden"
          />
        </label>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center p-4 bg-blue-900/30 rounded-lg border border-blue-800">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-700 border-t-blue-500"></div>
          <span className="ml-3 text-blue-300 font-medium">Processing files...</span>
        </div>
      )}

      {showToast && result?.success && (
        <Toast 
          message="Successfully Uploaded the CSV File" 
          type="success" 
          duration={3000}
          onClose={() => setShowToast(false)}
        />
      )}

      {result && result.success && result.errors.length > 0 && (
        <div className={`p-4 rounded-xl border-2 bg-amber-900/30 border-amber-700`}>
          <div className="flex items-start gap-3">
            <div className={`text-xl mt-0.5 text-amber-400`}>
              ⚠️
            </div>
            <div className="flex-1">
              <div className={`font-semibold text-sm text-amber-200`}>
                Upload completed with {result.skipped} skipped row{result.skipped !== 1 ? 's' : ''}
              </div>
              <div className="mt-4">
                <p className="text-sm font-semibold text-amber-300 mb-2">
                  ⚠️ Skipped Defects ({result.errors.length} total):
                </p>
                <div className="bg-slate-800 rounded-lg border border-amber-800 max-h-64 overflow-y-auto">
                  <ul className="divide-y divide-amber-900">
                    {result.errors.map((error, index) => (
                      <li key={index} className="px-3 py-2 hover:bg-slate-700 transition-colors">
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-amber-400 text-xs mt-0.5 min-w-fit">Row {error.row}</span>
                          <span className="text-xs text-amber-300 flex-1">{error.reason}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="text-xs text-amber-400 mt-2 italic flex items-center gap-2">
                  <HiClipboardList className="w-4 h-4" />
                  <span>These defects were not imported (duplicates or validation issues)</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {result && !result.success && (
        <div className={`p-4 rounded-xl border-2 bg-red-900/30 border-red-800`}>
          <div className="flex items-start gap-3">
            <div className={`text-xl mt-0.5 text-red-400`}>
              <HiXCircle />
            </div>
            <div className="flex-1">
              <div className={`font-semibold text-sm text-red-200`}>
                {result.message}
              </div>
              {result.errors.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-red-300 mb-2">
                    ❌ Validation Errors ({result.errors.length} total):
                  </p>
                  <div className="bg-slate-800 rounded-lg border border-red-800 max-h-64 overflow-y-auto">
                    <ul className="divide-y divide-red-900">
                      {result.errors.map((error, index) => (
                        <li key={index} className="px-3 py-2 hover:bg-slate-700 transition-colors">
                          <div className="flex items-start gap-2">
                            <span className="font-bold text-red-400 text-xs mt-0.5 min-w-fit">Row {error.row}</span>
                            <span className="text-xs text-red-300 flex-1">{error.reason}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="text-xs text-red-400 mt-2 italic flex items-center gap-2">
                    <HiClipboardList className="w-4 h-4" />
                    <span>Review the errors above to fix your CSV and try uploading again</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
