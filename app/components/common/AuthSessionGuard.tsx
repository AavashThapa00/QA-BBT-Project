"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const PUBLIC_ROUTES = ["/login", "/forgot-password", "/reset-password"];

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

export default function AuthSessionGuard() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || isPublicRoute(pathname)) return;

    let active = true;

    const verifySession = async () => {
      try {
        const response = await fetch("/api/v1/auth/session", {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        });

        if (!active) return;

        if (response.status === 401) {
          router.replace("/login");
        }
      } catch {
        // Ignore transient network failures.
      }
    };

    void verifySession();

    const interval = window.setInterval(() => {
      void verifySession();
    }, 30000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void verifySession();
      }
    };

    window.addEventListener("focus", verifySession);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", verifySession);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [pathname, router]);

  return null;
}
