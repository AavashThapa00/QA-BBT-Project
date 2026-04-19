import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "bbt_session";
const SESSION_EXPIRES_COOKIE = "bbt_session_expires_at";

function hasValidSession(request: NextRequest) {
  const session = request.cookies.get(SESSION_COOKIE)?.value;
  if (!session) return false;

  const expiresAtRaw = request.cookies.get(SESSION_EXPIRES_COOKIE)?.value;
  if (!expiresAtRaw) return false;

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt)) return false;

  return expiresAt > Date.now();
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const userAgent = request.headers.get("user-agent") || "";
  const hasSession = hasValidSession(request);
  const isLogin = pathname.startsWith("/login");
  const isForgotPassword = pathname.startsWith("/forgot-password");
  const isResetPassword = pathname.startsWith("/reset-password");
  const isNext = pathname.startsWith("/_next");
  const isApi = pathname.startsWith("/api");
  const isPublicFile = /\.[^/]+$/.test(pathname);
  const isStatic =
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml";
  const isSocialCrawler =
    /viber|facebookexternalhit|twitterbot|x\.com|linkedinbot|slackbot|discordbot|whatsapp|telegrambot|skypeuripreview|bot|crawler|spider|preview|unfurl/i.test(
      userAgent,
    );
  const isPublicAuthRoute = isLogin || isForgotPassword || isResetPassword;

  if (
    !hasSession &&
    !isPublicAuthRoute &&
    !isNext &&
    !isApi &&
    !isStatic &&
    !isPublicFile
  ) {
    if (isSocialCrawler && request.method === "GET") {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.rewrite(url);
    }

    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const response = NextResponse.redirect(url);
    response.cookies.set(SESSION_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      expires: new Date(0),
      path: "/",
    });
    response.cookies.set(SESSION_EXPIRES_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      expires: new Date(0),
      path: "/",
    });
    return response;
  }

  if (isPublicAuthRoute && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/profile";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
