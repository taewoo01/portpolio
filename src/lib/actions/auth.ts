"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getIronSession } from "iron-session";
import { prisma } from "@/lib/db";
import { sessionOptions, type SessionData } from "@/lib/session";
import type { User } from "@/lib/auth";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
// 신뢰할 수 있는 리버스 프록시 홉 수. Vercel 등 프록시 1개 뒤면 1(기본값),
// 프록시 없이 직접 노출되는 자체 호스팅/Electron 환경이면 0 (헤더를 신뢰하지 않음).
const TRUSTED_PROXY_COUNT = Math.max(0, parseInt(process.env.TRUSTED_PROXY_COUNT ?? "1", 10) || 0);
// PIN 키 글로벌 백오프: 같은 PIN 실패 누적 시 응답 지연 (락아웃 아님 → 표적 봉쇄 DoS 불가)
const PIN_DELAY_STEP_MS = 500;
const PIN_DELAY_MAX_MS = 5000;
const PIN_DELAY_WINDOW_MS = 15 * 60 * 1000;

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

async function getClientIp(): Promise<string | null> {
  // 신뢰 프록시가 없으면 x-forwarded-for/x-real-ip는 클라이언트가 위조 가능 → IP를 산정하지 않는다.
  if (TRUSTED_PROXY_COUNT === 0) return null;

  const store = await headers();
  const forwarded = store.get("x-forwarded-for");
  if (forwarded) {
    const ips = forwarded.split(",").map((ip) => ip.trim()).filter(Boolean);
    // 신뢰 프록시가 홉마다 값을 하나씩 덧붙이므로, 뒤에서 TRUSTED_PROXY_COUNT번째가 실제 클라이언트 IP
    const idx = ips.length - TRUSTED_PROXY_COUNT;
    if (idx >= 0) return ips[idx];
  }
  return store.get("x-real-ip");
}

function isLocked(attempt: { lockedUntil: Date | null } | null): boolean {
  return !!attempt?.lockedUntil && attempt.lockedUntil > new Date();
}

async function recordFailedAttempt(
  identifier: string,
  current: { attempts: number } | null,
  withLockout: boolean
) {
  const attempts = (current?.attempts ?? 0) + 1;
  const lockedUntil = withLockout && attempts >= MAX_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MS) : null;
  await prisma.loginAttempt.upsert({
    where: { identifier },
    create: { identifier, attempts, lockedUntil },
    update: { attempts, lockedUntil },
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function loginAction(pin: string): Promise<string | null> {
  const ip = await getClientIp();
  const pinKey = `pin:${pin}`;

  const [ipAttempt, pinAttempt] = await Promise.all([
    ip ? prisma.loginAttempt.findUnique({ where: { identifier: ip } }) : Promise.resolve(null),
    prisma.loginAttempt.findUnique({ where: { identifier: pinKey } }),
  ]);

  if (isLocked(ipAttempt) && ipAttempt?.lockedUntil) {
    const minutes = Math.ceil((ipAttempt.lockedUntil.getTime() - Date.now()) / 60000);
    return `너무 많은 시도가 감지되었습니다. ${minutes}분 후 다시 시도하세요.`;
  }

  // 같은 PIN에 대한 최근 실패 누적만큼 응답 지연 (락아웃 아님).
  // IP를 신뢰할 수 없는 환경(TRUSTED_PROXY_COUNT=0)에서도 무차별 대입 속도를 늦추는 2차 방어.
  if (pinAttempt && Date.now() - pinAttempt.updatedAt.getTime() < PIN_DELAY_WINDOW_MS) {
    await sleep(Math.min(pinAttempt.attempts * PIN_DELAY_STEP_MS, PIN_DELAY_MAX_MS));
  }

  const user = getPinMap()[pin];
  if (!user) {
    await Promise.all([
      ip ? recordFailedAttempt(ip, ipAttempt, true) : Promise.resolve(),
      recordFailedAttempt(pinKey, pinAttempt, false),
    ]);
    return "PIN이 올바르지 않습니다.";
  }

  await Promise.all([
    ip && ipAttempt ? prisma.loginAttempt.delete({ where: { identifier: ip } }) : Promise.resolve(),
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
