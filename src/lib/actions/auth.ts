"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getIronSession } from "iron-session";
import { prisma } from "@/lib/db";
import { sessionOptions, type SessionData } from "@/lib/session";
import type { User } from "@/lib/auth";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

function getPinMap(): Record<string, User> {
  const { PIN_TAEWOO, PIN_YUJIN, PIN_HOYOUNG } = process.env;
  if (!PIN_TAEWOO || !PIN_YUJIN || !PIN_HOYOUNG) {
    throw new Error("PIN_TAEWOO / PIN_YUJIN / PIN_HOYOUNG 환경변수가 설정되지 않았습니다.");
  }
  return { [PIN_TAEWOO]: "taewoo", [PIN_YUJIN]: "yujin", [PIN_HOYOUNG]: "hoyoung" };
}

async function getClientIp(): Promise<string> {
  const store = await headers();
  return store.get("x-forwarded-for")?.split(",")[0].trim() ?? store.get("x-real-ip") ?? "unknown";
}

export async function loginAction(pin: string): Promise<string | null> {
  const identifier = await getClientIp();

  const attempt = await prisma.loginAttempt.findUnique({ where: { identifier } });
  if (attempt?.lockedUntil && attempt.lockedUntil > new Date()) {
    const minutes = Math.ceil((attempt.lockedUntil.getTime() - Date.now()) / 60000);
    return `너무 많은 시도가 감지되었습니다. ${minutes}분 후 다시 시도하세요.`;
  }

  const user = getPinMap()[pin];
  if (!user) {
    const attempts = (attempt?.attempts ?? 0) + 1;
    const lockedUntil = attempts >= MAX_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MS) : null;
    await prisma.loginAttempt.upsert({
      where: { identifier },
      create: { identifier, attempts, lockedUntil },
      update: { attempts, lockedUntil },
    });
    return "PIN이 올바르지 않습니다.";
  }

  if (attempt) await prisma.loginAttempt.delete({ where: { identifier } });

  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  session.user = user;
  await session.save();
  return null;
}

export async function logoutAction() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  session.destroy();
  redirect("/login");
}
