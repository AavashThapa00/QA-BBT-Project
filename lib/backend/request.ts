import "server-only";

import { cookies } from "next/headers";

const backendBaseUrl =
  process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

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
  return cookiePairs.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
}

export async function backendRequest(path: string, init: RequestInit = {}) {
  const cookieStore = await cookies();
  const cookieHeader = joinCookieHeader(cookieStore.getAll());
  const url = `${backendBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(init.headers || {});

  if (cookieHeader && !headers.has("cookie")) {
    headers.set("cookie", cookieHeader);
  }

  if (init.body && !headers.has("content-type") && !(init.body instanceof FormData)) {
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
  const payload = (await response.json().catch(() => null)) as BackendEnvelope<T> | null;

  if (!response.ok || !payload) {
    const message =
      payload && !payload.success ? payload.error.message : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  if (!payload.success) {
    throw new Error(payload.error.message);
  }

  return payload.data;
}

export function getBackendBaseUrl() {
  return backendBaseUrl;
}
