"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  HiArrowLeft,
  HiTrash,
  HiShieldCheck,
  HiPlusCircle,
  HiUsers,
} from "react-icons/hi";
import { toast } from "sonner";
import AppButton from "@/app/components/common/AppButton";
import { PageSkeleton } from "@/app/components/common/SkeletonLoader";
import { getCurrentUser } from "@/app/actions/auth";
import {
  createUserAdminAction,
  getUsers,
  updateUserRoleAction,
  deleteUserAction,
  UserRole,
} from "@/app/actions/admin";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  createdAt: string;
}

export default function SuperAdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [authRole, setAuthRole] = useState<UserRole | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    const data = await getUsers();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    async function init() {
      const user = await getCurrentUser();
      if (!user) {
        window.location.href = "/login";
        return;
      }
      if (user.role !== "super_admin") {
        window.location.href = "/admin";
        return;
      }
      setAuthRole(user.role as UserRole);
      setCurrentUserId(user.id);
      await loadUsers();
    }
    init();
  }, []);

  const onRoleChange = async (userId: string, role: UserRole) => {
    const formData = new FormData();
    formData.set("userId", userId);
    formData.set("role", role);
    const result = await updateUserRoleAction(formData);
    if (result.success) {
      toast.success(result.message || "Role updated successfully");
    } else {
      toast.error(result.message || "Failed to update role");
    }
    await loadUsers();
  };

  const onCreateUser = async (formData: FormData) => {
    const result = await createUserAdminAction(formData);
    if (result.success) {
      toast.success(result.message || "Admin created successfully");
      await loadUsers();
      return;
    }

    toast.error(result.message || "Failed to create admin");
  };

  const onDeleteUser = async (userId: string, userName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete the account for "${userName}"? This action cannot be undone.`,
      )
    ) {
      return;
    }
    setDeleting(userId);
    const formData = new FormData();
    formData.set("userId", userId);
    const result = await deleteUserAction(formData);
    setDeleting(null);

    if (result.success) {
      toast.success(result.message || "User deleted successfully");
      await loadUsers();
      return;
    }

    toast.error(result.message || "Failed to delete user");
  };

  if (loading) {
    return <PageSkeleton variant="table" />;
  }

  return (
    <div className="min-h-screen">
      {/* Header - Constrained Width */}
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-8 animate-in fade-in duration-500">
        <div className="mx-auto w-full max-w-screen-2xl">
          <Link
            href="/"
            className="group mb-6 inline-flex items-center gap-2 text-sm text-(--muted-color) transition-all duration-300 hover:translate-x-1 hover:text-(--primary-color)"
          >
            <HiArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Dashboard</span>
          </Link>

          <div className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-linear-to-r from-emerald-50 to-teal-50 p-8 shadow-sm">
            <div className="absolute top-0 right-0 h-96 w-96 -translate-y-1/2 translate-x-1/2 rounded-full bg-linear-to-b from-emerald-200/20 to-transparent blur-3xl"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 rounded-lg bg-emerald-100">
                  <HiShieldCheck className="w-6 h-6 text-emerald-700" />
                </div>
                <h1 className="bg-linear-to-r from-emerald-700 to-teal-700 bg-clip-text text-4xl font-bold text-transparent">
                  Super Admin
                </h1>
              </div>
              <p className="text-sm text-(--muted-color) mb-4">
                Manage admins and control system access
              </p>
              {authRole && (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
                    {authRole.replace("_", " ").toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Constrained Width */}
      <div className="w-full px-4 sm:px-6 lg:px-8 pb-8">
        <div className="relative mx-auto w-full max-w-screen-2xl space-y-8">
          {/* Create Admin Form */}
          <div className="animate-in fade-in-up rounded-2xl border border-emerald-100 bg-(--surface) p-8 shadow-md duration-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-emerald-100">
                <HiPlusCircle className="w-5 h-5 text-emerald-700" />
              </div>
              <h2 className="text-xl font-bold text-(--heading-color)">
                Create New Admin
              </h2>
            </div>

            <form action={onCreateUser} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-(--text-color)">
                    Full Name
                  </label>
                  <input
                    name="name"
                    placeholder="Enter full name"
                    className="w-full rounded-lg border border-(--border-color) bg-(--surface-soft) px-4 py-3 text-(--text-color) placeholder:text-gray-400 transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-(--text-color)">
                    Email Address
                  </label>
                  <input
                    name="email"
                    type="email"
                    placeholder="Enter email address"
                    className="w-full rounded-lg border border-(--border-color) bg-(--surface-soft) px-4 py-3 text-(--text-color) placeholder:text-gray-400 transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-(--text-color)">
                    Phone Number
                  </label>
                  <input
                    name="phone"
                    placeholder="Enter phone number"
                    className="w-full rounded-lg border border-(--border-color) bg-(--surface-soft) px-4 py-3 text-(--text-color) placeholder:text-gray-400 transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-(--text-color)">
                    Password
                  </label>
                  <input
                    name="password"
                    type="password"
                    placeholder="Enter password"
                    className="w-full rounded-lg border border-(--border-color) bg-(--surface-soft) px-4 py-3 text-(--text-color) placeholder:text-gray-400 transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-(--text-color)">
                  User Role
                </label>
                <select
                  name="role"
                  className="w-full rounded-lg border border-(--border-color) bg-(--surface-soft) px-4 py-3 text-(--text-color) transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div className="pt-3">
                <AppButton
                  type="submit"
                  variant="primary"
                  className="w-full md:w-auto px-6 py-3 font-medium"
                >
                  Create Admin Account
                </AppButton>
              </div>
            </form>
          </div>

          {/* Users List */}
          <div className="animate-in fade-in-up rounded-2xl border border-emerald-100 bg-(--surface) shadow-md duration-500 overflow-hidden hover:shadow-lg transition-shadow">
            <div className="border-b border-emerald-100 bg-linear-to-r from-emerald-50/50 to-teal-50/50 p-8">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100">
                  <HiUsers className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-(--heading-color)">
                    Admin Users
                  </h2>
                  <p className="text-sm text-(--muted-color) mt-1">
                    {users.length} {users.length === 1 ? "admin" : "admins"} in
                    the system
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-emerald-100 bg-emerald-50/60">
                    <th className="py-4 px-6 text-left text-xs font-semibold uppercase tracking-wider text-emerald-900">
                      Name
                    </th>
                    <th className="py-4 px-6 text-left text-xs font-semibold uppercase tracking-wider text-emerald-900">
                      Email
                    </th>
                    <th className="py-4 px-6 text-left text-xs font-semibold uppercase tracking-wider text-emerald-900">
                      Current Role
                    </th>
                    <th className="py-4 px-6 text-left text-xs font-semibold uppercase tracking-wider text-emerald-900">
                      Change Role
                    </th>
                    <th className="py-4 px-6 text-left text-xs font-semibold uppercase tracking-wider text-emerald-900">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 px-6 text-center">
                        <p className="text-(--muted-color)">No users found</p>
                      </td>
                    </tr>
                  ) : (
                    users.map((user, idx) => (
                      <tr
                        key={user.id}
                        className={`border-b border-emerald-50 transition-colors duration-200 ${
                          idx % 2 === 0 ? "bg-white" : "bg-emerald-50/30"
                        } hover:bg-emerald-100/40`}
                      >
                        <td className="py-4 px-6 font-medium text-(--text-color)">
                          {user.name}
                        </td>
                        <td className="py-4 px-6 text-(--muted-color) break-all">
                          {user.email}
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                              user.role === "super_admin"
                                ? "border border-emerald-300 bg-emerald-100 text-emerald-800"
                                : "border border-blue-300 bg-blue-100 text-blue-800"
                            }`}
                          >
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${user.role === "super_admin" ? "bg-emerald-600" : "bg-blue-600"}`}
                            ></div>
                            {user.role === "super_admin"
                              ? "Super Admin"
                              : "Admin"}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <select
                            value={user.role}
                            onChange={(e) =>
                              onRoleChange(user.id, e.target.value as UserRole)
                            }
                            disabled={user.id === currentUserId}
                            className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-(--text-color) transition-all disabled:cursor-not-allowed disabled:opacity-50 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          >
                            <option value="admin">Admin</option>
                            <option value="super_admin">Super Admin</option>
                          </select>
                        </td>
                        <td className="py-4 px-6">
                          <AppButton
                            onClick={() => onDeleteUser(user.id, user.name)}
                            disabled={
                              user.id === currentUserId || deleting === user.id
                            }
                            variant="dangerSoft"
                            size="icon"
                            className="h-9 w-9 hover:shadow-md transition-shadow"
                            title={
                              user.id === currentUserId
                                ? "Cannot delete your own account"
                                : "Delete user account"
                            }
                          >
                            {deleting === user.id ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-200 border-t-red-600"></div>
                            ) : (
                              <HiTrash className="w-5 h-5" />
                            )}
                          </AppButton>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
