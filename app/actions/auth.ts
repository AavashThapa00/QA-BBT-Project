"use server";

import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";
import { sendLoginVerificationCodeEmail, sendPasswordResetEmail } from "@/lib/email";

const SESSION_COOKIE = "bbt_session";
const SESSION_DAYS = 7;
const PASSWORD_RESET_MINUTES = 30;
const LOGIN_CODE_MINUTES = 10;

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

const hashToken = (token: string) => {
  return createHash("sha256").update(token).digest("hex");
};

const generateLoginCode = () => {
  return String(Math.floor(100000 + Math.random() * 900000));
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

const setSessionCookie = async (sessionId: string, expiresAt: Date) => {
  const cookieStore = (await cookies()) as any;
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
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
  await setSessionCookie(sessionId, expiresAt);

  redirect("/");
}

export async function requestLoginCodeAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return {
      success: false,
      message: "Email and password are required",
    };
  }

  try {
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

    const code = generateLoginCode();
    const codeHash = hashToken(code);
    const expiresAt = new Date(Date.now() + LOGIN_CODE_MINUTES * 60 * 1000);

    const insertResult = await db.query<{ id: string }>(
      `INSERT INTO login_verification_code (id, "userId", code_hash, "expiresAt")
       VALUES (gen_random_uuid(), $1, $2, $3)
       RETURNING id`,
      [row.id, codeHash, expiresAt]
    );

    const challengeId = insertResult.rows[0].id;
    const emailResult = await sendLoginVerificationCodeEmail({
      to: email,
      code,
      expiresInMinutes: LOGIN_CODE_MINUTES,
    });

    return {
      success: true,
      message: emailResult.sent
        ? "Verification code sent to your email"
        : "SMTP not configured. Use the development code below.",
      challengeId,
      email,
      code: emailResult.sent ? undefined : code,
    };
  } catch (error) {
    console.error("Error requesting login code:", error);
    return { success: false, message: "Failed to send verification code" };
  }
}

export async function verifyLoginCodeAction(formData: FormData) {
  const challengeId = String(formData.get("challengeId") || "").trim();
  const code = String(formData.get("code") || "").trim();

  if (!challengeId || !code) {
    return { success: false, message: "Verification code is required" };
  }

  const codeHash = hashToken(code);
  let userId = "";

  try {
    const result = await db.query(
      `SELECT id, "userId", code_hash
       FROM login_verification_code
       WHERE id = $1
         AND "usedAt" IS NULL
         AND "expiresAt" > NOW()
       LIMIT 1`,
      [challengeId]
    );

    if (result.rows.length === 0) {
      return { success: false, message: "Code is invalid or expired" };
    }

    const row = result.rows[0];
    if (row.code_hash !== codeHash) {
      return { success: false, message: "Code is invalid or expired" };
    }

    userId = row.userId as string;

    await db.query("BEGIN");
    await db.query(
      `UPDATE login_verification_code SET "usedAt" = NOW() WHERE id = $1`,
      [challengeId]
    );
    await db.query(
      `DELETE FROM login_verification_code WHERE "userId" = $1 AND "usedAt" IS NULL`,
      [userId]
    );
    await db.query("COMMIT");
  } catch (error) {
    await db.query("ROLLBACK").catch(() => undefined);
    console.error("Error verifying login code:", error);
    return { success: false, message: "Failed to verify code" };
  }

  const { sessionId, expiresAt } = await createSession(userId);
  await setSessionCookie(sessionId, expiresAt);

  redirect("/");
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();

  if (!email) {
    return { success: false, message: "Email is required" };
  }

  const genericMessage =
    "If an account exists, a reset link has been generated. Use the link below.";

  try {
    const userResult = await db.query(
      `SELECT id FROM "user" WHERE email = $1 LIMIT 1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return { success: true, message: genericMessage };
    }

    const userId = userResult.rows[0].id as string;
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_MINUTES * 60 * 1000);

    await db.query(
      `INSERT INTO password_reset_token (id, "userId", token_hash, "expiresAt")
       VALUES (gen_random_uuid(), $1, $2, $3)`,
      [userId, tokenHash, expiresAt]
    );

    const appBaseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
    const resetLink = `${appBaseUrl}/reset-password?token=${rawToken}`;

    const emailResult = await sendPasswordResetEmail({
      to: email,
      resetLink,
    });

    return {
      success: true,
      message: genericMessage,
      resetLink: emailResult.sent ? undefined : resetLink,
    };
  } catch (error) {
    console.error("Error creating password reset token:", error);
    return { success: false, message: "Unable to generate reset link" };
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
    return { success: false, message: "Password must be at least 8 characters" };
  }

  if (password !== confirmPassword) {
    return { success: false, message: "Passwords do not match" };
  }

  const tokenHash = hashToken(token);

  try {
    const tokenResult = await db.query(
      `SELECT id, "userId"
       FROM password_reset_token
       WHERE token_hash = $1
         AND "usedAt" IS NULL
         AND "expiresAt" > NOW()
       LIMIT 1`,
      [tokenHash]
    );

    if (tokenResult.rows.length === 0) {
      return { success: false, message: "Reset link is invalid or expired" };
    }

    const tokenRow = tokenResult.rows[0];
    const userId = tokenRow.userId as string;
    const tokenId = tokenRow.id as string;

    const newHash = hashPassword(password);

    await db.query("BEGIN");
    await db.query(
      `UPDATE "user" SET password_hash = $1, "updatedAt" = NOW() WHERE id = $2`,
      [newHash, userId]
    );
    await db.query(
      `UPDATE password_reset_token SET "usedAt" = NOW() WHERE id = $1`,
      [tokenId]
    );
    await db.query(`DELETE FROM session WHERE "userId" = $1`, [userId]);
    await db.query("COMMIT");

    return { success: true, message: "Password has been reset. Please sign in." };
  } catch (error) {
    await db.query("ROLLBACK").catch(() => undefined);
    console.error("Error resetting password:", error);
    return { success: false, message: "Failed to reset password" };
  }
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
