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
  const { PIN_TAEWOO, PIN_YUJIN, PIN_HOYOUNG, PIN_DONGHYUN } = process.env;
  if (!PIN_TAEWOO || !PIN_YUJIN || !PIN_HOYOUNG || !PIN_DONGHYUN) {
    throw new Error("PIN_TAEWOO / PIN_YUJIN / PIN_HOYOUNG / PIN_DONGHYUN 환경변수가 설정되지 않았습니다.");
  }
  return {
    [PIN_TAEWOO]: "taewoo",
    [PIN_YUJIN]: "yujin",
    [PIN_HOYOUNG]: "hoyoung",
    [PIN_DONGHYUN]: "donghyun",
  };
}

async function getClientIp(): Promise<string> {
  const store = await headers();
  const forwarded = store.get("x-forwarded-for");
  if (forwarded) {
    const ips = forwarded.split(",").map((ip) => ip.trim()).filter(Boolean);
    if (ips.length > 0) return ips[ips.length - 1];
  }
  return store.get("x-real-ip") ?? "unknown";
}

function isLocked(attempt: { lockedUntil: Date | null } | null): boolean {
  return !!attempt?.lockedUntil && attempt.lockedUntil > new Date();
}

async function recordFailedAttempt(identifier: string, current: { attempts: number } | null) {
  const attempts = (current?.attempts ?? 0) + 1;
  const lockedUntil = attempts >= MAX_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MS) : null;
  await prisma.loginAttempt.upsert({
    where: { identifier },
    create: { identifier, attempts, lockedUntil },
    update: { attempts, lockedUntil },
  });
}

export async function loginAction(pin: string): Promise<string | null> {
  const ip = await getClientIp();
  const pinKey = `pin:${pin}`;

  const [ipAttempt, pinAttempt] = await Promise.all([
    prisma.loginAttempt.findUnique({ where: { identifier: ip } }),
    prisma.loginAttempt.findUnique({ where: { identifier: pinKey } }),
  ]);

  const locked = [ipAttempt, pinAttempt].find(isLocked);
  if (locked?.lockedUntil) {
    const minutes = Math.ceil((locked.lockedUntil.getTime() - Date.now()) / 60000);
    return `너무 많은 시도가 감지되었습니다. ${minutes}분 후 다시 시도하세요.`;
  }

  const user = getPinMap()[pin];
  if (!user) {
    await Promise.all([
      recordFailedAttempt(ip, ipAttempt),
      recordFailedAttempt(pinKey, pinAttempt),
    ]);
    return "PIN이 올바르지 않습니다.";
  }

  await Promise.all([
    ipAttempt ? prisma.loginAttempt.delete({ where: { identifier: ip } }) : Promise.resolve(),
    pinAttempt ? prisma.loginAttempt.delete({ where: { identifier: pinKey } }) : Promise.resolve(),
  ]);

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
