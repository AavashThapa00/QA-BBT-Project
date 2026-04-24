"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  LuBarChart3,
  LuBug,
  LuClipboardCheck,
  LuFileSpreadsheet,
  LuHome,
  LuPanelLeftClose,
  LuPanelLeftOpen,
  LuPlay,
  LuShieldCheck,
  LuUserPlus,
} from "react-icons/lu";
import { getCurrentUser } from "@/app/actions/auth";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/", icon: LuHome },
  { name: "Issue Sheet", href: "/issue-sheet", icon: LuFileSpreadsheet },
  { name: "All Issues", href: "/all-defects", icon: LuBug },
  { name: "Test Execution", href: "/test-execution", icon: LuPlay },
  { name: "Analytics", href: "/analytics", icon: LuBarChart3 },
  { name: "QA Status", href: "/qc-dashboard", icon: LuClipboardCheck },
];

function BrandLogo() {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--surface) text-(--heading-color)">
      <LuShieldCheck className="h-5 w-5" aria-hidden="true" />
    </div>
  );
}

export default function AppSidebar() {
  const pathname = usePathname();
  const [authRole, setAuthRole] = useState<"super_admin" | "admin" | null>(
    null,
  );
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    let mounted = true;

    getCurrentUser()
      .then((user) => {
        if (!mounted) return;
        setAuthRole(user?.role ?? null);
      })
      .catch(() => {
        if (!mounted) return;
        setAuthRole(null);
      });

    return () => {
      mounted = false;
    };
  }, [pathname]);

  if (
    pathname === "/login" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password"
  ) {
    return null;
  }

  const items =
    authRole === "super_admin"
      ? [
          ...navItems,
          { name: "Admin Console", href: "/super-admin", icon: LuUserPlus },
        ]
      : navItems;

  return (
    <aside
      className={`sticky top-2 hidden h-[calc(100vh-2rem)] shrink-0 overflow-hidden rounded-2xl bg-(--surface) py-3 shadow-card transition-[width,padding] duration-200 ease-out will-change-[width] lg:flex sm:top-3 lg:top-4 ${
        isCollapsed ? "w-20 px-2" : "w-69 px-3"
      }`}
    >
      <div className="flex h-full w-full flex-col">
        <div
          className={`rounded-2xl bg-(--surface-soft) py-3 ${
            isCollapsed ? "px-2" : "px-3"
          }`}
        >
          <div
            className={`flex items-center gap-2 ${
              isCollapsed ? "justify-center" : "justify-between"
            }`}
          >
            {!isCollapsed && (
              <Link
                href="/"
                className="flex min-w-0 items-center gap-3"
                title="Workspace"
              >
                <BrandLogo />
                <div className="min-w-0 overflow-hidden">
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-(--muted-color)">
                      Workspace
                    </p>
                    <p className="truncate text-lg font-semibold text-(--heading-color)">
                      IssueFixu
                    </p>
                  </div>
                </div>
              </Link>
            )}

            <button
              type="button"
              onClick={() => setIsCollapsed((prev) => !prev)}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-(--muted-color) transition-colors hover:bg-(--surface) hover:text-(--heading-color)"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <LuPanelLeftOpen className="h-4.5 w-4.5" />
              ) : (
                <LuPanelLeftClose className="h-4.5 w-4.5" />
              )}
            </button>
          </div>
        </div>

        <div className={`mt-4 ${isCollapsed ? "" : "pr-1"}`}>
          {!isCollapsed && (
            <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-(--muted-color)">
              Menu
            </p>
          )}
          <nav className="mt-2 space-y-1.5">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.name}
                  className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? "bg-(--surface-soft) text-(--heading-color)"
                      : "text-(--text-color) hover:bg-(--surface-soft)"
                  } ${isCollapsed ? "justify-center px-2" : ""}`}
                >
                  <span
                    className={`absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r ${
                      isActive
                        ? "bg-(--primary-color)"
                        : "bg-transparent group-hover:bg-(--primary-color)/40"
                    }`}
                  />
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                  <span
                    className={`truncate whitespace-nowrap transition-opacity duration-150 ${
                      isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                    }`}
                    aria-hidden={isCollapsed}
                  >
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
}
