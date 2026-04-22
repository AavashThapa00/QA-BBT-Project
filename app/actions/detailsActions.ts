"use server";

import { backendJson } from "@/lib/backend/request";
import { Defect } from "@/lib/types";

export async function getDefectById(id: string): Promise<Defect | null> {
  if (!id) return null;

  try {
    return await backendJson<Defect>(`/api/defects/${encodeURIComponent(id)}`, {
      method: "GET",
    });
  } catch {
    return null;
  }
}

export async function getAllDefectsSorted(): Promise<Defect[]> {
  try {
    const response = await backendJson<{ items: Defect[] }>("/api/defects?page=1&pageSize=1000&sortBy=date&sortOrder=desc", {
      method: "GET",
    });
    return response.items || [];
  } catch {
    return [];
  }
}

export async function deleteDefectById(
  id: string,
): Promise<{ success: boolean; message: string }> {
  if (!id) {
    return { success: false, message: "Defect ID is required" };
  }

  try {
    await backendJson(`/api/defects/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    return { success: true, message: "Issue removed successfully" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to remove issue",
    };
  }
}
