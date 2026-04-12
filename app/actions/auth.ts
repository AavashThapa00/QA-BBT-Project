"use server";

import {
  createHash,
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
} from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Collection, Filter } from "mongodb";
import { mongoCollections } from "@/lib/mongodb";
import {
  sendLoginVerificationCodeEmail,
  sendPasswordResetEmail,
} from "@/lib/email";

const SESSION_COOKIE = "bbt_session";
const SESSION_DAYS = 7;
const PASSWORD_RESET_MINUTES = 30;
const LOGIN_CODE_MINUTES = 10;

type SessionDoc = { id: string; userId: string; expiresAt: Date };
type UserDoc = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role?: string;
  password_hash?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

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

const generateId = () => randomUUID();

const verifyPassword = (password: string, stored: string) => {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derived = scryptSync(password, salt, 64);
  const storedBuffer = Buffer.from(hash, "hex");
  if (storedBuffer.length !== derived.length) return false;
  return timingSafeEqual(storedBuffer, derived);
};

const createSession = async (userId: string) => {
  const sessions =
    (await mongoCollections.sessions()) as unknown as Collection<SessionDoc>;
  const sessionId = generateId();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await sessions.insertOne({ id: sessionId, userId, expiresAt });
  return { sessionId, expiresAt };
};

const setSessionCookie = async (sessionId: string, expiresAt: Date) => {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
};

const getSessionId = async () => {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE);
  return cookie?.value || null;
};

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const sessionId = await getSessionId();
    if (!sessionId) return null;

    const sessions =
      (await mongoCollections.sessions()) as unknown as Collection<SessionDoc>;
    const users =
      (await mongoCollections.users()) as unknown as Collection<UserDoc>;

    const session = await sessions.findOne({
      id: sessionId,
      expiresAt: { $gt: new Date() },
    } as Filter<SessionDoc>);
    if (!session) return null;

    const row = await users.findOne({ id: session.userId });
    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone ?? null,
      role: normalizeRole(row.role),
    };
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { success: false, message: "Email and password are required" };
  }

  const users =
    (await mongoCollections.users()) as unknown as Collection<UserDoc>;
  const row = await users.findOne(
    { email },
    { projection: { id: 1, password_hash: 1 } },
  );

  if (!row) {
    return { success: false, message: "Invalid email or password" };
  }

  if (!row.password_hash) {
    return { success: false, message: "Invalid email or password" };
  }

  const valid = verifyPassword(password, row.password_hash);
  if (!valid) {
    return { success: false, message: "Invalid email or password" };
  }

  const { sessionId, expiresAt } = await createSession(row.id);
  await setSessionCookie(sessionId, expiresAt);

  redirect("/");
}

