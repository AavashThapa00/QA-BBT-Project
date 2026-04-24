"use client";

import Link from "next/link";
import { Fragment, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from "@headlessui/react";
import { HiOutlineBell, HiOutlineSearch, HiOutlineMail } from "react-icons/hi";
import { LuChevronDown, LuLogOut, LuUser } from "react-icons/lu";
import { toast } from "sonner";
import { getCurrentUser, logoutAction } from "@/app/actions/auth";

const PUBLIC_ROUTES = ["/login", "/forgot-password", "/reset-password"];

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

export default function AppShellHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);
  const [authRole, setAuthRole] = useState<"super_admin" | "admin" | null>(
    null,
  );
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let mounted = true;
    setIsUserLoading(true);

    getCurrentUser()
      .then((user) => {
        if (!mounted) return;

        if (!user) {
          setIsAuthed(false);
          setAuthRole(null);
          setUserName("Team Member");
          setUserEmail("No email");
          return;
        }

        setIsAuthed(true);
        setAuthRole(user.role ?? null);
        setUserName(user.name || "Team Member");
        setUserEmail(user.email || "No email");
      })
      .catch(() => {
        if (!mounted) return;
        setIsAuthed(false);
        setAuthRole(null);
        setUserName("Team Member");
        setUserEmail("No email");
      })
      .finally(() => {
        if (!mounted) return;
        setIsUserLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [pathname]);

  if (!pathname || isPublicRoute(pathname)) {
    return null;
  }

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      await toast.promise(logoutAction(), {
        loading: "Logging out...",
        success: (result) => result?.message || "Logged out successfully",
        error: (error) => (error as Error)?.message || "Failed to log out",
      });

      router.push("/login");
      router.refresh();
    } catch (error) {
      toast.error((error as Error)?.message || "Failed to log out");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const initials = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <header className="rounded-2xl bg-(--surface)/95 px-3 py-3 mx-3 shadow-card sm:px-4 sm:mx-4">
      <div className="flex items-center gap-3">
        <div className="relative hidden flex-1 lg:block">
          <HiOutlineSearch className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-(--muted-color)" />
          <input
            type="search"
            placeholder="Search task"
            className="h-11 w-full rounded-xl bg-(--surface-soft) pl-10 pr-16 text-sm text-(--text-color) placeholder:text-(--muted-color) focus:outline-none focus:ring-2 focus:ring-(--primary-color)/20"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-(--surface) px-2 py-0.5 text-[11px] font-medium text-(--muted-color)">
            Ctrl + F
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-(--surface-soft) text-(--muted-color) transition-colors hover:text-(--heading-color)"
            aria-label="Messages"
          >
            <HiOutlineMail className="h-4.5 w-4.5" />
          </button>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-(--surface-soft) text-(--muted-color) transition-colors hover:text-(--heading-color)"
            aria-label="Notifications"
          >
            <HiOutlineBell className="h-4.5 w-4.5" />
          </button>

          <div className="hidden sm:block">
            {isUserLoading ? (
              <div className="flex items-center gap-3 rounded-xl bg-(--surface-soft) px-3 py-2">
                <span className="h-9 w-9 animate-pulse rounded-full bg-(--surface)" />
                <div className="min-w-0 space-y-1">
                  <p className="h-3 w-28 animate-pulse rounded bg-(--surface)" />
                  <p className="h-2.5 w-36 animate-pulse rounded bg-(--surface)" />
                </div>
              </div>
            ) : (
              <Menu as="div" className="relative">
                <MenuButton className="inline-flex items-center gap-2 rounded-xl bg-(--surface-soft) px-3 py-2 text-left transition-colors hover:bg-(--surface-elevated) focus:outline-none focus-visible:outline-none focus-visible:ring-0">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-(--primary-color)/20 text-xs font-semibold text-(--heading-color)">
                    {initials || "TM"}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-(--heading-color)">
                      {userName}
                    </p>
                    <p className="truncate text-xs text-(--muted-color)">
                      {userEmail}
                    </p>
                  </div>
                  <LuChevronDown className="h-4 w-4 text-(--muted-color)" />
                </MenuButton>

                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-150"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-100"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <MenuItems className="absolute right-0 z-70 mt-2 w-56 origin-top-right rounded-xl border border-(--border-color) bg-(--surface) p-1.5 shadow-panel focus:outline-none">
                    <div className="mb-1 rounded-lg bg-(--surface-soft) px-2.5 py-2">
                      <p className="truncate text-sm font-semibold text-(--heading-color)">
                        {userName}
                      </p>
                      <p className="truncate text-xs text-(--muted-color)">
                        {userEmail}
                      </p>
                    </div>

                    {isAuthed && (
                      <>
                        <MenuItem>
                          {({ focus }) => (
                            <Link
                              href="/profile"
                              className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                                focus
                                  ? "bg-(--surface-soft) text-(--heading-color)"
                                  : "text-(--text-color)"
                              }`}
                            >
                              <LuUser className="h-4.5 w-4.5" />
                              <span>Profile</span>
                            </Link>
                          )}
                        </MenuItem>

                        {authRole === "super_admin" && (
                          <MenuItem>
                            {({ focus }) => (
                              <Link
                                href="/super-admin"
                                className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                                  focus
                                    ? "bg-(--surface-soft) text-(--heading-color)"
                                    : "text-(--text-color)"
                                }`}
                              >
                                <LuUser className="h-4.5 w-4.5" />
                                <span>Admin Console</span>
                              </Link>
                            )}
                          </MenuItem>
                        )}

                        <MenuItem>
                          {({ focus }) => (
                            <button
                              type="button"
                              onClick={handleLogout}
                              disabled={isLoggingOut}
                              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                                focus
                                  ? "bg-(--surface-soft) text-(--heading-color)"
                                  : "text-(--text-color)"
                              } disabled:opacity-60`}
                            >
                              <LuLogOut className="h-4.5 w-4.5 text-rose-500" />
                              <span>
                                {isLoggingOut ? "Logging out..." : "Logout"}
                              </span>
                            </button>
                          )}
                        </MenuItem>
                      </>
                    )}
                  </MenuItems>
                </Transition>
              </Menu>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
