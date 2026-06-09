"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@/lib/auth";

function getPinMap(): Record<string, User> {
  return {
    [process.env.PIN_TAEWOO ?? "0923"]: "taewoo",
    [process.env.PIN_YUJIN ?? "1221"]: "yujin",
  };
}

export async function loginAction(pin: string): Promise<string | null> {
  const user = getPinMap()[pin];
  if (!user) return "PIN이 올바르지 않습니다.";

  const store = await cookies();
  store.set("user", user, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30일
  });
  return null;
}

export async function logoutAction() {
  const store = await cookies();
  store.delete("user");
  redirect("/login");
}
