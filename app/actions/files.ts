"use server";

import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/app/actions/auth";

interface UploadedFile {
  name: string;
  count: number;
  uploadedAt: string;
  uploadedBy: string;
}

const isAdminRole = (role?: string) => role === "admin" || role === "super_admin";

export async function getUploadedFiles(): Promise<UploadedFile[]> {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) {
    return [];
  }

  const result = await db.query(
    `SELECT "sourceFile", COUNT(*) as count, MIN("createdAt") as "uploadedAt", MAX("uploadedBy") as "uploadedBy"
     FROM defect
     WHERE "sourceFile" IS NOT NULL
     GROUP BY "sourceFile"
     ORDER BY MIN("createdAt") DESC`
  );

  return result.rows.map((row) => ({
    name: row.sourceFile,
    count: parseInt(row.count, 10),
    uploadedAt: new Date(row.uploadedAt).toISOString().split("T")[0],
    uploadedBy: row.uploadedBy || "Unknown",
  }));
}

export async function deleteFileData(fileName: string) {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) {
    return { success: false, message: "Not authorized" };
  }

  if (!fileName) {
    return { success: false, message: "File name is required" };
  }

  try {
    const result = await db.query(
      `DELETE FROM defect WHERE "sourceFile" = $1`,
      [fileName]
    );

    return {
      success: true,
      message: `Deleted ${result.rowCount} defect(s) from ${fileName}`,
    };
  } catch (error) {
    console.error("Error deleting file data:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete file",
    };
  }
}
