"use server";

import { backendJson } from "@/lib/backend/request";
import { Defect } from "@/lib/types";
import { getDefects } from "./defects";

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
    const firstPage = await getDefects(undefined, {
      page: 1,
      pageSize: 200,
      sortBy: "date",
      sortOrder: "desc",
    });

    if (firstPage.totalPages <= 1) {
      return firstPage.defects;
    }

    const defects = [...firstPage.defects];

    for (let page = 2; page <= firstPage.totalPages; page++) {
      const nextPage = await getDefects(undefined, {
        page,
        pageSize: 200,
        sortBy: "date",
        sortOrder: "desc",
      });
      defects.push(...nextPage.defects);
    }

    return defects;
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
