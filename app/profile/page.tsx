"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HiArrowLeft, HiTrash, HiCheckCircle } from "react-icons/hi";
import AppButton from "@/app/components/common/AppButton";
import {
  getCurrentUser,
  updateProfileAction,
  changePasswordAction,
} from "@/app/actions/auth";
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
      if (
        current &&
        (current.role === "admin" || current.role === "super_admin")
      ) {
        const files = await getUploadedFiles();
        setUploadedFiles(files);
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-(--page-background) p-8">
        <div className="flex items-center justify-center h-96">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-emerald-200 border-t-(--primary-color)"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-(--page-background) p-8">
        <div className="max-w-lg mx-auto">
          <div className="rounded-lg border border-(--border-color) bg-(--surface) p-8 text-center">
            <h1 className="text-2xl font-bold text-(--heading-color)">
              Not signed in
            </h1>
            <p className="mt-3 text-sm text-(--muted-color)">
              Please sign in to view your profile.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex rounded-lg bg-(--primary-color) px-6 py-2 font-semibold text-white transition-colors hover:bg-(--primary-hover-color)"
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
    if (
      !confirm(`Delete all defects from "${fileName}"? This cannot be undone.`)
    ) {
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
    <div className="min-h-screen bg-(--page-background)">
      <div className="w-full px-4 py-6 sm:px-6 lg:px-10 lg:py-10 xl:px-12">
        {/* Back Link */}
        <Link
          href="/"
          className="group mb-8 inline-flex items-center gap-2 text-sm text-(--muted-color) transition-all duration-300 hover:translate-x-1 hover:text-(--primary-color) animate-in fade-in"
        >
          <HiArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>

        {/* Profile Header */}
        <div className="mb-10 animate-in fade-in-up duration-500">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-bold text-(--heading-color)">
                {user.name}
              </h1>
              <p className="mt-1 text-base text-(--muted-color)">
                {user.email}
              </p>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
              {user.role === "super_admin" ? "Super Admin" : "Admin"}
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10 animate-in fade-in-up duration-500 delay-100">
          {/* Profile Details Card */}
          <div className="rounded-2xl border border-(--border-color) bg-(--surface) p-8 shadow-sm transition-all duration-300 hover:border-emerald-200">
            <h2 className="mb-6 text-xl font-bold text-(--heading-color)">
              Profile Details
            </h2>
            <form action={onUpdateProfile} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-(--text-color)">
                  Full Name
                </label>
                <input
                  name="name"
                  type="text"
                  defaultValue={user.name}
                  required
                  className="w-full rounded-lg border border-(--border-color) bg-(--surface-soft) px-4 py-2 text-sm text-(--text-color) transition-all duration-300 focus:outline-none focus:border-(--primary-color) focus:ring-2 focus:ring-(--primary-color)/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-(--text-color)">
                  Email Address
                </label>
                <input
                  name="email"
                  type="email"
                  defaultValue={user.email}
                  required
                  className="w-full rounded-lg border border-(--border-color) bg-(--surface-soft) px-4 py-2 text-sm text-(--text-color) transition-all duration-300 focus:outline-none focus:border-(--primary-color) focus:ring-2 focus:ring-(--primary-color)/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-(--text-color)">
                  Phone Number
                </label>
                <input
                  name="phone"
                  type="tel"
                  defaultValue={user.phone || ""}
                  className="w-full rounded-lg border border-(--border-color) bg-(--surface-soft) px-4 py-2 text-sm text-(--text-color) transition-all duration-300 focus:outline-none focus:border-(--primary-color) focus:ring-2 focus:ring-(--primary-color)/20"
                />
              </div>
              {profileMessage && (
                <div className="animate-in fade-in flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 duration-300">
                  <HiCheckCircle className="h-4 w-4 shrink-0" />
                  {profileMessage}
                </div>
              )}
              <AppButton
                type="submit"
                variant="primary"
                className="w-full py-3"
              >
                Save Changes
              </AppButton>
            </form>
          </div>

          {/* Security Card */}
          <div className="rounded-2xl border border-(--border-color) bg-(--surface) p-8 shadow-sm transition-all duration-300 hover:border-emerald-200">
            <h2 className="mb-6 text-xl font-bold text-(--heading-color)">
              Change Password
            </h2>
            <form action={onChangePassword} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-(--text-color)">
                  Current Password
                </label>
                <input
                  name="currentPassword"
                  type="password"
                  required
                  className="w-full rounded-lg border border-(--border-color) bg-(--surface-soft) px-4 py-2 text-sm text-(--text-color) transition-all duration-300 focus:outline-none focus:border-(--primary-color) focus:ring-2 focus:ring-(--primary-color)/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-(--text-color)">
                  New Password
                </label>
                <input
                  name="newPassword"
                  type="password"
                  required
                  className="w-full rounded-lg border border-(--border-color) bg-(--surface-soft) px-4 py-2 text-sm text-(--text-color) transition-all duration-300 focus:outline-none focus:border-(--primary-color) focus:ring-2 focus:ring-(--primary-color)/20"
                />
              </div>
              {passwordMessage && (
                <div className="animate-in fade-in flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 duration-300">
                  <HiCheckCircle className="h-4 w-4 shrink-0" />
                  {passwordMessage}
                </div>
              )}
              <AppButton
                type="submit"
                variant="primary"
                className="w-full py-3"
              >
                Update Password
              </AppButton>
            </form>
          </div>
        </div>

        {/* Admin Management Section (Super Admin Only) */}
        {user.role === "super_admin" && (
          <div className="mb-10 animate-in fade-in-up rounded-2xl border border-emerald-200 bg-emerald-50/30 p-8 shadow-sm duration-500 delay-200">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <h2 className="mb-2 text-2xl font-bold text-(--heading-color)">
                  Admin Management
                </h2>
                <p className="text-sm text-(--muted-color)">
                  Create new admin accounts, manage user roles, and view all
                  system users.
                </p>
              </div>
              <Link
                href="/super-admin"
                className="shrink-0 rounded-lg bg-(--primary-color) px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-(--primary-hover-color)"
              >
                + Add New Admin
              </Link>
            </div>
          </div>
        )}

        {/* Uploaded Files Section */}
        {uploadedFiles.length > 0 && (
          <div className="animate-in fade-in-up rounded-2xl border border-(--border-color) bg-(--surface) p-8 shadow-sm duration-500 delay-300">
            <h2 className="mb-6 text-xl font-bold text-(--heading-color)">
              Uploaded Files
            </h2>
            <div className="space-y-3">
              {uploadedFiles.map((file) => (
                <div
                  key={file.name}
                  className="group flex items-start justify-between gap-4 rounded-lg border border-(--border-color) bg-(--surface-soft) p-4 transition-all duration-300 hover:border-emerald-200 hover:bg-emerald-50/20"
                >
                  <div className="flex-1 min-w-0">
                    <p className="wrap-break-word text-sm font-medium text-(--text-color) transition-colors group-hover:text-(--heading-color)">
                      {file.name}
                    </p>
                    <p className="mt-2 text-xs text-(--muted-color)">
                      {file.count} defect{file.count !== 1 ? "s" : ""} •
                      Uploaded by {file.uploadedBy} on {file.uploadedAt}
                    </p>
                  </div>
                  <AppButton
                    type="button"
                    onClick={() => onDeleteFile(file.name)}
                    disabled={deleting === file.name}
                    variant="dangerSoft"
                    size="icon"
                    title="Delete file and all its defects"
                  >
                    <HiTrash className="w-5 h-5" />
                  </AppButton>
                </div>
              ))}
            </div>
            {deleteMessage && (
              <div className="mt-4 animate-in fade-in flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 duration-300">
                <HiCheckCircle className="h-4 w-4 shrink-0" />
                {deleteMessage}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
