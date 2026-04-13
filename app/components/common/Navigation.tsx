"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  HiHome,
  HiChartBar,
  HiViewList,
  HiClipboardCheck,
  HiShieldCheck,
  HiUserCircle,
  HiPlus,
  HiLogout,
  HiArrowRight,
  HiMenu,
  HiX,
} from "react-icons/hi";
import { getCurrentUser, logoutAction } from "@/app/actions/auth";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/", icon: HiHome },
  { name: "Manual Sheet", href: "/manual-entry", icon: HiViewList },
  { name: "Test Cycle", href: "/test-execution", icon: HiArrowRight },
  { name: "Analytics & Performance", href: "/analytics", icon: HiChartBar },
  { name: "All Defects", href: "/all-defects", icon: HiViewList },
  { name: "QC Status", href: "/qc-dashboard", icon: HiClipboardCheck },
];

function BrandLogo() {
  return (
    <div className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-(--border-color) bg-(--surface) text-(--primary-color) transition-colors group-hover:border-(--primary-color) sm:h-10 sm:w-10">
      <HiShieldCheck
        className="relative h-5.5 w-5.5 text-(--primary-color)"
        aria-hidden="true"
      />
    </div>
  );
}

export default function Navigation() {
  const pathname = usePathname();
  const [isAuthed, setIsAuthed] = useState(false);
  const [authRole, setAuthRole] = useState<"super_admin" | "admin" | null>(
    null,
  );
  const [userName, setUserName] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;
    getCurrentUser()
      .then((user) => {
        if (!mounted) return;
        setIsAuthed(!!user);
        setAuthRole(user?.role ?? null);
        setUserName(user?.name ?? "");
      })
      .catch(() => {
        if (!mounted) return;
        setIsAuthed(false);
        setAuthRole(null);
        setUserName("");
      });
    return () => {
      mounted = false;
    };
  }, []);

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
    setMenuOpen(false);
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setMobileNavOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (
      !mobileNavOpen ||
      pathname === "/login" ||
      pathname === "/forgot-password"
    )
      return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [mobileNavOpen]);

  // Keep auth screens distraction-free.
  if (pathname === "/login" || pathname === "/forgot-password") {
    return null;
  }

  const userInitials = (userName || "User")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <nav className="sticky top-0 z-50 border-b border-(--border-color) bg-(--surface) shadow-sm">
      <div className="w-full px-2 sm:px-4 lg:px-8">
        <div className="mx-auto w-full max-w-screen-2xl">
          <div className="flex items-center justify-between min-h-16 py-2.5 gap-2 sm:gap-3">
            {/* Logo/Title */}
            <div className="shrink-0 min-w-0">
              <Link
                href="/"
                className="group inline-flex items-center"
                aria-label="Go to dashboard home"
              >
                <BrandLogo />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1 min-w-0">
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pr-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`
                      flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap border
                      ${
                        isActive
                          ? "bg-(--primary-color) text-white border-(--primary-color)"
                          : "text-(--text-color) border-transparent hover:bg-slate-50 hover:border-(--border-color) hover:text-(--heading-color)"
                      }
                    `}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>

              {isAuthed ? (
                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setMenuOpen((open) => !open)}
                    className="flex items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 text-sm font-medium text-(--text-color) transition-colors hover:border-(--border-color) hover:bg-slate-50 hover:text-(--heading-color)"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    aria-label="Open user menu"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-(--primary-color) text-xs font-semibold text-white">
                      {userInitials || "U"}
                    </span>
                  </button>
                  {menuOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 mt-2 w-52 overflow-hidden rounded-lg border border-(--border-color) bg-(--surface) shadow-lg"
                    >
                      <Link
                        href="/profile"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-(--text-color) hover:bg-slate-50"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                      >
                        <HiUserCircle className="w-4 h-4" />
                        Profile
                      </Link>
                      {authRole === "super_admin" && (
                        <Link
                          href="/super-admin"
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-(--text-color) hover:bg-slate-50"
                          role="menuitem"
                          onClick={() => setMenuOpen(false)}
                        >
                          <HiPlus className="w-4 h-4" />
                          Add Admin
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => logoutAction()}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-(--text-color) hover:bg-rose-50"
                        role="menuitem"
                      >
                        <HiLogout className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border
                  ${
                    pathname === "/login"
                      ? "bg-(--primary-color) text-white border-(--primary-color)"
                      : "text-(--text-color) border-transparent hover:bg-slate-50 hover:border-(--border-color) hover:text-(--heading-color)"
                  }
                `}
                >
                  <HiUserCircle className="w-4 h-4" />
                  <span>Login</span>
                </Link>
              )}
            </div>

            {/* Mobile Navigation Trigger */}
            <div className="flex lg:hidden items-center gap-1">
              {isAuthed ? (
                <Link
                  href="/profile"
                  className="flex items-center justify-center rounded-lg border border-transparent p-1 text-(--text-color) hover:border-(--border-color) hover:bg-slate-50 hover:text-(--heading-color)"
                  aria-label="Open profile"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-(--primary-color) text-xs font-semibold text-white">
                    {userInitials || "U"}
                  </span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center justify-center rounded-lg border border-transparent p-2 text-(--text-color) hover:border-(--border-color) hover:bg-slate-50 hover:text-(--heading-color)"
                  aria-label="Open login"
                >
                  <HiUserCircle className="w-5 h-5" />
                </Link>
              )}

              <button
                type="button"
                onClick={() => setMobileNavOpen((open) => !open)}
                className="flex items-center justify-center rounded-lg border border-transparent p-2 text-(--text-color) hover:border-(--border-color) hover:bg-slate-50 hover:text-(--heading-color)"
                aria-label={
                  mobileNavOpen
                    ? "Close navigation menu"
                    : "Open navigation menu"
                }
                aria-expanded={mobileNavOpen}
                aria-controls="mobile-navigation-panel"
              >
                {mobileNavOpen ? (
                  <HiX className="w-5 h-5" />
                ) : (
                  <HiMenu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-[rgba(15,23,42,0.35)] lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        >
          <div
            id="mobile-navigation-panel"
            className="absolute right-0 top-0 h-full w-[min(85vw,360px)] overflow-y-auto border-l border-(--border-color) bg-(--surface) p-4 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-(--heading-color)">
                Navigation
              </p>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="rounded-lg p-2 text-(--text-color) hover:bg-[rgba(165,214,167,0.16)] hover:text-(--heading-color)"
                aria-label="Close navigation menu"
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileNavOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium border transition-all duration-200
                      ${
                        isActive
                          ? "bg-(--primary-color) text-white border-[rgba(76,175,80,0.28)] shadow-lg shadow-[rgba(76,175,80,0.2)]"
                          : "text-(--text-color) border-(--border-color) hover:bg-[rgba(165,214,167,0.14)] hover:border-[rgba(76,175,80,0.22)]"
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            <div className="mt-5 border-t border-(--border-color) pt-4">
              {isAuthed ? (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setMobileNavOpen(false)}
                    className="flex items-center gap-3 rounded-xl border border-(--border-color) px-3 py-3 text-sm font-medium text-(--text-color) hover:bg-[rgba(165,214,167,0.14)]"
                  >
                    <HiUserCircle className="w-4 h-4" />
                    <span>Profile</span>
                  </Link>

                  {authRole === "super_admin" && (
                    <Link
                      href="/super-admin"
                      onClick={() => setMobileNavOpen(false)}
                      className="mt-2 flex items-center gap-3 rounded-xl border border-(--border-color) px-3 py-3 text-sm font-medium text-(--text-color) hover:bg-[rgba(165,214,167,0.14)]"
                    >
                      <HiPlus className="w-4 h-4" />
                      <span>Add Admin</span>
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={() => logoutAction()}
                    className="mt-2 flex w-full items-center gap-3 rounded-xl border border-(--border-color) px-3 py-3 text-left text-sm font-medium text-(--text-color) hover:bg-[rgba(229,57,53,0.09)]"
                  >
                    <HiLogout className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileNavOpen(false)}
                  className="flex items-center gap-3 rounded-xl border border-(--border-color) px-3 py-3 text-sm font-medium text-(--text-color) hover:bg-[rgba(165,214,167,0.14)]"
                >
                  <HiUserCircle className="w-4 h-4" />
                  <span>Login</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
