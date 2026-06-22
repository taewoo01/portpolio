import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/session";
import type { User } from "@/lib/auth";

export async function getUser(): Promise<User | null> {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  return session.user ?? null;
}
