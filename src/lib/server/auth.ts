import { cookies } from "next/headers";
import type { User } from "@/lib/auth";

export async function getUser(): Promise<User | null> {
  const store = await cookies();
  const value = store.get("user")?.value;
  if (value === "taewoo" || value === "yujin") return value;
  return null;
}
