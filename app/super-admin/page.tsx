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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8 overflow-hidden relative">
      <div className="fixed inset-0 opacity-30 -z-10">
        <div className="absolute top-20 left-1/4 w-80 h-80 bg-red-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-1/2 right-1/3 w-80 h-80 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 left-1/2 w-80 h-80 bg-orange-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-12 space-y-8">
        <div className="animate-in fade-in duration-500">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-rose-400 transition-all duration-300 transform hover:translate-x-1 mb-4 group"
          >
            <HiArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm">Back to Dashboard</span>
          </Link>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">Super Admin Panel</h1>
          <p className="text-slate-400 mt-2 text-sm">Create admins and manage access</p>
          {authRole && (
            <div className="mt-3">
              <span className="text-xs uppercase tracking-wide bg-gradient-to-r from-red-600/30 to-pink-600/30 border border-red-500/30 text-slate-200 px-3 py-1 rounded-full font-semibold">
                Role: {authRole.replace("_", " ")}
              </span>
            </div>
          )}
        </div>

        <div className="backdrop-blur-xl bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6 hover:shadow-2xl hover:shadow-rose-500/10 transition-all duration-300 animate-in fade-in-up duration-500">
          <h2 className="text-lg font-semibold bg-gradient-to-r from-rose-400 to-orange-400 bg-clip-text text-transparent">Create Admin</h2>
          <form action={onCreateUser} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="name" placeholder="Full name" className="bg-slate-800/50 border border-slate-700/50 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500/50 transition-all" required />
            <input name="email" type="email" placeholder="Email" className="bg-slate-800/50 border border-slate-700/50 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500/50 transition-all" required />
            <input name="phone" placeholder="Phone" className="bg-slate-800/50 border border-slate-700/50 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500/50 transition-all" />
            <input name="password" type="password" placeholder="Password" className="bg-slate-800/50 border border-slate-700/50 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500/50 transition-all" required />
            <select name="role" className="bg-slate-800/50 border border-slate-700/50 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500/50 transition-all">
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
            <button type="submit" className="bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white rounded-lg px-4 py-2 font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-rose-500/40 hover:scale-105 active:scale-95">
              Create Admin
            </button>
          </form>
          {createMessage && <p className="text-sm text-slate-300 mt-3 bg-slate-800/40 border border-slate-700/50 rounded-lg px-3 py-2 animate-in fade-in duration-300">{createMessage}</p>}
        </div>

        <div className="backdrop-blur-xl bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6 hover:shadow-2xl hover:shadow-rose-500/10 transition-all duration-300 animate-in fade-in-up duration-500">
          <h2 className="text-lg font-semibold bg-gradient-to-r from-rose-400 to-orange-400 bg-clip-text text-transparent">Users</h2>
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-700/50 bg-gradient-to-r from-rose-600/5 to-orange-600/5">
                  <th className="py-3 px-4 text-rose-300 text-xs uppercase tracking-wide">Name</th>
                  <th className="py-3 px-4 text-rose-300 text-xs uppercase tracking-wide">Email</th>
                  <th className="py-3 px-4 text-rose-300 text-xs uppercase tracking-wide">Role</th>
                  <th className="py-3 px-4 text-rose-300 text-xs uppercase tracking-wide">Change Role</th>
                  <th className="py-3 px-4 text-rose-300 text-xs uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-800/40 hover:bg-slate-800/50 transition-colors">
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
                        className="bg-slate-800/60 border border-slate-700/60 text-white rounded-lg px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500/50 transition-all"
                      >
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => onDeleteUser(user.id, user.name)}
                        disabled={user.id === currentUserId || deleting === user.id}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20 p-2 rounded-lg transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
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
          {message && <p className="text-sm text-slate-300 mt-3 bg-slate-800/40 border border-slate-700/50 rounded-lg px-3 py-2 animate-in fade-in duration-300">{message}</p>}
        </div>
      </div>
    </div>
  );
}
