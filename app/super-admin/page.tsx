"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
} from "@headlessui/react";
import {
  HiArrowLeft,
  HiCheck,
  HiChevronDown,
  HiPlusCircle,
  HiShieldCheck,
  HiTrash,
  HiUsers,
} from "react-icons/hi";
import { toast } from "sonner";
import AppButton from "@/app/components/common/AppButton";
import { PageSkeleton } from "@/app/components/common/SkeletonLoader";
import { getCurrentUser } from "@/app/actions/auth";
import {
  createUserAdminAction,
  deleteUserAction,
  getUsers,
  updateUserRoleAction,
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

const roleOptions: Array<{ value: UserRole; label: string }> = [
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super Admin" },
];

export default function SuperAdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [authRole, setAuthRole] = useState<UserRole | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [createRole, setCreateRole] = useState<UserRole>("admin");

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

  const onRoleChange = async (targetUser: AdminUser, role: UserRole) => {
    if (targetUser.role === role) {
      return;
    }

    const formData = new FormData();
    formData.set("userId", targetUser.id);
    formData.set("role", role);

    const changeRolePromise = (async () => {
      const result = await updateUserRoleAction(formData);
      if (!result.success) {
        throw new Error(result.message || "Failed to update role");
      }

      await loadUsers();
      return role;
    })();

    toast.promise(changeRolePromise, {
      loading: `Updating ${targetUser.name}'s access...`,
      success: (nextRole) =>
        `${targetUser.name} is now ${nextRole === "super_admin" ? "Super Admin" : "Admin"}`,
      error: (error) =>
        error instanceof Error ? error.message : "Could not update access",
    });
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

  const superAdminCount = users.filter(
    (user) => user.role === "super_admin",
  ).length;
  const adminCount = users.filter((user) => user.role === "admin").length;

  return (
    <div className="min-h-screen">
      <div className="mx-auto w-full max-w-screen-2xl px-4 py-6 sm:px-6 lg:py-8">
        <Link
          href="/"
          className="group mb-5 inline-flex items-center gap-2 text-sm font-medium text-(--muted-color) transition-colors hover:text-(--heading-color)"
        >
          <HiArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Dashboard</span>
        </Link>

        <section className="rounded-2xl border border-(--border-color) bg-(--surface) p-5 shadow-card sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-(--border-color) bg-(--surface-soft) px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-(--muted-color)">
                <HiShieldCheck className="h-4 w-4 text-(--primary-color)" />
                Access Control
              </div>
              <h1 className="text-2xl font-semibold text-(--heading-color) sm:text-3xl">
                Super Admin Console
              </h1>
              <p className="mt-1.5 text-sm text-(--muted-color)">
                Manage admin accounts, role assignments, and privileged access.
              </p>
            </div>
            {authRole && (
              <span className="inline-flex items-center gap-2 rounded-full border border-(--primary-color)/35 bg-(--primary-color)/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-(--heading-color)">
                <span className="h-2 w-2 rounded-full bg-(--primary-color)" />
                {authRole.replace("_", " ")}
              </span>
            )}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3  sm:grid-cols-3">
            <div className="rounded-xl border border-(--border-color) bg-(--surface-soft) px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-(--muted-color)">
                Total Users
              </p>
              <p className="mt-1 text-2xl font-semibold text-(--heading-color)">
                {users.length}
              </p>
            </div>
            <div className="rounded-xl border border-(--border-color) bg-(--surface-soft) px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-(--muted-color)">
                Super Admins
              </p>
              <p className="mt-1 text-2xl font-semibold text-(--heading-color)">
                {superAdminCount}
              </p>
            </div>
            <div className="rounded-xl border border-(--border-color) bg-(--surface-soft) px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-(--muted-color)">
                Admins
              </p>
              <p className="mt-1 text-2xl font-semibold text-(--heading-color)">
                {adminCount}
              </p>
            </div>
          </div>
        </section>

        <div className="mt-6">
          <TabGroup>
            <TabList className="mb-4 flex flex-wrap gap-2 rounded-2xl border border-(--border-color) bg-(--surface) p-2 shadow-card">
              <Tab
                className={({ selected }) =>
                  `rounded-xl px-4 py-2 text-sm font-semibold outline-none transition-all ${
                    selected
                      ? "bg-(--primary-color) text-(--on-primary)"
                      : "text-(--muted-color) hover:bg-(--surface-soft) hover:text-(--heading-color)"
                  }`
                }
              >
                <span className="inline-flex items-center gap-2">
                  <HiUsers className="h-4.5 w-4.5" />
                  Manage Users
                </span>
              </Tab>
              <Tab
                className={({ selected }) =>
                  `rounded-xl px-4 py-2 text-sm font-semibold outline-none transition-all ${
                    selected
                      ? "bg-(--primary-color) text-(--on-primary)"
                      : "text-(--muted-color) hover:bg-(--surface-soft) hover:text-(--heading-color)"
                  }`
                }
              >
                <span className="inline-flex items-center gap-2">
                  <HiPlusCircle className="h-4.5 w-4.5" />
                  Create Admin
                </span>
              </Tab>
            </TabList>

            <TabPanels>
              <TabPanel className="outline-none">
                <section className="overflow-hidden rounded-2xl border border-(--border-color) bg-(--surface) shadow-card">
                  <div className="border-b border-(--border-color) bg-(--surface-soft) px-5 py-4 sm:px-6">
                    <div className="flex items-center gap-2">
                      <HiUsers className="h-5 w-5 text-(--primary-color)" />
                      <h2 className="text-lg font-semibold text-(--heading-color)">
                        Admin Users
                      </h2>
                    </div>
                    <p className="mt-1 text-xs text-(--muted-color)">
                      {users.length}{" "}
                      {users.length === 1 ? "account" : "accounts"} with
                      privileged access
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-190 w-full text-sm">
                      <thead>
                        <tr className="border-b border-emerald-100 bg-emerald-50/60">
                          <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-(--heading-color)">
                            User
                          </th>
                          <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-(--heading-color)">
                            Access
                          </th>
                          <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-(--heading-color)">
                            Change Access
                          </th>
                          <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-(--heading-color)">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.length === 0 ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-5 py-12 text-center text-(--muted-color)"
                            >
                              No users found.
                            </td>
                          </tr>
                        ) : (
                          users.map((user) => (
                            <tr
                              key={user.id}
                              className="border-b border-emerald-50 transition-colors duration-200 hover:bg-emerald-50/35"
                            >
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-800">
                                    {(user.name || "U")
                                      .split(" ")
                                      .filter(Boolean)
                                      .slice(0, 2)
                                      .map((part) => part[0]?.toUpperCase())
                                      .join("")}
                                  </span>
                                  <div className="min-w-0">
                                    <p className="truncate font-semibold text-(--text-color)">
                                      {user.name}
                                    </p>
                                    <p className="truncate text-xs text-(--muted-color)">
                                      {user.email}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-4">
                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                                    user.role === "super_admin"
                                      ? "border-emerald-300 bg-emerald-100 text-emerald-800"
                                      : "border-blue-300 bg-blue-100 text-blue-800"
                                  }`}
                                >
                                  <span
                                    className={`h-1.5 w-1.5 rounded-full ${
                                      user.role === "super_admin"
                                        ? "bg-emerald-600"
                                        : "bg-blue-600"
                                    }`}
                                  />
                                  {user.role === "super_admin"
                                    ? "Super Admin"
                                    : "Admin"}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                <Listbox
                                  value={user.role}
                                  onChange={(nextRole: UserRole) =>
                                    onRoleChange(user, nextRole)
                                  }
                                  disabled={user.id === currentUserId}
                                >
                                  <div className="relative w-44">
                                    <ListboxButton className="flex w-full items-center justify-between rounded-md border border-(--border-color) bg-(--surface-soft) px-2.5 py-1.5 text-sm text-(--text-color) focus:border-(--primary-color) focus:outline-none focus:ring-2 focus:ring-(--primary-color)/20 disabled:cursor-not-allowed disabled:opacity-50">
                                      <span>
                                        {user.role === "super_admin"
                                          ? "Super Admin"
                                          : "Admin"}
                                      </span>
                                      <HiChevronDown className="h-4 w-4 text-(--muted-color)" />
                                    </ListboxButton>
                                    <ListboxOptions className="absolute z-40 mt-1 max-h-56 w-full overflow-auto rounded-md border border-(--border-color) bg-(--surface) p-1 shadow-panel focus:outline-none">
                                      {roleOptions.map((option) => (
                                        <ListboxOption
                                          key={option.value}
                                          value={option.value}
                                          className={({ focus }) =>
                                            `cursor-pointer rounded px-2.5 py-2 text-sm ${
                                              focus
                                                ? "bg-(--surface-soft) text-(--heading-color)"
                                                : "text-(--text-color)"
                                            }`
                                          }
                                        >
                                          {({ selected }) => (
                                            <span className="flex items-center justify-between gap-2">
                                              <span>{option.label}</span>
                                              {selected ? (
                                                <HiCheck className="h-4 w-4 text-(--primary-color)" />
                                              ) : null}
                                            </span>
                                          )}
                                        </ListboxOption>
                                      ))}
                                    </ListboxOptions>
                                  </div>
                                </Listbox>
                              </td>
                              <td className="px-5 py-4">
                                <AppButton
                                  onClick={() =>
                                    onDeleteUser(user.id, user.name)
                                  }
                                  disabled={
                                    user.id === currentUserId ||
                                    deleting === user.id
                                  }
                                  variant="dangerSoft"
                                  size="icon"
                                  className="h-8 w-8"
                                  title={
                                    user.id === currentUserId
                                      ? "Cannot delete your own account"
                                      : "Delete user account"
                                  }
                                >
                                  {deleting === user.id ? (
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-rose-200 border-t-rose-500" />
                                  ) : (
                                    <HiTrash className="h-4.5 w-4.5" />
                                  )}
                                </AppButton>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </TabPanel>

              <TabPanel className="outline-none">
                <section className="rounded-2xl border border-(--border-color) bg-(--surface) p-5 shadow-card sm:p-6">
                  <div className="mb-5 flex items-center gap-2">
                    <HiPlusCircle className="h-5 w-5 text-(--primary-color)" />
                    <h2 className="text-lg font-semibold text-(--heading-color)">
                      Create Admin
                    </h2>
                  </div>

                  <form action={onCreateUser} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-(--text-color)">
                          Full Name
                        </label>
                        <input
                          name="name"
                          placeholder="Enter full name"
                          className="w-full rounded-lg border border-(--border-color) bg-(--surface-soft) px-3 py-2.5 text-sm text-(--text-color) placeholder:text-(--muted-color) focus:border-(--primary-color) focus:outline-none focus:ring-2 focus:ring-(--primary-color)/20"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-(--text-color)">
                          Email Address
                        </label>
                        <input
                          name="email"
                          type="email"
                          placeholder="Enter email address"
                          className="w-full rounded-lg border border-(--border-color) bg-(--surface-soft) px-3 py-2.5 text-sm text-(--text-color) placeholder:text-(--muted-color) focus:border-(--primary-color) focus:outline-none focus:ring-2 focus:ring-(--primary-color)/20"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-(--text-color)">
                          Phone Number
                        </label>
                        <input
                          name="phone"
                          placeholder="Enter phone number"
                          className="w-full rounded-lg border border-(--border-color) bg-(--surface-soft) px-3 py-2.5 text-sm text-(--text-color) placeholder:text-(--muted-color) focus:border-(--primary-color) focus:outline-none focus:ring-2 focus:ring-(--primary-color)/20"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-(--text-color)">
                          Password
                        </label>
                        <input
                          name="password"
                          type="password"
                          placeholder="Enter password"
                          className="w-full rounded-lg border border-(--border-color) bg-(--surface-soft) px-3 py-2.5 text-sm text-(--text-color) placeholder:text-(--muted-color) focus:border-(--primary-color) focus:outline-none focus:ring-2 focus:ring-(--primary-color)/20"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-(--text-color)">
                        User Role
                      </label>
                      <input type="hidden" name="role" value={createRole} />
                      <Listbox
                        value={createRole}
                        onChange={(nextRole: UserRole) =>
                          setCreateRole(nextRole)
                        }
                      >
                        <div className="relative max-w-xs">
                          <ListboxButton className="flex w-full items-center justify-between rounded-lg border border-(--border-color) bg-(--surface-soft) px-3 py-2.5 text-sm text-(--text-color) focus:border-(--primary-color) focus:outline-none focus:ring-2 focus:ring-(--primary-color)/20">
                            <span>
                              {createRole === "super_admin"
                                ? "Super Admin"
                                : "Admin"}
                            </span>
                            <HiChevronDown className="h-4 w-4 text-(--muted-color)" />
                          </ListboxButton>
                          <ListboxOptions className="absolute z-40 mt-1 max-h-56 w-full overflow-auto rounded-md border border-(--border-color) bg-(--surface) p-1 shadow-panel focus:outline-none">
                            {roleOptions.map((option) => (
                              <ListboxOption
                                key={option.value}
                                value={option.value}
                                className={({ focus }) =>
                                  `cursor-pointer rounded px-2.5 py-2 text-sm ${
                                    focus
                                      ? "bg-(--surface-soft) text-(--heading-color)"
                                      : "text-(--text-color)"
                                  }`
                                }
                              >
                                {({ selected }) => (
                                  <span className="flex items-center justify-between gap-2">
                                    <span>{option.label}</span>
                                    {selected ? (
                                      <HiCheck className="h-4 w-4 text-(--primary-color)" />
                                    ) : null}
                                  </span>
                                )}
                              </ListboxOption>
                            ))}
                          </ListboxOptions>
                        </div>
                      </Listbox>
                    </div>

                    <AppButton
                      type="submit"
                      variant="primary"
                      className="w-full py-2.5 font-medium sm:w-auto sm:px-6"
                    >
                      Create Admin Account
                    </AppButton>
                  </form>
                </section>
              </TabPanel>
            </TabPanels>
          </TabGroup>
        </div>
      </div>
    </div>
  );
}
