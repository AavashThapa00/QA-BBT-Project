import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const userAgent = request.headers.get("user-agent") || "";
  const session = request.cookies.get("bbt_session");
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
    !session &&
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
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
