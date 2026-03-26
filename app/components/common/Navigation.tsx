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
  HiMoon,
  HiSun,
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
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [authRole, setAuthRole] = useState<"super_admin" | "admin" | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const applyTheme = (nextTheme: "light" | "dark") => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(nextTheme);
    root.setAttribute("data-theme", nextTheme);
    localStorage.setItem("theme", nextTheme);
    setTheme(nextTheme);
  };

  const toggleTheme = () => {
    const root = document.documentElement;
    const nextTheme: "light" | "dark" = root.classList.contains("dark") ? "light" : "dark";
    applyTheme(nextTheme);
  };

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      return;
    }

    const root = document.documentElement;
    if (root.classList.contains("light") || root.getAttribute("data-theme") === "light") {
      setTheme("light");
      return;
    }
    setTheme("dark");
  }, []);

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
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener("mousedown", handleClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Keep auth screens distraction-free.
  if (pathname === "/login") {
    return null;
  }

  const navShellClass =
    theme === "light"
      ? "sticky top-0 z-50 backdrop-blur-xl bg-white/90 border-b border-slate-300 shadow-md"
      : "sticky top-0 z-50 backdrop-blur-xl bg-slate-950/60 border-b border-slate-800/60 shadow-2xl shadow-slate-950/30";

  return (
    <nav className={navShellClass}>
      <div className="w-full px-2 sm:px-4 lg:px-10 xl:px-12">
        <div className="flex items-center justify-between min-h-16 py-2.5 gap-2 sm:gap-3">
          {/* Logo/Title */}
          <div className="flex-shrink-0 min-w-0">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 ring-1 ring-white/10 transition-all duration-300 group-hover:scale-105 group-hover:shadow-purple-500/40">
                <span className="text-white font-black text-sm tracking-wide">BBT</span>
              </div>
              <div className="hidden sm:block leading-tight">
                <p className="text-white font-semibold text-sm md:text-base bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                  Black Box Testing
                </p>
                <p className="hidden md:block text-slate-400 text-xs">QA Intelligence Platform</p>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-1 min-w-0">
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
                    ${isActive 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-blue-500/40 shadow-lg shadow-blue-500/25' 
                      : theme === "light"
                        ? 'text-slate-700 border-transparent hover:bg-slate-100 hover:border-slate-300 hover:text-slate-900'
                        : 'text-slate-300 border-transparent hover:bg-slate-800/70 hover:border-slate-700 hover:text-white'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden lg:inline">{item.name}</span>
                </Link>
              );
            })}
            </div>

            {isAuthed ? (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 border border-transparent ${
                    theme === "light"
                      ? "text-slate-700 hover:bg-slate-100 hover:border-slate-300 hover:text-slate-900"
                      : "text-slate-300 hover:bg-slate-800/70 hover:border-slate-700 hover:text-white"
                  }`}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  <HiUserCircle className="w-5 h-5" />
                </button>
                {menuOpen && (
                  <div
                    role="menu"
                    className={`absolute right-0 mt-2 w-52 backdrop-blur-xl rounded-xl shadow-2xl overflow-hidden border ${
                      theme === "light"
                        ? "bg-white border-slate-300"
                        : "bg-slate-900/95 border-slate-700/70"
                    }`}
                  >
                    <Link
                      href="/profile"
                      className={`flex items-center gap-2 px-4 py-2.5 text-sm ${
                        theme === "light"
                          ? "text-slate-900 hover:bg-slate-100"
                          : "text-slate-200 hover:bg-slate-800/80"
                      }`}
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                    >
                      <HiUserCircle className="w-4 h-4" />
                      Profile
                    </Link>
                    {authRole === "super_admin" && (
                      <Link
                        href="/super-admin"
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm ${
                          theme === "light"
                            ? "text-slate-900 hover:bg-slate-100"
                            : "text-slate-200 hover:bg-slate-800/80"
                        }`}
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                      >
                        <HiPlus className="w-4 h-4" />
                        Add Admin
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        toggleTheme();
                        setMenuOpen(false);
                      }}
                      className={`w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm ${
                        theme === "light"
                          ? "text-slate-900 hover:bg-slate-100"
                          : "text-slate-200 hover:bg-slate-800/80"
                      }`}
                      role="menuitem"
                    >
                      {theme === "dark" ? <HiSun className="w-4 h-4" /> : <HiMoon className="w-4 h-4" />}
                      {theme === "dark" ? "Light Mode" : "Dark Mode"}
                    </button>
                    <button
                      type="button"
                      onClick={() => logoutAction()}
                      className={`w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm ${
                        theme === "light"
                          ? "text-slate-900 hover:bg-slate-100"
                          : "text-slate-200 hover:bg-slate-800/80"
                      }`}
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
                  ${pathname === "/login"
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white border-blue-500/40 shadow-lg shadow-blue-500/25"
                    : theme === "light"
                      ? "text-slate-700 border-transparent hover:bg-slate-100 hover:border-slate-300 hover:text-slate-900"
                      : "text-slate-300 border-transparent hover:bg-slate-800/70 hover:border-slate-700 hover:text-white"
                  }
                `}
              >
                <HiUserCircle className="w-4 h-4" />
                <span className="hidden lg:block">Login</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

