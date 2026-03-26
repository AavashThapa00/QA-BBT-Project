"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HiArrowLeft, HiTrash, HiCheckCircle } from "react-icons/hi";
import { getCurrentUser, updateProfileAction, changePasswordAction } from "@/app/actions/auth";
import { getUploadedFiles, deleteFileData } from "@/app/actions/files";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "super_admin" | "admin";
}

interface UploadedFile {
  name: string;
  count: number;
  uploadedAt: string;
  uploadedBy: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      setLoading(true);
      const current = await getCurrentUser();
      setUser(current);
      if (current && (current.role === "admin" || current.role === "super_admin")) {
        const files = await getUploadedFiles();
        setUploadedFiles(files);
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-8">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-700 border-t-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 p-8">
        <div className="max-w-lg mx-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-white">Not signed in</h1>
            <p className="text-slate-400 mt-3 text-sm">Please sign in to view your profile.</p>
            <Link
              href="/login"
              className="inline-flex mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const onUpdateProfile = async (formData: FormData) => {
    const result = await updateProfileAction(formData);
    setProfileMessage(result.message);
    const current = await getCurrentUser();
    setUser(current);
  };

  const onChangePassword = async (formData: FormData) => {
    const result = await changePasswordAction(formData);
    setPasswordMessage(result.message);
  };

  const onDeleteFile = async (fileName: string) => {
    if (!confirm(`Delete all defects from "${fileName}"? This cannot be undone.`)) {
      return;
    }
    setDeleting(fileName);
    const result = await deleteFileData(fileName);
    setDeleteMessage(result.message);
    if (result.success) {
      setUploadedFiles(uploadedFiles.filter((f) => f.name !== fileName));
    }
    setDeleting(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden relative">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-30 -z-10">
        <div className="absolute top-20 left-1/4 w-80 h-80 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-1/2 right-1/3 w-80 h-80 bg-violet-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 left-1/2 w-80 h-80 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-12 py-6 lg:py-10 relative">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-purple-400 transition-all duration-300 transform hover:translate-x-1 mb-10 text-sm group animate-in fade-in duration-500"
        >
          <HiArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>

  {/* Profile Header */}
  <div className="mb-10 animate-in fade-in-up duration-500">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">{user.name}</h1>
              <p className="text-slate-400 mt-1 text-base">{user.email}</p>
            </div>
            <span className="text-purple-300 text-sm font-medium px-4 py-2 bg-gradient-to-r from-purple-600/30 to-indigo-600/30 rounded-full border border-purple-500/30 font-semibold">
              {user.role === "super_admin" ? "Super Admin" : "Admin"}
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10 animate-in fade-in-up duration-500 delay-100">
          {/* Profile Details Card */}
          <div className="backdrop-blur-xl bg-slate-900/50 border border-slate-800/50 rounded-2xl p-8 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300">
            <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent mb-6">Profile Details</h2>
            <form action={onUpdateProfile} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                <input
                  name="name"
                  type="text"
                  defaultValue={user.name}
                  required
                  className="w-full bg-slate-800/50 border border-slate-700/50 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/50 transition-all duration-300 backdrop-blur-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                <input
                  name="email"
                  type="email"
                  defaultValue={user.email}
                  required
                  className="w-full bg-slate-800/50 border border-slate-700/50 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/50 transition-all duration-300 backdrop-blur-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number</label>
                <input
                  name="phone"
                  type="tel"
                  defaultValue={user.phone || ""}
                  className="w-full bg-slate-800/50 border border-slate-700/50 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/50 transition-all duration-300 backdrop-blur-sm"
                />
              </div>
              {profileMessage && (
                <div className="flex items-center gap-2 p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-lg text-sm text-emerald-300 animate-in fade-in duration-300">
                  <HiCheckCircle className="w-4 h-4 flex-shrink-0" />
                  {profileMessage}
                </div>
              )}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white py-3 rounded-lg font-semibold text-sm transition-all duration-300 transform hover:shadow-lg hover:shadow-purple-500/50 hover:scale-105 active:scale-95"
              >
                Save Changes
              </button>
            </form>
          </div>

          {/* Security Card */}
          <div className="backdrop-blur-xl bg-slate-900/50 border border-slate-800/50 rounded-2xl p-8 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300">
            <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent mb-6">Change Password</h2>
            <form action={onChangePassword} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Current Password</label>
                <input
                  name="currentPassword"
                  type="password"
                  required
                  className="w-full bg-slate-800/50 border border-slate-700/50 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/50 transition-all duration-300 backdrop-blur-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
                <input
                  name="newPassword"
                  type="password"
                  required
                  className="w-full bg-slate-800/50 border border-slate-700/50 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/50 transition-all duration-300 backdrop-blur-sm"
                />
              </div>
              {passwordMessage && (
                <div className="flex items-center gap-2 p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-lg text-sm text-emerald-300 animate-in fade-in duration-300">
                  <HiCheckCircle className="w-4 h-4 flex-shrink-0" />
                  {passwordMessage}
                </div>
              )}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white py-3 rounded-lg font-semibold text-sm transition-all duration-300 transform hover:shadow-lg hover:shadow-purple-500/50 hover:scale-105 active:scale-95"
              >
                Update Password
              </button>
            </form>
          </div>
        </div>

        {/* Admin Management Section (Super Admin Only) */}
        {user.role === "super_admin" && (
          <div className="backdrop-blur-xl bg-gradient-to-br from-purple-600/15 to-indigo-600/15 border-2 border-purple-500/30 rounded-2xl p-8 mb-10 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 animate-in fade-in-up duration-500 delay-200">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-indigo-300 bg-clip-text text-transparent mb-2">Admin Management</h2>
                <p className="text-slate-300 text-sm">
                  Create new admin accounts, manage user roles, and view all system users.
                </p>
              </div>
              <Link
                href="/super-admin"
                className="flex-shrink-0 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-purple-500/50 hover:scale-105 active:scale-95"
              >
                + Add New Admin
              </Link>
            </div>
          </div>
        )}

        {/* Uploaded Files Section */}
        {uploadedFiles.length > 0 && (
          <div className="backdrop-blur-xl bg-slate-900/50 border border-slate-800/50 rounded-2xl p-8 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 animate-in fade-in-up duration-500 delay-300">
            <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent mb-6">Uploaded Files</h2>
            <div className="space-y-3">
              {uploadedFiles.map((file) => (
                <div
                  key={file.name}
                  className="flex items-start justify-between gap-4 p-4 bg-slate-800/30 border border-slate-800/50 rounded-lg hover:border-purple-500/30 hover:bg-slate-800/50 transition-all duration-300 group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium break-words group-hover:text-purple-300 transition-colors">{file.name}</p>
                    <p className="text-slate-400 text-xs mt-2 group-hover:text-slate-300 transition-colors">
                      {file.count} defect{file.count !== 1 ? "s" : ""} • Uploaded by {file.uploadedBy} on {file.uploadedAt}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteFile(file.name)}
                    disabled={deleting === file.name}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/20 p-2 rounded-lg transition-all duration-300 disabled:opacity-50 flex-shrink-0 group-hover:scale-110"
                    title="Delete file and all its defects"
                  >
                    <HiTrash className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
            {deleteMessage && (
              <div className="flex items-center gap-2 p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-lg text-sm text-emerald-300 mt-4 animate-in fade-in duration-300">
                <HiCheckCircle className="w-4 h-4 flex-shrink-0" />
                {deleteMessage}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
