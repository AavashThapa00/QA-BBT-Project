"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { HiOutlineBell, HiOutlineSearch, HiOutlineMail } from "react-icons/hi";
import { getCurrentUser } from "@/app/actions/auth";

const PUBLIC_ROUTES = ["/login", "/forgot-password", "/reset-password"];

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

export default function AppShellHeader() {
  const pathname = usePathname();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isUserLoading, setIsUserLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setIsUserLoading(true);

    getCurrentUser()
      .then((user) => {
        if (!mounted || !user) return;
        setUserName(user.name || "Team Member");
        setUserEmail(user.email || "No email");
      })
      .catch(() => {
        if (!mounted) return;
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

          <div className="hidden items-center gap-3 rounded-xl bg-(--surface-soft) px-3 py-2 sm:flex">
            {isUserLoading ? (
              <>
                <span className="h-9 w-9 animate-pulse rounded-full bg-(--surface)" />
                <div className="min-w-0 space-y-1">
                  <p className="h-3 w-28 animate-pulse rounded bg-(--surface)" />
                  <p className="h-2.5 w-36 animate-pulse rounded bg-(--surface)" />
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
