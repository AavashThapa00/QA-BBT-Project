"use server";

import { Collection } from "mongodb";
import { mongoCollections } from "@/lib/mongodb";
import { getCurrentUser } from "@/app/actions/auth";
import { DefectDoc } from "@/lib/mongo-defects";

interface UploadedFile {
  name: string;
  count: number;
  uploadedAt: string;
  uploadedBy: string;
}

const isAdminRole = (role?: string) =>
  role === "admin" || role === "super_admin";

const getDefectsCollection = async () =>
  (await mongoCollections.defects()) as unknown as Collection<DefectDoc>;

export async function getUploadedFiles(): Promise<UploadedFile[]> {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) {
    return [];
  }

  const defects = await getDefectsCollection();
  const result = await defects
    .aggregate<{
      _id: string;
      count: number;
      uploadedAt: Date | null;
      uploadedBy: string | null;
    }>([
      { $match: { sourceFile: { $ne: null } } },
      {
        $group: {
          _id: "$sourceFile",
          count: { $sum: 1 },
          uploadedAt: { $min: "$createdAt" },
          uploadedBy: { $max: "$uploadedBy" },
        },
      },
      { $sort: { uploadedAt: -1 } },
    ])
    .toArray();

  return result.map((row) => ({
    name: row._id,
    count: row.count,
    uploadedAt: (row.uploadedAt || new Date()).toISOString().split("T")[0],
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
    const defects = await getDefectsCollection();
    const result = await defects.deleteMany({ sourceFile: fileName });

    return {
      success: true,
      message: `Deleted ${result.deletedCount} defect(s) from ${fileName}`,
    };
  } catch (error) {
    console.error("Error deleting file data:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete file",
    };
  }
}
