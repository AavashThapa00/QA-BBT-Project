import { cookies } from "next/headers";
import { Collection } from "mongodb";
import { mongoCollections } from "@/lib/mongodb";
import { createDecipheriv } from "crypto";

const SESSION_COOKIE = "bbt_session";
const SESSION_ENCRYPTION_KEY = process.env.SESSION_ENCRYPTION_KEY || "";

const ALGORITHM = "aes-256-gcm";

function getEncryptionKey(): Buffer | null {
  if (!SESSION_ENCRYPTION_KEY) {
    return null;
  }

  if (SESSION_ENCRYPTION_KEY.length === 64) {
    return Buffer.from(SESSION_ENCRYPTION_KEY, "hex");
  }

  try {
    const base64Key = Buffer.from(SESSION_ENCRYPTION_KEY, "base64");
    if (base64Key.length === 32) {
      return base64Key;
    }
  } catch {
    // ignore
  }

  return null;
}

function decryptSessionId(value: string): string | null {
  if (!value.startsWith("enc.")) {
    return value;
  }

  const key = getEncryptionKey();
  if (!key) {
    return null;
  }

  const parts = value.split(".");
  if (parts.length !== 4) {
    return null;
  }

  const [, ivEncoded, tagEncoded, dataEncoded] = parts;

  try {
    const iv = Buffer.from(ivEncoded, "base64url");
    const tag = Buffer.from(tagEncoded, "base64url");
    const data = Buffer.from(dataEncoded, "base64url");

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    return decrypted.toString("utf8");
  } catch {
    return null;
  }
}

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "admin";
}

export async function getApiUser(): Promise<ApiUser | null> {
  const cookieStore = await cookies();
  const rawSessionId = cookieStore.get(SESSION_COOKIE)?.value;
  const sessionId = rawSessionId ? decryptSessionId(rawSessionId) : null;

  if (!sessionId) {
    return null;
  }

  const sessions =
    (await mongoCollections.sessions()) as unknown as Collection<{
      id: string;
      userId: string;
      expiresAt: Date;
    }>;
  const users = (await mongoCollections.users()) as unknown as Collection<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;

  const session = await sessions.findOne({
    id: sessionId,
    expiresAt: { $gt: new Date() },
  });
  if (!session) {
    return null;
  }

  const row = await users.findOne({ id: session.userId });
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role === "super_admin" ? "super_admin" : "admin",
  };
}
