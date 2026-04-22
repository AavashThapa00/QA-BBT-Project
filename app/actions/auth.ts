"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { backendJson, backendRequest } from "@/lib/backend/request";

const SESSION_COOKIE = "bbt_session";
const SESSION_EXPIRES_COOKIE = "bbt_session_expires_at";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "super_admin" | "admin";
}

type BackendSessionUser = Omit<AuthUser, "phone"> & { phone?: string | null };

async function setSessionCookies(sessionId: string, sessionExpiresAt: string | Date) {
  return cookies().then((cookieStore) => {
    const expiresAt = new Date(sessionExpiresAt);
    cookieStore.set(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      expires: expiresAt,
      path: "/",
    });
    cookieStore.set(SESSION_EXPIRES_COOKIE, String(expiresAt.getTime()), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      expires: expiresAt,
      path: "/",
    });
  });
}

async function clearSessionCookies() {
  const cookieStore = await cookies();
  const expired = new Date(0);

  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expired,
    path: "/",
  });
  cookieStore.set(SESSION_EXPIRES_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expired,
    path: "/",
  });
}

function normalizeUser(user: BackendSessionUser): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone ?? null,
    role: user.role,
  };
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const user = await backendJson<BackendSessionUser>("/api/auth/session", {
      method: "GET",
    });
    return normalizeUser(user);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      await clearSessionCookies();
    }
    return null;
  }
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { success: false, message: "Email and password are required" };
  }

  try {
    const data = await backendJson<BackendSessionUser & {
      sessionId: string;
      sessionExpiresAt: string;
    }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      headers: { "Content-Type": "application/json" },
    });

    await setSessionCookies(data.sessionId, data.sessionExpiresAt);
    redirect("/");
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to log in",
    };
  }
}

export async function requestLoginCodeAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { success: false, message: "Email and password are required" };
  }

  try {
    const data = await backendJson<{
      challengeId: string;
      email: string;
      code?: string;
      message: string;
    }>("/api/auth/request-login-code", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      headers: { "Content-Type": "application/json" },
    });

    return { success: true, ...data };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to request login code",
    };
  }
}

export async function verifyLoginCodeAction(formData: FormData) {
  const challengeId = String(formData.get("challengeId") || "").trim();
  const code = String(formData.get("code") || "").trim();

  if (!challengeId || !code) {
    return { success: false, message: "Verification code is required" };
  }

  try {
    const data = await backendJson<BackendSessionUser & {
      sessionId: string;
      sessionExpiresAt: string;
    }>("/api/auth/verify-login-code", {
      method: "POST",
      body: JSON.stringify({ challengeId, code }),
      headers: { "Content-Type": "application/json" },
    });

    await setSessionCookies(data.sessionId, data.sessionExpiresAt);
    return { success: true, message: "Signed in successfully" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to verify code",
    };
  }
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();

  if (!email) {
    return { success: false, message: "Email is required" };
  }

  try {
    const data = await backendJson<{ message: string; devResetLink?: string }>(
      "/api/auth/password-reset/request",
      {
        method: "POST",
        body: JSON.stringify({ email }),
        headers: { "Content-Type": "application/json" },
      },
    );

    return { success: true, ...data };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Unable to generate reset link",
    };
  }
}

export async function resetPasswordWithTokenAction(formData: FormData) {
  const token = String(formData.get("token") || "").trim();
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (!token) {
    return { success: false, message: "Invalid or missing reset token" };
  }

  if (!password || password.length < 8) {
    return {
      success: false,
      message: "Password must be at least 8 characters",
    };
  }

  if (password !== confirmPassword) {
    return { success: false, message: "Passwords do not match" };
  }

  try {
    const data = await backendJson<{ message: string }>(
      "/api/auth/password-reset/confirm",
      {
        method: "POST",
        body: JSON.stringify({ token, password }),
        headers: { "Content-Type": "application/json" },
      },
    );

    await clearSessionCookies();
    return { success: true, message: data.message };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to reset password",
    };
  }
}

export async function logoutAction() {
  try {
    await backendRequest("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    // Logout should still clear local cookies even if the backend request fails.
  }

  await clearSessionCookies();
  return { success: true, message: "Logged out successfully" };
}

export async function updateProfileAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "Not authenticated" };

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const phone = String(formData.get("phone") || "").trim();

  if (!name || !email) {
    return { success: false, message: "Name and email are required" };
  }

  try {
    const data = await backendJson<BackendSessionUser>("/api/auth/profile", {
      method: "POST",
      body: JSON.stringify({ name, email, phone: phone || null }),
      headers: { "Content-Type": "application/json" },
    });

    return {
      success: true,
      message: "Profile updated",
      user: normalizeUser(data),
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update profile",
    };
  }
}

export async function changePasswordAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "Not authenticated" };

  const currentPassword = String(formData.get("currentPassword") || "");
  const newPassword = String(formData.get("newPassword") || "");

  if (!currentPassword || !newPassword) {
    return { success: false, message: "Both passwords are required" };
  }

  try {
    const data = await backendJson<{ message: string }>("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
      headers: { "Content-Type": "application/json" },
    });

    return { success: true, message: data.message || "Password updated" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to change password",
    };
  }
}

export async function createUser(params: {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role?: "super_admin" | "admin";
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "super_admin") {
    throw new Error("Not authorized");
  }

  const payload = {
    name: params.name.trim(),
    email: params.email.trim().toLowerCase(),
    phone: params.phone?.trim() || null,
    password: params.password,
    role: params.role || "admin",
  };

  await backendJson("/api/users", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  });
}
