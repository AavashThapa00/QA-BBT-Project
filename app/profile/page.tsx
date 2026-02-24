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
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-6xl mx-auto p-6 lg:p-10">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-10 text-sm"
        >
          <HiArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Profile Header */}
        <div className="mb-10">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white">{user.name}</h1>
              <p className="text-slate-400 mt-1 text-base">{user.email}</p>
            </div>
            <span className="text-blue-400 text-sm font-medium px-3 py-1 bg-blue-500/10 rounded border border-blue-500/20">
              {user.role === "super_admin" ? "Super Admin" : "Admin"}
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Profile Details Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-8">
            <h2 className="text-xl font-bold text-white mb-6">Profile Details</h2>
            <form action={onUpdateProfile} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                <input
                  name="name"
                  type="text"
                  defaultValue={user.name}
                  required
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                <input
                  name="email"
                  type="email"
                  defaultValue={user.email}
                  required
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number</label>
                <input
                  name="phone"
                  type="tel"
                  defaultValue={user.phone || ""}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600"
                />
              </div>
              {profileMessage && (
                <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded text-sm text-emerald-300">
                  <HiCheckCircle className="w-4 h-4 flex-shrink-0" />
                  {profileMessage}
                </div>
              )}
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold text-sm transition-colors"
              >
                Save Changes
              </button>
            </form>

            {/* Add Admin Link */}
            {user.role === "super_admin" && (
              <div className="mt-8 pt-8 border-t border-slate-800">
                <Link
                  href="/super-admin"
                  className="inline-flex bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors border border-slate-700 hover:border-slate-600"
                >
                  + Add Admin
                </Link>
              </div>
            )}
          </div>

          {/* Security Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-8">
            <h2 className="text-xl font-bold text-white mb-6">Change Password</h2>
            <form action={onChangePassword} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Current Password</label>
                <input
                  name="currentPassword"
                  type="password"
                  required
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
                <input
                  name="newPassword"
                  type="password"
                  required
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600"
                />
              </div>
              {passwordMessage && (
                <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded text-sm text-emerald-300">
                  <HiCheckCircle className="w-4 h-4 flex-shrink-0" />
                  {passwordMessage}
                </div>
              )}
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold text-sm transition-colors"
              >
                Update Password
              </button>
            </form>
          </div>
        </div>

        {/* Uploaded Files Section */}
        {uploadedFiles.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-8">
            <h2 className="text-xl font-bold text-white mb-6">Uploaded Files</h2>
            <div className="space-y-3">
              {uploadedFiles.map((file) => (
                <div
                  key={file.name}
                  className="flex items-start justify-between gap-4 p-4 bg-slate-800/40 border border-slate-800 rounded hover:border-slate-700 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium break-words">{file.name}</p>
                    <p className="text-slate-400 text-xs mt-2">
                      {file.count} defect{file.count !== 1 ? "s" : ""} • Uploaded by {file.uploadedBy} on {file.uploadedAt}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteFile(file.name)}
                    disabled={deleting === file.name}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded transition-all disabled:opacity-50 flex-shrink-0"
                    title="Delete file and all its defects"
                  >
                    <HiTrash className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
            {deleteMessage && (
              <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded text-sm text-emerald-300 mt-4">
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
