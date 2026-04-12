"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HiArrowLeft } from "react-icons/hi";
import AppButton from "@/app/components/common/AppButton";
import { getCurrentUser } from "@/app/actions/auth";
import {
  createUserAdminAction,
  getUsers,
  resetUserPasswordAction,
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

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [authRole, setAuthRole] = useState<UserRole | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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
      if (user.role !== "admin" && user.role !== "super_admin") {
        window.location.href = "/profile";
        return;
      }
      setAuthRole(user.role as UserRole);
      await loadUsers();
    }
    init();
  }, []);

  const onCreateUser = async (formData: FormData) => {
    const result = await createUserAdminAction(formData);
    setMessage(result.message);
    await loadUsers();
  };

  const onResetPassword = async (userId: string) => {
    const newPassword = prompt("Enter new password");
    if (!newPassword) return;
    const formData = new FormData();
    formData.set("userId", userId);
    formData.set("newPassword", newPassword);
    const result = await resetUserPasswordAction(formData);
    setMessage(result.message);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-(--page-background) p-8">
        <div className="flex items-center justify-center h-96">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-emerald-200 border-t-(--primary-color)"></div>
        </div>
      </div>
    );
  }

  if (!authRole) {
    return null;
  }

  return (
    <div className="min-h-screen bg-(--page-background) p-4 sm:p-6 lg:p-8">
      <div className="relative mx-auto w-full max-w-425 space-y-6">
        <div className="animate-in fade-in duration-500">
          <Link
            href="/"
            className="group mb-3 inline-flex items-center gap-2 text-sm text-(--muted-color) transition-all duration-300 hover:translate-x-1 hover:text-(--primary-color)"
          >
            <HiArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Dashboard</span>
          </Link>
          <h1 className="text-3xl font-bold text-(--heading-color)">
            Admin Panel
          </h1>
          <p className="mt-2 text-sm text-(--muted-color)">
            View users and access overview
          </p>
          <div className="mt-3">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Role: {authRole.replace("_", " ")}
            </span>
          </div>
        </div>

        {authRole === "super_admin" ? (
          <div className="animate-in fade-in-up rounded-2xl border border-(--border-color) bg-(--surface) p-6 shadow-sm duration-500">
            <h2 className="text-lg font-semibold text-(--heading-color)">
              Create Admin
            </h2>
            <form
              action={onCreateUser}
              className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <input
                name="name"
                placeholder="Full name"
                className="rounded-lg border border-(--border-color) bg-(--surface-soft) px-3 py-2 text-(--text-color) transition-all focus:border-(--primary-color) focus:outline-none focus:ring-2 focus:ring-(--primary-color)/20"
                required
              />
              <input
                name="email"
                type="email"
                placeholder="Email"
                className="rounded-lg border border-(--border-color) bg-(--surface-soft) px-3 py-2 text-(--text-color) transition-all focus:border-(--primary-color) focus:outline-none focus:ring-2 focus:ring-(--primary-color)/20"
                required
              />
              <input
                name="phone"
                placeholder="Phone"
                className="rounded-lg border border-(--border-color) bg-(--surface-soft) px-3 py-2 text-(--text-color) transition-all focus:border-(--primary-color) focus:outline-none focus:ring-2 focus:ring-(--primary-color)/20"
              />
              <input
                name="password"
                type="password"
                placeholder="Password"
                className="rounded-lg border border-(--border-color) bg-(--surface-soft) px-3 py-2 text-(--text-color) transition-all focus:border-(--primary-color) focus:outline-none focus:ring-2 focus:ring-(--primary-color)/20"
                required
              />
              <select
                name="role"
                className="rounded-lg border border-(--border-color) bg-(--surface-soft) px-3 py-2 text-(--text-color) transition-all focus:border-(--primary-color) focus:outline-none focus:ring-2 focus:ring-(--primary-color)/20"
              >
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
              <AppButton type="submit" variant="primary" className="px-4 py-2">
                Create Admin
              </AppButton>
            </form>
            {message && (
              <p className="mt-3 animate-in fade-in rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 duration-300">
                {message}
              </p>
            )}
          </div>
        ) : (
          <div className="animate-in fade-in-up rounded-2xl border border-(--border-color) bg-(--surface) p-6 shadow-sm duration-500">
            <h2 className="text-lg font-semibold text-(--heading-color)">
              Access Level
            </h2>
            <p className="mt-2 text-sm text-(--muted-color)">
              Admin accounts have view-only access. User creation and password
              resets are available to super admins.
            </p>
          </div>
        )}

        <div className="animate-in fade-in-up rounded-2xl border border-(--border-color) bg-(--surface) p-6 shadow-sm duration-500">
          <h2 className="text-lg font-semibold text-(--heading-color)">
            Users
          </h2>
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-emerald-100 bg-emerald-50/60">
                  <th className="px-4 py-3 text-xs uppercase tracking-wide text-(--heading-color)">
                    Name
                  </th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wide text-(--heading-color)">
                    Email
                  </th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wide text-(--heading-color)">
                    Role
                  </th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wide text-(--heading-color)">
                    Phone
                  </th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wide text-(--heading-color)">
                    Created
                  </th>
                  {authRole === "super_admin" && (
                    <th className="px-4 py-3 text-xs uppercase tracking-wide text-(--heading-color)">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-emerald-50 transition-colors hover:bg-emerald-50/40"
                  >
                    <td className="px-4 py-3 text-(--text-color)">
                      {user.name}
                    </td>
                    <td className="px-4 py-3 text-(--text-color)">
                      {user.email}
                    </td>
                    <td className="px-4 py-3 text-(--text-color)">
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-(--text-color)">
                      {user.phone || "-"}
                    </td>
                    <td className="px-4 py-3 text-(--text-color)">
                      {user.createdAt}
                    </td>
                    {authRole === "super_admin" && (
                      <td className="px-4 py-3">
                        <AppButton
                          type="button"
                          onClick={() => onResetPassword(user.id)}
                          variant="secondary"
                          size="sm"
                        >
                          Reset Password
                        </AppButton>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