export async function requestLoginCodeAction(formData: FormData) {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return {
      success: false,
      message: "Email and password are required",
    };
  }

  try {
    const users =
      (await mongoCollections.users()) as unknown as Collection<UserDoc>;
    const loginCodes =
      (await mongoCollections.loginVerificationCodes()) as unknown as Collection<{
        id: string;
        userId: string;
        code_hash: string;
        expiresAt: Date;
        usedAt?: Date | null;
      }>;

    const row = await users.findOne(
      { email },
      { projection: { id: 1, password_hash: 1 } },
    );

    if (!row) {
      return { success: false, message: "Invalid email or password" };
    }

    if (!row.password_hash) {
      return { success: false, message: "Invalid email or password" };
    }

    const valid = verifyPassword(password, row.password_hash);
    if (!valid) {
      return { success: false, message: "Invalid email or password" };
    }

    const code = generateLoginCode();
    const codeHash = hashToken(code);
    const expiresAt = new Date(Date.now() + LOGIN_CODE_MINUTES * 60 * 1000);

    const challengeId = generateId();
    await loginCodes.insertOne({
      id: challengeId,
      userId: row.id,
      code_hash: codeHash,
      expiresAt,
      usedAt: null,
    });
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
    const loginCodes =
      (await mongoCollections.loginVerificationCodes()) as unknown as Collection<{
        id: string;
        userId: string;
        code_hash: string;
        usedAt?: Date | null;
        expiresAt: Date;
      }>;

    const row = await loginCodes.findOne({
      id: challengeId,
      $or: [{ usedAt: null }, { usedAt: { $exists: false } }],
      expiresAt: { $gt: new Date() },
    });

    if (!row) {
      return { success: false, message: "Code is invalid or expired" };
    }

    if (row.code_hash !== codeHash) {
      return { success: false, message: "Code is invalid or expired" };
    }

    userId = row.userId;

    await loginCodes.updateOne(
      { id: challengeId },
      { $set: { usedAt: new Date() } },
    );
    await loginCodes.deleteMany({
      userId,
      id: { $ne: challengeId },
      $or: [{ usedAt: null }, { usedAt: { $exists: false } }],
    });
  } catch (error) {
    console.error("Error verifying login code:", error);
    return { success: false, message: "Failed to verify code" };
  }

  const { sessionId, expiresAt } = await createSession(userId);
  await setSessionCookie(sessionId, expiresAt);

  redirect("/");
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();

  if (!email) {
    return { success: false, message: "Email is required" };
  }

  const genericMessage =
    "If an account exists, a reset link has been generated. Use the link below.";

  try {
    const users = (await mongoCollections.users()) as unknown as Collection<{
      id: string;
      email: string;
    }>;
    const passwordResetTokens =
      (await mongoCollections.passwordResetTokens()) as unknown as Collection<{
        id: string;
        userId: string;
        token_hash: string;
        expiresAt: Date;
        usedAt?: Date | null;
      }>;

    const user = await users.findOne({ email }, { projection: { id: 1 } });

    if (!user) {
      return { success: true, message: genericMessage };
    }

    const userId = user.id;
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_MINUTES * 60 * 1000);

    await passwordResetTokens.insertOne({
      id: generateId(),
      userId,
      token_hash: tokenHash,
      expiresAt,
      usedAt: null,
    });

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
    return {
      success: false,
      message: "Password must be at least 8 characters",
    };
  }

  if (password !== confirmPassword) {
    return { success: false, message: "Passwords do not match" };
  }

  const tokenHash = hashToken(token);

  try {
    const users = (await mongoCollections.users()) as unknown as Collection<{
      id: string;
      password_hash: string;
      updatedAt?: Date;
    }>;
    const passwordResetTokens =
      (await mongoCollections.passwordResetTokens()) as unknown as Collection<{
        id: string;
        userId: string;
        token_hash: string;
        expiresAt: Date;
        usedAt?: Date | null;
      }>;
    const sessions =
      (await mongoCollections.sessions()) as unknown as Collection<{
        userId: string;
      }>;

    const tokenRow = await passwordResetTokens.findOne({
      token_hash: tokenHash,
      $or: [{ usedAt: null }, { usedAt: { $exists: false } }],
      expiresAt: { $gt: new Date() },
    });

    if (!tokenRow) {
      return { success: false, message: "Reset link is invalid or expired" };
    }

    const userId = tokenRow.userId;
    const tokenId = tokenRow.id;

    const newHash = hashPassword(password);

    await users.updateOne(
      { id: userId },
      { $set: { password_hash: newHash, updatedAt: new Date() } },
    );
    await passwordResetTokens.updateOne(
      { id: tokenId },
      { $set: { usedAt: new Date() } },
    );
    await sessions.deleteMany({ userId });

    return {
      success: true,
      message: "Password has been reset. Please sign in.",
    };
  } catch (error) {
    console.error("Error resetting password:", error);
    return { success: false, message: "Failed to reset password" };
  }
}

export async function logoutAction() {
  try {
    const sessionId = await getSessionId();
    if (sessionId) {
      const sessions =
        (await mongoCollections.sessions()) as unknown as Collection<{
          id: string;
        }>;
      await sessions.deleteOne({ id: sessionId });
    }
  } catch (error) {
    console.error("Error during logout:", error);
  }

  const cookieStore = await cookies();
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
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const phone = String(formData.get("phone") || "").trim();

  if (!name || !email) {
    return { success: false, message: "Name and email are required" };
  }

  const users = (await mongoCollections.users()) as unknown as Collection<{
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    updatedAt?: Date;
  }>;

  const emailCheck = await users.findOne(
    { email, id: { $ne: user.id } },
    { projection: { id: 1 } },
  );

  if (emailCheck) {
    return { success: false, message: "Email is already in use" };
  }

  await users.updateOne(
    { id: user.id },
    { $set: { name, email, phone: phone || null, updatedAt: new Date() } },
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

  const users = (await mongoCollections.users()) as unknown as Collection<{
    id: string;
    password_hash: string;
    updatedAt?: Date;
  }>;
  const row = await users.findOne(
    { id: user.id },
    { projection: { password_hash: 1 } },
  );

  if (!row) {
    return { success: false, message: "User not found" };
  }

  const valid = verifyPassword(currentPassword, row.password_hash);
  if (!valid) {
    return { success: false, message: "Current password is incorrect" };
  }

  const newHash = hashPassword(newPassword);
  await users.updateOne(
    { id: user.id },
    { $set: { password_hash: newHash, updatedAt: new Date() } },
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

  const users = (await mongoCollections.users()) as unknown as Collection<{
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    password_hash: string;
    role: "super_admin" | "admin";
    createdAt: Date;
    updatedAt: Date;
  }>;

  const existing = await users.findOne({ email }, { projection: { id: 1 } });

  if (existing) {
    throw new Error("User with this email already exists");
  }

  const passwordHash = hashPassword(params.password);
  const now = new Date();
  await users.insertOne({
    id: generateId(),
    name,
    email,
    phone,
    password_hash: passwordHash,
    role,
    createdAt: now,
    updatedAt: now,
  });
}
