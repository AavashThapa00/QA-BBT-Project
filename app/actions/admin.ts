"use server";

import { backendJson } from "@/lib/backend/request";
import { getCurrentUser } from "@/app/actions/auth";

export type UserRole = "super_admin" | "admin";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  createdAt: string;
}

const isAdminRole = (role: UserRole | undefined) =>
  role === "admin" || role === "super_admin";
const isSuperAdmin = (role: UserRole | undefined) => role === "super_admin";

export async function getUsers(): Promise<AdminUser[]> {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) {
    return [];
  }

  try {
    return await backendJson<AdminUser[]>("/api/users", { method: "GET" });
  } catch {
    return [];
  }
}

export async function createUserAdminAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !isSuperAdmin(user.role)) {
    return { success: false, message: "Not authorized" };
  }

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const phone = String(formData.get("phone") || "").trim();
  const password = String(formData.get("password") || "").trim();
  const role = String(formData.get("role") || "admin") as UserRole;

  if (!name || !email || !password) {
    return {
      success: false,
      message: "Name, email, and password are required",
    };
  }

  try {
    await backendJson("/api/users", {
      method: "POST",
      body: JSON.stringify({ name, email, phone: phone || null, password, role }),
      headers: { "Content-Type": "application/json" },
    });
    return { success: true, message: "User created" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to create user",
    };
  }
}

export async function updateUserRoleAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !isSuperAdmin(user.role)) {
    return { success: false, message: "Not authorized" };
  }

  const userId = String(formData.get("userId") || "");
  const role = String(formData.get("role") || "admin") as UserRole;

  if (!userId) {
    return { success: false, message: "User is required" };
  }

  try {
    await backendJson(`/api/users/${userId}/role`, {
      method: "PUT",
      body: JSON.stringify({ role }),
      headers: { "Content-Type": "application/json" },
    });
    return { success: true, message: "Role updated" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update role",
    };
  }
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

  try {
    await backendJson(`/api/users/${userId}/password-reset`, {
      method: "PUT",
      body: JSON.stringify({ newPassword }),
      headers: { "Content-Type": "application/json" },
    });
    return { success: true, message: "Password reset" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to reset password",
    };
  }
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

  if (userId === user.id) {
    return { success: false, message: "Cannot delete your own account" };
  }

  try {
    await backendJson(`/api/users/${userId}`, {
      method: "DELETE",
    });
    return { success: true, message: "User account deleted successfully" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete user",
    };
  }
}
