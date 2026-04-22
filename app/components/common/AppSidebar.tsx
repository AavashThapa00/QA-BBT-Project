"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  HiHome,
  HiChartBar,
  HiViewList,
  HiClipboardCheck,
  HiUserCircle,
  HiPlus,
  HiLogout,
  HiArrowRight,
  HiMenu,
  HiX,
  HiShieldCheck,
  HiAdjustments,
} from "react-icons/hi";
import { toast } from "sonner";
import { getCurrentUser, logoutAction } from "@/app/actions/auth";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/", icon: HiHome },
  { name: "Issue Sheet", href: "/issue-sheet", icon: HiViewList },
  { name: "All Issues", href: "/all-defects", icon: HiAdjustments },
  { name: "Test Execution", href: "/test-execution", icon: HiArrowRight },
  { name: "Analytics", href: "/analytics", icon: HiChartBar },
  { name: "QA Status", href: "/qc-dashboard", icon: HiClipboardCheck },
];

function BrandLogo() {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-(--border-color) bg-(--surface-soft) text-(--heading-color)">
      <HiShieldCheck className="h-5 w-5" aria-hidden="true" />
    </div>
  );
}

export default function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isAuthed, setIsAuthed] = useState(false);
  const [isAuthResolved, setIsAuthResolved] = useState(false);
  const [authRole, setAuthRole] = useState<"super_admin" | "admin" | null>(
    null,
  );
  const [userName, setUserName] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    let mounted = true;

    getCurrentUser()
      .then((user) => {
        if (!mounted) return;
        setIsAuthed(!!user);
        setAuthRole(user?.role ?? null);
        setUserName(user?.name ?? "");
        setIsAuthResolved(true);
      })
      .catch(() => {
        if (!mounted) return;
        setIsAuthed(false);
        setAuthRole(null);
        setUserName("");
        setIsAuthResolved(true);
      });

    return () => {
      mounted = false;
    };
  }, [pathname]);

  useEffect(() => {
    const handleClick = (event: MouseEvent | TouchEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener("mousedown", handleClick);
      document.addEventListener("touchstart", handleClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
    };
  }, [menuOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  if (
    pathname === "/login" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password"
  ) {
    return null;
  }

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    setMenuOpen(false);

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

  const userInitials = (userName || "User")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <aside
      className={`sticky top-0 z-40 hidden h-screen border-r border-(--border-color) bg-(--surface) transition-all duration-300 lg:flex ${
        isCollapsed ? "w-20" : "w-72"
      }`}
    >
      <div className="flex h-full w-full flex-col overflow-hidden">
        <div
          className={`border-b border-(--border-color) ${
            isCollapsed
              ? "flex flex-col items-center gap-3 px-2 py-4"
              : "flex items-center gap-3 px-4 py-4"
          }`}
        >
          <Link href="/" className="flex items-center gap-3">
            <BrandLogo />
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.14em] text-(--muted-color)">
                  IssueFixu
                </p>
                <p className="text-sm font-semibold text-(--heading-color)">
                  Workspace
                </p>
              </div>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className={`inline-flex items-center justify-center rounded-md border border-(--border-color) bg-(--surface-soft) text-(--text-color) transition-colors hover:bg-slate-100 ${
              isCollapsed ? "h-10 w-10" : "ml-auto h-8 w-8 shrink-0"
            }`}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span className="text-sm font-semibold">
              {isCollapsed ? "›" : "‹"}
            </span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "border-slate-300 bg-slate-100 text-slate-900"
                      : "border-transparent text-(--text-color) hover:border-(--border-color) hover:bg-slate-50"
                  }`}
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!isCollapsed && (
                    <span className="truncate">{item.name}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-(--border-color) p-3">
          {!isCollapsed && (
            <div className="mb-3 rounded-xl border border-(--border-color) bg-(--surface-soft) p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-(--muted-color)">
                Account
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-(--heading-color)">
                {isAuthResolved && isAuthed ? userName : "Guest"}
              </p>
            </div>
          )}

          {isAuthResolved ? (
            isAuthed ? (
              <div className="space-y-2" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-(--border-color) px-3 py-3 text-left text-sm font-medium text-(--text-color) hover:bg-slate-50"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                      {userInitials || "U"}
                    </span>
                    {!isCollapsed && <span className="truncate">Profile</span>}
                  </span>
                  {!isCollapsed && <HiMenu className="h-4 w-4" />}
                </button>

                {!isCollapsed && (
                  <div
                    role="menu"
                    className={`overflow-hidden rounded-xl border border-(--border-color) bg-(--surface) shadow-lg transition-all duration-200 ease-out ${
                      menuOpen
                        ? "max-h-64 translate-y-0 opacity-100"
                        : "pointer-events-none max-h-0 -translate-y-1 opacity-0"
                    }`}
                  >
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-4 py-3 text-sm text-(--text-color) hover:bg-slate-50"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                    >
                      <HiUserCircle className="h-4 w-4" />
                      Profile
                    </Link>
                    {authRole === "super_admin" && (
                      <Link
                        href="/super-admin"
                        className="flex items-center gap-2 px-4 py-3 text-sm text-(--text-color) hover:bg-slate-50"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                      >
                        <HiPlus className="h-4 w-4" />
                        Add Admin
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-(--text-color) hover:bg-slate-50"
                      role="menuitem"
                    >
                      <HiLogout className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}

                {isCollapsed && (
                  <div
                    role="menu"
                    className={`overflow-hidden rounded-xl border border-(--border-color) bg-(--surface) shadow-lg transition-all duration-200 ease-out ${
                      menuOpen
                        ? "max-h-64 translate-y-0 opacity-100"
                        : "pointer-events-none max-h-0 -translate-y-1 opacity-0"
                    }`}
                  >
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-4 py-3 text-sm text-(--text-color) hover:bg-slate-50"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                    >
                      <HiUserCircle className="h-4 w-4" />
                      Profile
                    </Link>
                    {authRole === "super_admin" && (
                      <Link
                        href="/super-admin"
                        className="flex items-center gap-2 px-4 py-3 text-sm text-(--text-color) hover:bg-slate-50"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                      >
                        <HiPlus className="h-4 w-4" />
                        Add Admin
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-(--text-color) hover:bg-slate-50"
                      role="menuitem"
                    >
                      <HiLogout className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-3 rounded-xl border border-(--border-color) px-3 py-3 text-sm font-medium text-(--text-color) hover:bg-slate-50"
              >
                <HiUserCircle className="h-4 w-4" />
                {!isCollapsed && <span>Login</span>}
              </Link>
            )
          ) : (
            <div className="h-12 rounded-xl border border-(--border-color) bg-(--surface-soft) animate-pulse" />
          )}
        </div>
      </div>
    </aside>
  );
}
