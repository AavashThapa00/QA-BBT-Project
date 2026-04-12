"use client";

import React, { useState, useRef } from "react";
import { HiXCircle, HiClipboardList } from "react-icons/hi";
import { uploadCSV, UploadResult } from "@/app/actions/csv";
import Toast from "@/app/components/common/Toast";

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
  const [showToast, setShowToast] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
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
      const uploadResult = await uploadCSV(text, file.name);
      setResult(uploadResult);

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
          className="group flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-(--border-color) bg-(--surface-soft) transition-all hover:border-(--primary-color) hover:bg-emerald-50"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg
              className="mb-4 h-10 w-10 text-(--muted-color) transition-colors group-hover:text-(--primary-color)"
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
              <span className="font-semibold text-(--heading-color) transition-colors group-hover:text-(--primary-color)">
                Click to upload
              </span>
              <span className="text-(--muted-color)"> or drag and drop</span>
            </p>
            <p className="text-xs text-(--muted-color)">
              CSV file from Google Sheets (max 50MB)
            </p>
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
        <div className="flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-200 border-t-(--primary-color)"></div>
          <span className="ml-3 font-medium text-emerald-700">
            Processing files...
          </span>
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
        <div className={`rounded-xl border border-amber-200 bg-amber-50 p-4`}>
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 text-xl text-amber-600`}>⚠️</div>
            <div className="flex-1">
              <div className={`text-sm font-semibold text-amber-700`}>
                Upload completed with {result.skipped} skipped row
                {result.skipped !== 1 ? "s" : ""}
              </div>
              <div className="mt-4">
                <p className="mb-2 text-sm font-semibold text-amber-700">
                  ⚠️ Skipped Defects ({result.errors.length} total):
                </p>
                <div className="max-h-64 overflow-y-auto rounded-lg border border-amber-200 bg-white">
                  <ul className="divide-y divide-amber-100">
                    {result.errors.map((error, index) => (
                      <li
                        key={index}
                        className="px-3 py-2 transition-colors hover:bg-amber-50"
                      >
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5 min-w-fit text-xs font-bold text-amber-700">
                            Row {error.row}
                          </span>
                          <span className="flex-1 text-xs text-amber-800">
                            {error.reason}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="mt-2 flex items-center gap-2 text-xs italic text-amber-700">
                  <HiClipboardList className="w-4 h-4" />
                  <span>
                    These defects were not imported (duplicates or validation
                    issues)
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {result && !result.success && (
        <div className={`rounded-xl border border-rose-200 bg-rose-50 p-4`}>
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 text-xl text-rose-600`}>
              <HiXCircle />
            </div>
            <div className="flex-1">
              <div className={`text-sm font-semibold text-rose-700`}>
                {result.message}
              </div>
              {result.errors.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-sm font-semibold text-rose-700">
                    ❌ Validation Errors ({result.errors.length} total):
                  </p>
                  <div className="max-h-64 overflow-y-auto rounded-lg border border-rose-200 bg-white">
                    <ul className="divide-y divide-rose-100">
                      {result.errors.map((error, index) => (
                        <li
                          key={index}
                          className="px-3 py-2 transition-colors hover:bg-rose-50"
                        >
                          <div className="flex items-start gap-2">
                            <span className="mt-0.5 min-w-fit text-xs font-bold text-rose-700">
                              Row {error.row}
                            </span>
                            <span className="flex-1 text-xs text-rose-800">
                              {error.reason}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="mt-2 flex items-center gap-2 text-xs italic text-rose-700">
                    <HiClipboardList className="w-4 h-4" />
                    <span>
                      Review the errors above to fix your CSV and try uploading
                      again
                    </span>
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
