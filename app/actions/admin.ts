"use server";

import { db } from "@/lib/prisma";
import { getCurrentUser, createUser } from "@/app/actions/auth";
import { randomBytes, scryptSync } from "crypto";

export type UserRole = "super_admin" | "admin";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  createdAt: string;
}

const isAdminRole = (role: UserRole | undefined) => role === "admin" || role === "super_admin";
const isSuperAdmin = (role: UserRole | undefined) => role === "super_admin";
const normalizeRole = (role?: string): UserRole => (role === "super_admin" ? "super_admin" : "admin");

const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
};

export async function getUsers(): Promise<AdminUser[]> {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) {
    return [];
  }

  const result = await db.query(
    `SELECT id, name, email, phone, role, "createdAt"
     FROM "user"
     ORDER BY "createdAt" DESC`
  );

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: normalizeRole(row.role),
    createdAt: row.createdAt.toISOString().split("T")[0],
  }));
}

export async function createUserAdminAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !isSuperAdmin(user.role)) {
    return { success: false, message: "Not authorized" };
  }

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const phone = String(formData.get("phone") || "").trim();
  const password = String(formData.get("password") || "").trim();
  const role = normalizeRole(String(formData.get("role") || "admin"));

  if (!name || !email || !password) {
    return { success: false, message: "Name, email, and password are required" };
  }

  try {
    await createUser({ name, email, phone, password, role });
    return { success: true, message: "User created" };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to create user" };
  }
}

export async function updateUserRoleAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !isSuperAdmin(user.role)) {
    return { success: false, message: "Not authorized" };
  }

  const userId = String(formData.get("userId") || "");
  const role = normalizeRole(String(formData.get("role") || "admin"));

  if (!userId) {
    return { success: false, message: "User is required" };
  }

  await db.query(`UPDATE "user" SET role = $1, "updatedAt" = NOW() WHERE id = $2`, [role, userId]);
  return { success: true, message: "Role updated" };
}

export async function resetUserPasswordAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !isSuperAdmin(user.role)) {
    return { success: false, message: "Not authorized" };
  }

  const userId = String(formData.get("userId") || "");
  const newPassword = String(formData.get("newPassword") || "");

  if (!userId || !newPassword) {
    return { success: false, message: "User and password are required" };
  }

  const newHash = hashPassword(newPassword);
  await db.query(`UPDATE "user" SET password_hash = $1, "updatedAt" = NOW() WHERE id = $2`, [newHash, userId]);
  return { success: true, message: "Password reset" };
}

export async function deleteUserAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !isSuperAdmin(user.role)) {
    return { success: false, message: "Not authorized" };
  }

  const userId = String(formData.get("userId") || "");

  if (!userId) {
    return { success: false, message: "User ID is required" };
  }

  // Prevent deleting yourself
  if (userId === user.id) {
    return { success: false, message: "Cannot delete your own account" };
  }

  try {
    await db.query(`DELETE FROM "user" WHERE id = $1`, [userId]);
    return { success: true, message: "User account deleted successfully" };
  } catch (error) {
    return { success: false, message: "Failed to delete user" };
  }
}
