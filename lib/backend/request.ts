import "server-only";

import { cookies } from "next/headers";
import { randomBytes } from "crypto";

const backendBaseUrl =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:5000";

const CSRF_COOKIE = process.env.CSRF_COOKIE_NAME || "bbt_csrf";
const CSRF_HEADER = process.env.CSRF_HEADER_NAME || "x-csrf-token";

function isUnsafeMethod(method?: string) {
  const normalized = (method || "GET").toUpperCase();
  return !["GET", "HEAD", "OPTIONS"].includes(normalized);
}

function ensureCsrfToken(
  cookieStore: ReturnType<typeof cookies>,
  headerBag: Headers,
  method?: string,
) {
  if (!isUnsafeMethod(method)) {
    return;
  }

  let token = cookieStore.get(CSRF_COOKIE)?.value;

  if (!token) {
    token = randomBytes(32).toString("base64url");
    cookieStore.set(CSRF_COOKIE, token, {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 2,
    });
  }

  if (!headerBag.has(CSRF_HEADER)) {
    headerBag.set(CSRF_HEADER, token);
  }
}

export type BackendErrorPayload = {
  message: string;
  details?: unknown;
};

export type BackendEnvelope<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: BackendErrorPayload;
    };

function joinCookieHeader(cookiePairs: Array<{ name: string; value: string }>) {
  return cookiePairs
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
}

export async function backendRequest(path: string, init: RequestInit = {}) {
  const cookieStore = await cookies();
  const headers = new Headers(init.headers || {});

  ensureCsrfToken(cookieStore, headers, init.method);

  const cookieHeader = joinCookieHeader(cookieStore.getAll());
  const url = `${backendBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;

  if (cookieHeader && !headers.has("cookie")) {
    headers.set("cookie", cookieHeader);
  }

  if (
    init.body &&
    !headers.has("content-type") &&
    !(init.body instanceof FormData)
  ) {
    headers.set("content-type", "application/json");
  }

  return fetch(url, {
    ...init,
    headers,
    cache: "no-store",
  });
}

export async function backendJson<T>(path: string, init: RequestInit = {}) {
  const response = await backendRequest(path, init);
  const payload = (await response
    .json()
    .catch(() => null)) as BackendEnvelope<T> | null;

  if (!response.ok || !payload) {
    const message =
      payload && !payload.success
        ? payload.error.message
        : `Request failed with status ${response.status}`;
    const error = new Error(message) as Error & {
      details?: unknown;
      status?: number;
    };
    if (payload && !payload.success) {
      error.details = payload.error.details;
    }
    error.status = response.status;
    throw error;
  }

  if (!payload.success) {
    const error = new Error(payload.error.message) as Error & {
      details?: unknown;
    };
    error.details = payload.error.details;
    throw error;
  }

  return payload.data;
}

export function getBackendBaseUrl() {
  return backendBaseUrl;
}
