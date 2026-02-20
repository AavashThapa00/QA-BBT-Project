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
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg
              className="w-8 h-8 mb-4 text-gray-500"
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
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Click to upload</span> or drag and
              drop
            </p>
            <p className="text-xs text-gray-500">CSV file from Google Sheets</p>
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
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Uploading...</span>
        </div>
      )}

      {result && (
        <div className={`p-4 rounded-lg ${result.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
          <div
            className={`font-semibold ${result.success ? "text-green-800" : "text-red-800"}`}
          >
            {result.message}
          </div>
          {result.inserted > 0 && (
            <div className="text-green-700 text-sm mt-1">
              ✓ Successfully inserted {result.inserted} defect(s)
            </div>
          )}
          {result.skipped > 0 && (
            <div className="text-yellow-700 text-sm mt-1">
              ⚠ Skipped {result.skipped} row(s)
            </div>
          )}
          {result.errors.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-semibold text-red-700">
                Errors (showing first 10):
              </p>
              <ul className="mt-2 space-y-1 text-sm text-red-700 max-h-40 overflow-y-auto">
                {result.errors.map((error, index) => (
                  <li key={index} className="text-xs">
                    Row {error.row}: {error.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
