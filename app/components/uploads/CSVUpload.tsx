"use client";

import React, { useState, useRef } from "react";
import { uploadCSV, UploadResult } from "@/app/actions/csv";

interface CSVUploadProps {
  onUploadSuccess?: (result: UploadResult) => void;
  onUploadError?: (error: string) => void;
}

export default function CSVUpload({
  onUploadSuccess,
  onUploadError,
}: CSVUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
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

      if (uploadResult.success) {
        onUploadSuccess?.(uploadResult);
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
          className="flex flex-col items-center justify-center w-full h-40 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-gradient-to-br from-slate-50 to-slate-100 hover:from-blue-50 hover:to-cyan-50 hover:border-blue-400 transition-all group"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg
              className="w-10 h-10 mb-4 text-slate-400 group-hover:text-blue-500 transition-colors"
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
              <span className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">Click to upload</span>
              <span className="text-slate-500"> or drag and drop</span>
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
        <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-200 border-t-blue-500"></div>
          <span className="ml-3 text-blue-700 font-medium">Processing files...</span>
        </div>
      )}

      {result && (
        <div className={`p-4 rounded-xl border-2 ${result.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
          <div className="flex items-start gap-3">
            <div className={`text-xl mt-0.5 ${result.success ? "text-green-600" : "text-red-600"}`}>
              {result.success ? "✓" : "✕"}
            </div>
            <div className="flex-1">
              <div className={`font-semibold text-sm ${result.success ? "text-green-900" : "text-red-900"}`}>
                {result.message}
              </div>
              {result.inserted > 0 && (
                <div className="text-green-700 text-sm mt-2 font-medium">
                  ✓ Successfully inserted {result.inserted} defect(s)
                </div>
              )}
              {result.skipped > 0 && (
                <div className="text-amber-700 text-sm mt-1 font-medium">
                  ⚠ Skipped {result.skipped} row(s)
                </div>
              )}
              {result.errors.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-red-800 mb-2">
                    ❌ Validation Errors ({result.errors.length} total):
                  </p>
                  <div className="bg-white rounded-lg border border-red-200 max-h-64 overflow-y-auto">
                    <ul className="divide-y divide-red-100">
                      {result.errors.map((error, index) => (
                        <li key={index} className="px-3 py-2 hover:bg-red-50 transition-colors">
                          <div className="flex items-start gap-2">
                            <span className="font-bold text-red-700 text-xs mt-0.5 min-w-fit">Row {error.row}</span>
                            <span className="text-xs text-red-700 flex-1">{error.reason}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="text-xs text-red-600 mt-2 italic">
                    📋 Review the errors above to fix your CSV and try uploading again
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
