"use server";

import { backendJson } from "@/lib/backend/request";
import { getCurrentUser } from "@/app/actions/auth";

interface UploadedFile {
  fileName: string;
  defectCount: number;
  uploadedBy?: string;
  uploadedAt?: string;
}

export async function getUploadedFiles(): Promise<UploadedFile[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  try {
    return await backendJson<UploadedFile[]>("/api/files", { method: "GET" });
  } catch {
    return [];
  }
}

export async function deleteFileData(fileName: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, message: "Not authenticated" };
  }

  if (!fileName.trim()) {
    return { success: false, message: "File name is required" };
  }

  try {
    const data = await backendJson<{ fileName: string; defectsDeleted: number }>(
      `/api/files/${encodeURIComponent(fileName)}`,
      { method: "DELETE" },
    );

    return {
      success: true,
      message: `Deleted ${data.defectsDeleted} defects from ${data.fileName}`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete file",
    };
  }
}
