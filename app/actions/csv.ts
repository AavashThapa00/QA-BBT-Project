"use server";

import { backendJson } from "@/lib/backend/request";
import { getCurrentUser } from "@/app/actions/auth";

export interface UploadError {
  row: number;
  reason: string;
}

export interface UploadResult {
  success: boolean;
  message: string;
  imported: number;
  skipped: number;
  errors: UploadError[];
  cycleName?: string;
}

export async function uploadCSV(
  csvContent: string,
  sourceName: string,
): Promise<UploadResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, message: "Not authenticated", imported: 0, skipped: 0, errors: [] };
  }

  if (!csvContent.trim() || !sourceName.trim()) {
    return { success: false, message: "File name and CSV content are required", imported: 0, skipped: 0, errors: [] };
  }

  try {
    const response = await backendJson<{
      cycleId: string;
      cycleName: string;
      imported: number;
      failed: number;
      errors: UploadError[];
    }>("/api/import/test-cases", {
      method: "POST",
      body: JSON.stringify({
        cycleName: sourceName,
        csvContent,
      }),
      headers: { "Content-Type": "application/json" },
    });

    return {
      success: true,
      message: "CSV uploaded successfully",
      imported: response.imported,
      skipped: response.failed,
      errors: response.errors || [],
      cycleName: response.cycleName,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to upload CSV",
      imported: 0,
      skipped: 0,
      errors: [],
    };
  }
}
