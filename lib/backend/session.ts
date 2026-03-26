import { cookies } from "next/headers";
import { db } from "@/lib/prisma";

const SESSION_COOKIE = "bbt_session";

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "admin";
}

export async function getApiUser(): Promise<ApiUser | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sessionId) {
    return null;
  }

  const result = await db.query<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>(
    `SELECT u.id, u.name, u.email, u.role
     FROM session s
     JOIN "user" u ON u.id = s."userId"
     WHERE s.id = $1 AND s."expiresAt" > NOW()
     LIMIT 1`,
    [sessionId]
  );

  const row = result.rows[0];
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
