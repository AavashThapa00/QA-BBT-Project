import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("bbt_session");
  const isLogin = request.nextUrl.pathname.startsWith("/login");
  const isForgotPassword = request.nextUrl.pathname.startsWith("/forgot-password");
  const isResetPassword = request.nextUrl.pathname.startsWith("/reset-password");
  const isNext = request.nextUrl.pathname.startsWith("/_next");
  const isApi = request.nextUrl.pathname.startsWith("/api");
  const isStatic =
    request.nextUrl.pathname === "/favicon.ico" ||
    request.nextUrl.pathname === "/robots.txt" ||
    request.nextUrl.pathname === "/sitemap.xml";
  const isPublicAuthRoute = isLogin || isForgotPassword || isResetPassword;

  if (!session && !isPublicAuthRoute && !isNext && !isApi && !isStatic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (isPublicAuthRoute && session) {
    const url = request.nextUrl.clone();
    url.pathname = "/profile";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|robots.txt|sitemap.xml).*)"],
};
