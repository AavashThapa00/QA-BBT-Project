import { cookies } from "next/headers";
import { Collection } from "mongodb";
import { mongoCollections } from "@/lib/mongodb";

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
