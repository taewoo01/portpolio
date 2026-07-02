"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/server/auth";

export async function startSessionAction(title: string): Promise<string> {
  if (!(await getUser())) throw new Error("로그인이 필요합니다.");
  const session = await prisma.studySession.create({
    data: { title, startAt: new Date() },
  });
  revalidatePath("/timer");
  return session.id;
}

export async function stopSessionAction(id: string): Promise<void> {
  if (!(await getUser())) throw new Error("로그인이 필요합니다.");
  const session = await prisma.studySession.findUnique({ where: { id } });
  if (!session || session.endAt) return;

  const endAt = new Date();
  const duration = Math.floor((endAt.getTime() - session.startAt.getTime()) / 1000);
  await prisma.studySession.update({
    where: { id },
    data: { endAt, duration },
  });
  revalidatePath("/timer");
}
