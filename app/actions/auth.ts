"use server";

import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";

const SESSION_COOKIE = "bbt_session";
const SESSION_DAYS = 7;

interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "super_admin" | "admin";
}

const normalizeRole = (role?: string): AuthUser["role"] => {
  return role === "super_admin" ? "super_admin" : "admin";
};

const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
};

const verifyPassword = (password: string, stored: string) => {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derived = scryptSync(password, salt, 64);
  const storedBuffer = Buffer.from(hash, "hex");
  if (storedBuffer.length !== derived.length) return false;
  return timingSafeEqual(storedBuffer, derived);
};

const createSession = async (userId: string) => {
  const sessionId = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.query(
    `INSERT INTO session (id, "userId", "expiresAt") VALUES ($1, $2, $3)`,
    [sessionId, userId, expiresAt]
  );
  return { sessionId, expiresAt };
};

const getSessionId = async () => {
  const cookieStore = (await cookies()) as any;
  const cookie = cookieStore.get(SESSION_COOKIE);
  return cookie?.value || null;
};

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const sessionId = await getSessionId();
    if (!sessionId) return null;

    const result = await db.query(
      `SELECT u.id, u.name, u.email, u.phone, u.role
       FROM session s
       JOIN "user" u ON u.id = s."userId"
       WHERE s.id = $1 AND s."expiresAt" > NOW()
       LIMIT 1`,
      [sessionId]
    );

    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      role: normalizeRole(row.role),
    };
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { success: false, message: "Email and password are required" };
  }

  const result = await db.query(
    `SELECT id, password_hash FROM "user" WHERE email = $1 LIMIT 1`,
    [email]
  );

  if (result.rows.length === 0) {
    return { success: false, message: "Invalid email or password" };
  }

  const row = result.rows[0];
  const valid = verifyPassword(password, row.password_hash);
  if (!valid) {
    return { success: false, message: "Invalid email or password" };
  }

  const { sessionId, expiresAt } = await createSession(row.id);
  const cookieStore = (await cookies()) as any;
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });

  redirect("/profile");
}

export async function logoutAction() {
  try {
    const sessionId = await getSessionId();
    if (sessionId) {
      await db.query(`DELETE FROM session WHERE id = $1`, [sessionId]);
    }
  } catch (error) {
    console.error("Error during logout:", error);
  }

  const cookieStore = (await cookies()) as any;
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0),
    path: "/",
  });

  redirect("/login");
}

export async function updateProfileAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "Not authenticated" };

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const phone = String(formData.get("phone") || "").trim();

  if (!name || !email) {
    return { success: false, message: "Name and email are required" };
  }

  const emailCheck = await db.query(
    `SELECT id FROM "user" WHERE email = $1 AND id <> $2 LIMIT 1`,
    [email, user.id]
  );

  if (emailCheck.rows.length > 0) {
    return { success: false, message: "Email is already in use" };
  }

  await db.query(
    `UPDATE "user" SET name = $1, email = $2, phone = $3, "updatedAt" = NOW() WHERE id = $4`,
    [name, email, phone || null, user.id]
  );

  return { success: true, message: "Profile updated" };
}

export async function changePasswordAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "Not authenticated" };

  const currentPassword = String(formData.get("currentPassword") || "");
  const newPassword = String(formData.get("newPassword") || "");

  if (!currentPassword || !newPassword) {
    return { success: false, message: "Both passwords are required" };
  }

  const result = await db.query(
    `SELECT password_hash FROM "user" WHERE id = $1 LIMIT 1`,
    [user.id]
  );

  if (result.rows.length === 0) {
    return { success: false, message: "User not found" };
  }

  const valid = verifyPassword(currentPassword, result.rows[0].password_hash);
  if (!valid) {
    return { success: false, message: "Current password is incorrect" };
  }

  const newHash = hashPassword(newPassword);
  await db.query(
    `UPDATE "user" SET password_hash = $1, "updatedAt" = NOW() WHERE id = $2`,
    [newHash, user.id]
  );

  return { success: true, message: "Password updated" };
}

export async function createUser(params: {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role?: "super_admin" | "admin";
}) {
  const name = params.name.trim();
  const email = params.email.trim().toLowerCase();
  const phone = params.phone?.trim() || null;
  const role = normalizeRole(params.role);

  const existing = await db.query(
    `SELECT id FROM "user" WHERE email = $1 LIMIT 1`,
    [email]
  );

  if (existing.rows.length > 0) {
    throw new Error("User with this email already exists");
  }

  const passwordHash = hashPassword(params.password);
  await db.query(
    `INSERT INTO "user" (id, name, email, phone, password_hash, role)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)`,
    [name, email, phone, passwordHash, role]
  );
}
