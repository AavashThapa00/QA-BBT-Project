"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HiArrowLeft, HiTrash } from "react-icons/hi";
import { getCurrentUser } from "@/app/actions/auth";
import { createUserAdminAction, getUsers, updateUserRoleAction, deleteUserAction, UserRole } from "@/app/actions/admin";

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
  const [message, setMessage] = useState<string | null>(null);
  const [createMessage, setCreateMessage] = useState<string | null>(null);
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
    setMessage(result.message);
    await loadUsers();
  };

  const onCreateUser = async (formData: FormData) => {
    const result = await createUserAdminAction(formData);
    setCreateMessage(result.message);
    await loadUsers();
  };

  const onDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete the account for "${userName}"? This action cannot be undone.`)) {
      return;
    }
    setDeleting(userId);
    const formData = new FormData();
    formData.set("userId", userId);
    const result = await deleteUserAction(formData);
    setMessage(result.message);
    setDeleting(null);
    if (result.success) {
      await loadUsers();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-8">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-700 border-t-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
          >
            <HiArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Dashboard</span>
          </Link>
          <h1 className="text-3xl font-bold text-white">Super Admin Panel</h1>
          <p className="text-slate-400 mt-1">Create admins and manage access</p>
          {authRole && (
            <div className="mt-3">
              <span className="text-xs uppercase tracking-wide bg-slate-800 text-slate-200 px-2 py-1 rounded">
                Role: {authRole.replace("_", " ")}
              </span>
            </div>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white">Create Admin</h2>
          <form action={onCreateUser} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="name" placeholder="Full name" className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2" required />
            <input name="email" type="email" placeholder="Email" className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2" required />
            <input name="phone" placeholder="Phone" className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2" />
            <input name="password" type="password" placeholder="Password" className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2" required />
            <select name="role" className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2">
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 font-semibold">
              Create Admin
            </button>
          </form>
          {createMessage && <p className="text-sm text-slate-300 mt-3">{createMessage}</p>}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white">Users</h2>
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="py-3 px-4 text-slate-300">Name</th>
                  <th className="py-3 px-4 text-slate-300">Email</th>
                  <th className="py-3 px-4 text-slate-300">Role</th>
                  <th className="py-3 px-4 text-slate-300">Change Role</th>
                  <th className="py-3 px-4 text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-800 hover:bg-slate-800">
                    <td className="py-3 px-4 text-white">{user.name}</td>
                    <td className="py-3 px-4 text-white">{user.email}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        user.role === "super_admin" 
                          ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" 
                          : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      }`}>
                        {user.role === "super_admin" ? "Super Admin" : "Admin"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={user.role}
                        onChange={(e) => onRoleChange(user.id, e.target.value as UserRole)}
                        disabled={user.id === currentUserId}
                        className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => onDeleteUser(user.id, user.name)}
                        disabled={user.id === currentUserId || deleting === user.id}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        title={user.id === currentUserId ? "Cannot delete your own account" : "Delete user account"}
                      >
                        <HiTrash className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {message && <p className="text-sm text-slate-300 mt-3">{message}</p>}
        </div>
      </div>
    </div>
  );
}
