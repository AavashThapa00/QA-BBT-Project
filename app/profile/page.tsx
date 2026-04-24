"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { HiArrowLeft, HiTrash, HiCheckCircle } from "react-icons/hi";
import AppButton from "@/app/components/common/AppButton";
import { PageSkeleton } from "@/app/components/common/SkeletonLoader";
import { useTheme } from "@/app/components/common/ThemeProvider";
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

interface ProfileUploadedFile {
  name: string;
  count: number;
  uploadedAt: string;
  uploadedBy: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<ProfileUploadedFile[]>([]);
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
        setUploadedFiles(
          files.map((file) => ({
            name: file.fileName,
            count: file.defectCount,
            uploadedAt: file.uploadedAt ?? "Unknown date",
            uploadedBy: file.uploadedBy ?? "Unknown user",
          })),
        );
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, router, user]);

  if (loading) {
    return <PageSkeleton variant="detail" />;
  }

  if (!user) {
    return <PageSkeleton variant="detail" />;
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

  const initials = user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const hasAdminTools = user.role === "super_admin";
  const hasFileHistory = uploadedFiles.length > 0;

  return (
    <div className="min-h-screen">
      <div className="mx-auto w-full max-w-screen-2xl px-4 py-6 sm:px-6 lg:py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 rounded-full border border-(--border-color) bg-(--surface) px-4 py-2 text-sm font-medium text-(--muted-color) shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:text-(--primary-color)"
          >
            <HiArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back to Dashboard
          </Link>
          <p className="text-xs uppercase tracking-[0.14em] text-(--muted-color)">
            Profile Workspace
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="animate-in fade-in-up duration-500 xl:sticky xl:top-6 xl:self-start">
            <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-(--surface) shadow-card">
              <div className="h-20 bg-linear-to-r from-emerald-100 via-emerald-50 to-lime-100" />
              <div className="-mt-10 px-6 pb-6">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-(--surface) bg-(--primary-color) text-2xl font-semibold text-white shadow-lg">
                  {initials || "U"}
                </div>
                <h1 className="mt-4 text-2xl font-semibold leading-tight text-(--heading-color)">
                  {user.name}
                </h1>
                <p className="mt-1 wrap-break-word text-sm text-(--muted-color)">
                  {user.email}
                </p>
                <span className="mt-4 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  {user.role === "super_admin" ? "Super Admin" : "Admin"}
                </span>

                {hasAdminTools ? (
                  <div className="mt-6 rounded-2xl border border-(--border-color) bg-(--surface-soft) p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-(--muted-color)">
                      Admin Access
                    </p>
                    <p className="mt-2 text-sm text-(--muted-color)">
                      Open Admin Console to manage admin accounts and platform
                      access.
                    </p>
                    <Link
                      href="/super-admin"
                      className="mt-3 inline-flex rounded-xl bg-(--primary-color) px-3.5 py-2 text-sm font-semibold text-(--on-primary) shadow-glow transition-colors hover:bg-(--primary-hover-color)"
                    >
                      Open Admin Console
                    </Link>
                  </div>
                ) : (
                  <div className="mt-6 space-y-3 rounded-2xl border border-(--border-color) bg-(--surface-soft) p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-(--muted-color)">
                      Profile Status
                    </p>
                    <p className="text-xs text-(--muted-color)">
                      {user.phone
                        ? "Your account profile is complete."
                        : "Add your phone number to complete your profile."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </aside>

          <main className="space-y-6">
            <TabGroup>
              <div className="animate-in fade-in-up rounded-3xl border border-(--border-color) bg-(--surface) p-3 shadow-sm duration-500 sm:p-4">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3 px-1 pt-1 sm:px-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-(--muted-color)">
                      Settings
                    </p>
                    <h2 className="mt-1 text-xl font-semibold text-(--heading-color)">
                      Account Control Center
                    </h2>
                  </div>
                  <span className="rounded-full border border-(--border-color) bg-(--surface-soft) px-3 py-1 text-xs font-medium text-(--muted-color)">
                    {hasAdminTools
                      ? "Admin access enabled"
                      : "Personal account"}
                  </span>
                </div>

                <TabList className="flex flex-wrap gap-2 rounded-2xl border border-(--border-color) bg-(--surface-soft) p-2">
                  <Tab
                    className={({ selected }) =>
                      `rounded-xl px-4 py-2 text-sm font-semibold outline-none transition-all duration-200 ${
                        selected
                          ? "bg-(--primary-color) text-(--on-primary) shadow-glow"
                          : "text-(--muted-color) hover:bg-(--surface) hover:text-(--heading-color)"
                      }`
                    }
                  >
                    Profile
                  </Tab>
                  <Tab
                    className={({ selected }) =>
                      `rounded-xl px-4 py-2 text-sm font-semibold outline-none transition-all duration-200 ${
                        selected
                          ? "bg-(--primary-color) text-(--on-primary) shadow-glow"
                          : "text-(--muted-color) hover:bg-(--surface) hover:text-(--heading-color)"
                      }`
                    }
                  >
                    Appearance
                  </Tab>
                  <Tab
                    className={({ selected }) =>
                      `rounded-xl px-4 py-2 text-sm font-semibold outline-none transition-all duration-200 ${
                        selected
                          ? "bg-(--primary-color) text-(--on-primary) shadow-glow"
                          : "text-(--muted-color) hover:bg-(--surface) hover:text-(--heading-color)"
                      }`
                    }
                  >
                    Security
                  </Tab>
                  {hasFileHistory && (
                    <Tab
                      className={({ selected }) =>
                        `rounded-xl px-4 py-2 text-sm font-semibold outline-none transition-all duration-200 ${
                          selected
                            ? "bg-(--primary-color) text-(--on-primary) shadow-glow"
                            : "text-(--muted-color) hover:bg-(--surface) hover:text-(--heading-color)"
                        }`
                      }
                    >
                      Files
                    </Tab>
                  )}
                </TabList>

                <TabPanels className="pt-6">
                  <TabPanel className="outline-none">
                    <section className="animate-in fade-in-up rounded-3xl border border-(--border-color) bg-(--surface) p-6 shadow-sm duration-500 sm:p-7">
                      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.14em] text-(--muted-color)">
                            Personal Information
                          </p>
                          <h3 className="mt-1 text-xl font-semibold text-(--heading-color)">
                            Profile Details
                          </h3>
                        </div>
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          Live account data
                        </span>
                      </div>

                      <form
                        action={onUpdateProfile}
                        className="grid grid-cols-1 gap-5 md:grid-cols-2"
                      >
                        <div className="md:col-span-1">
                          <label className="mb-2 block text-sm font-medium text-(--text-color)">
                            Full Name
                          </label>
                          <input
                            name="name"
                            type="text"
                            defaultValue={user.name}
                            required
                            className="w-full rounded-xl border border-(--border-color) bg-(--surface-soft) px-4 py-2.5 text-sm text-(--text-color) transition-all duration-300 focus:border-(--primary-color) focus:outline-none focus:ring-2 focus:ring-(--primary-color)/20"
                          />
                        </div>
                        <div className="md:col-span-1">
                          <label className="mb-2 block text-sm font-medium text-(--text-color)">
                            Phone Number
                          </label>
                          <input
                            name="phone"
                            type="tel"
                            defaultValue={user.phone || ""}
                            placeholder="Add a contact number"
                            className="w-full rounded-xl border border-(--border-color) bg-(--surface-soft) px-4 py-2.5 text-sm text-(--text-color) transition-all duration-300 focus:border-(--primary-color) focus:outline-none focus:ring-2 focus:ring-(--primary-color)/20"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="mb-2 block text-sm font-medium text-(--text-color)">
                            Email Address
                          </label>
                          <input
                            name="email"
                            type="email"
                            defaultValue={user.email}
                            required
                            className="w-full rounded-xl border border-(--border-color) bg-(--surface-soft) px-4 py-2.5 text-sm text-(--text-color) transition-all duration-300 focus:border-(--primary-color) focus:outline-none focus:ring-2 focus:ring-(--primary-color)/20"
                          />
                        </div>

                        <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                          <AppButton
                            type="submit"
                            variant="primary"
                            className="px-6 py-2.5"
                          >
                            Save Profile
                          </AppButton>
                          <span className="text-xs text-(--muted-color)">
                            Changes are applied immediately after saving.
                          </span>
                        </div>

                        {profileMessage && (
                          <div className="animate-in fade-in md:col-span-2 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 duration-300">
                            <HiCheckCircle className="h-4 w-4 shrink-0" />
                            {profileMessage}
                          </div>
                        )}
                      </form>
                    </section>
                  </TabPanel>

                  <TabPanel className="outline-none">
                    <section className="animate-in fade-in-up rounded-3xl border border-(--border-color) bg-(--surface) p-6 shadow-sm duration-500 sm:p-7">
                      <div className="mb-6">
                        <p className="text-xs uppercase tracking-[0.14em] text-(--muted-color)">
                          Appearance
                        </p>
                        <h3 className="mt-1 text-xl font-semibold text-(--heading-color)">
                          Theme Preference
                        </h3>
                        <p className="mt-2 text-sm text-(--muted-color)">
                          Switch between dark and light mode across the app.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => setTheme("light")}
                          className={`rounded-2xl border px-4 py-4 text-left transition-all duration-300 ${
                            theme === "light"
                              ? "border-(--primary-color) bg-blue-50 text-(--heading-color) shadow-sm"
                              : "border-(--border-color) bg-(--surface-soft) text-(--text-color) hover:border-(--primary-color) hover:bg-blue-50/60"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold">
                                Light Theme
                              </p>
                              <p className="mt-1 text-xs text-(--muted-color)">
                                Bright interface for daytime use.
                              </p>
                            </div>
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                                theme === "light"
                                  ? "border-blue-200 bg-white text-(--heading-color)"
                                  : "border-(--border-color) bg-(--surface) text-(--muted-color)"
                              }`}
                            >
                              {theme === "light" ? "Active" : "Select"}
                            </span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setTheme("dark")}
                          className={`rounded-2xl border px-4 py-4 text-left transition-all duration-300 ${
                            theme === "dark"
                              ? "border-(--primary-color) bg-(--surface-soft) text-(--text-color) ring-2 ring-(--primary-color)/20"
                              : "border-(--border-color) bg-(--surface-soft) text-(--text-color) hover:border-(--primary-color) hover:bg-slate-100"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold">
                                Dark Theme
                              </p>
                              <p
                                className={`mt-1 text-xs ${
                                  theme === "dark"
                                    ? "text-(--muted-color)"
                                    : "text-(--muted-color)"
                                }`}
                              >
                                Low-light interface for darker environments.
                              </p>
                            </div>
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                                theme === "dark"
                                  ? "border-(--primary-color) bg-(--surface) text-(--heading-color)"
                                  : "border-(--border-color) bg-(--surface) text-(--muted-color)"
                              }`}
                            >
                              {theme === "dark" ? "Active" : "Select"}
                            </span>
                          </div>
                        </button>
                      </div>
                    </section>
                  </TabPanel>

                  <TabPanel className="outline-none">
                    <section className="animate-in fade-in-up rounded-3xl border border-(--border-color) bg-(--surface) p-6 shadow-sm duration-500 sm:p-7">
                      <div className="mb-6">
                        <p className="text-xs uppercase tracking-[0.14em] text-(--muted-color)">
                          Security
                        </p>
                        <h3 className="mt-1 text-xl font-semibold text-(--heading-color)">
                          Password & Access
                        </h3>
                      </div>

                      <form
                        action={onChangePassword}
                        className="grid grid-cols-1 gap-5 md:grid-cols-2"
                      >
                        <div>
                          <label className="mb-2 block text-sm font-medium text-(--text-color)">
                            Current Password
                          </label>
                          <input
                            name="currentPassword"
                            type="password"
                            required
                            className="w-full rounded-xl border border-(--border-color) bg-(--surface-soft) px-4 py-2.5 text-sm text-(--text-color) transition-all duration-300 focus:border-(--primary-color) focus:outline-none focus:ring-2 focus:ring-(--primary-color)/20"
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
                            className="w-full rounded-xl border border-(--border-color) bg-(--surface-soft) px-4 py-2.5 text-sm text-(--text-color) transition-all duration-300 focus:border-(--primary-color) focus:outline-none focus:ring-2 focus:ring-(--primary-color)/20"
                          />
                        </div>

                        <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                          <AppButton
                            type="submit"
                            variant="primary"
                            className="px-6 py-2.5"
                          >
                            Update Password
                          </AppButton>
                          <span className="text-xs text-(--muted-color)">
                            Use a unique password with at least 8 characters.
                          </span>
                        </div>

                        {passwordMessage && (
                          <div className="animate-in fade-in md:col-span-2 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 duration-300">
                            <HiCheckCircle className="h-4 w-4 shrink-0" />
                            {passwordMessage}
                          </div>
                        )}
                      </form>
                    </section>
                  </TabPanel>

                  {hasFileHistory && (
                    <TabPanel className="outline-none">
                      <section className="animate-in fade-in-up rounded-3xl border border-(--border-color) bg-(--surface) p-6 shadow-sm duration-500 sm:p-7">
                        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.14em] text-(--muted-color)">
                              Data History
                            </p>
                            <h3 className="mt-1 text-xl font-semibold text-(--heading-color)">
                              Uploaded Files
                            </h3>
                          </div>
                          <span className="rounded-full border border-(--border-color) bg-(--surface-soft) px-3 py-1 text-xs font-medium text-(--muted-color)">
                            {uploadedFiles.length} file
                            {uploadedFiles.length !== 1 ? "s" : ""}
                          </span>
                        </div>

                        <div className="space-y-3">
                          {uploadedFiles.map((file) => (
                            <div
                              key={file.name}
                              className="group flex items-start justify-between gap-4 rounded-xl border border-(--border-color) bg-(--surface-soft) p-4 transition-all duration-300 hover:border-emerald-200 hover:bg-emerald-50/20"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="wrap-break-word text-sm font-semibold text-(--text-color) transition-colors group-hover:text-(--heading-color)">
                                  {file.name}
                                </p>
                                <p className="mt-1 text-xs text-(--muted-color)">
                                  {file.count} defect
                                  {file.count !== 1 ? "s" : ""} imported
                                </p>
                                <p className="mt-1 text-xs text-(--muted-color)">
                                  Uploaded by {file.uploadedBy} on{" "}
                                  {file.uploadedAt}
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
                                <HiTrash className="h-5 w-5" />
                              </AppButton>
                            </div>
                          ))}
                        </div>

                        {deleteMessage && (
                          <div className="mt-4 animate-in fade-in flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 duration-300">
                            <HiCheckCircle className="h-4 w-4 shrink-0" />
                            {deleteMessage}
                          </div>
                        )}
                      </section>
                    </TabPanel>
                  )}
                </TabPanels>
              </div>
            </TabGroup>
          </main>
        </div>
      </div>
    </div>
  );
}
