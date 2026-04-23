"use client";

import { usePathname } from "next/navigation";
import AppSidebar from "@/app/components/common/AppSidebar";
import AppShellHeader from "@/app/components/common/AppShellHeader";

const PUBLIC_ROUTES = ["/login", "/forgot-password", "/reset-password"];

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

export default function AppShellFrame({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (!pathname || isPublicRoute(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex max-w-400 items-start gap-2 bg-(--surface)/70 p-2 shadow-panel backdrop-blur-sm sm:gap-3 sm:p-3">
        <AppSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <AppShellHeader />
          <main className="mt-2 flex-1 rounded-2xl bg-(--surface-soft)/65 mx-3 shadow-card sm:mt-3 sm:mx-4">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
