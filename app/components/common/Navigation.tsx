"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  HiHome,
  HiChartBar,
  HiViewList,
  HiUserGroup,
  HiClipboardCheck,
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
  { name: "Analytics", href: "/analytics", icon: HiChartBar },
  { name: "All Defects", href: "/all-defects", icon: HiViewList },
  { name: "Performance", href: "/team-performance", icon: HiUserGroup },
  { name: "QC Status", href: "/qc-dashboard", icon: HiClipboardCheck },
];

export default function Navigation() {
  const pathname = usePathname();
  const [isAuthed, setIsAuthed] = useState(false);
  const [authRole, setAuthRole] = useState<"super_admin" | "admin" | null>(
    null,
  );
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
      })
      .catch(() => {
        if (!mounted) return;
        setIsAuthed(false);
        setAuthRole(null);
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

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/60 border-b border-slate-800/60 shadow-2xl shadow-slate-950/30">
      <div className="w-full px-2 sm:px-4 lg:px-10 xl:px-12">
        <div className="flex items-center justify-between min-h-16 py-2.5 gap-2 sm:gap-3">
          {/* Logo/Title */}
          <div className="shrink-0 min-w-0">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 via-purple-500 to-pink-500 shadow-lg shadow-blue-500/30 ring-1 ring-white/10 transition-all duration-300 group-hover:scale-105 group-hover:shadow-purple-500/40 sm:h-10 sm:w-10">
                <span className="text-white font-black text-sm tracking-wide">
                  BBT
                </span>
              </div>
              <div className="hidden sm:block leading-tight">
                <p className="text-sm font-semibold text-white md:text-base">
                  Black Box Testing
                </p>
                <p className="hidden md:block text-slate-400 text-xs">
                  QA Intelligence Platform
                </p>
              </div>
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
                      flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap border
                      ${
                        isActive
                          ? "bg-linear-to-r from-blue-600 to-purple-600 text-white border-blue-500/40 shadow-lg shadow-blue-500/25"
                          : "text-slate-300 border-transparent hover:bg-slate-800/70 hover:border-slate-700 hover:text-white"
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
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 text-slate-300 border border-transparent hover:bg-slate-800/70 hover:border-slate-700 hover:text-white"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  aria-label="Open user menu"
                >
                  <HiUserCircle className="w-5 h-5" />
                </button>
                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-52 backdrop-blur-xl bg-slate-900/95 border border-slate-700/70 rounded-xl shadow-2xl overflow-hidden"
                  >
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-800/80"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                    >
                      <HiUserCircle className="w-4 h-4" />
                      Profile
                    </Link>
                    {authRole === "super_admin" && (
                      <Link
                        href="/super-admin"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-800/80"
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
                      className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-800/80"
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
                  flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 border
                  ${
                    pathname === "/login"
                      ? "bg-linear-to-r from-blue-600 to-purple-600 text-white border-blue-500/40 shadow-lg shadow-blue-500/25"
                      : "text-slate-300 border-transparent hover:bg-slate-800/70 hover:border-slate-700 hover:text-white"
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
                className="flex items-center justify-center p-2 rounded-xl text-slate-300 border border-transparent hover:bg-slate-800/70 hover:border-slate-700 hover:text-white"
                aria-label="Open profile"
              >
                <HiUserCircle className="w-5 h-5" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="flex items-center justify-center p-2 rounded-xl text-slate-300 border border-transparent hover:bg-slate-800/70 hover:border-slate-700 hover:text-white"
                aria-label="Open login"
              >
                <HiUserCircle className="w-5 h-5" />
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMobileNavOpen((open) => !open)}
              className="flex items-center justify-center p-2 rounded-xl text-slate-300 border border-transparent hover:bg-slate-800/70 hover:border-slate-700 hover:text-white"
              aria-label={
                mobileNavOpen ? "Close navigation menu" : "Open navigation menu"
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

      {mobileNavOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm"
          onClick={() => setMobileNavOpen(false)}
        >
          <div
            id="mobile-navigation-panel"
            className="absolute right-0 top-0 h-full w-[min(85vw,360px)] bg-slate-900 border-l border-slate-700/70 shadow-2xl p-4 overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-slate-100 font-semibold text-sm">Navigation</p>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
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
                          ? "bg-linear-to-r from-blue-600 to-purple-600 text-white border-blue-500/40 shadow-lg shadow-blue-500/20"
                          : "text-slate-200 border-slate-700/60 hover:bg-slate-800/80 hover:border-slate-600"
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-700/70">
              {isAuthed ? (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setMobileNavOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-200 border border-slate-700/60 hover:bg-slate-800/80"
                  >
                    <HiUserCircle className="w-4 h-4" />
                    <span>Profile</span>
                  </Link>

                  {authRole === "super_admin" && (
                    <Link
                      href="/super-admin"
                      onClick={() => setMobileNavOpen(false)}
                      className="mt-2 flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-200 border border-slate-700/60 hover:bg-slate-800/80"
                    >
                      <HiPlus className="w-4 h-4" />
                      <span>Add Admin</span>
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={() => logoutAction()}
                    className="mt-2 w-full text-left flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-200 border border-slate-700/60 hover:bg-slate-800/80"
                  >
                    <HiLogout className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileNavOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-200 border border-slate-700/60 hover:bg-slate-800/80"
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
