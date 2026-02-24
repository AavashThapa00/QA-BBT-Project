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
  HiLogout,
} from "react-icons/hi";
import { getCurrentUser, logoutAction } from "@/app/actions/auth";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/", icon: HiHome },
  { name: "Analytics", href: "/analytics", icon: HiChartBar },
  { name: "All Defects", href: "/all-defects", icon: HiViewList },
  { name: "Performance", href: "/team-performance", icon: HiUserGroup },
  { name: "QC Status", href: "/qc-dashboard", icon: HiClipboardCheck },
];

export default function Navigation() {
  const pathname = usePathname();
  const [isAuthed, setIsAuthed] = useState(false);
  const [authRole, setAuthRole] = useState<"super_admin" | "admin" | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
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

  return (
    <nav className="bg-slate-900 border-b border-slate-800 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Title */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">QA</span>
              </div>
              <span className="text-white font-semibold text-lg hidden sm:block">
                Black Box Testing team
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                    ${isActive 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden lg:block">{item.name}</span>
                </Link>
              );
            })}
            {isAuthed ? (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all text-slate-300 hover:bg-slate-800 hover:text-white"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  <HiUserCircle className="w-5 h-5" />
                </button>
                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-lg shadow-xl overflow-hidden"
                  >
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                    >
                      <HiUserCircle className="w-4 h-4" />
                      Profile
                    </Link>
                    {authRole === "super_admin" && (
                      <Link
                        href="/super-admin"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                      >
                        Add Admin
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => logoutAction()}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
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
                  flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                  ${pathname === "/login"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
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
