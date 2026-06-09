"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function startSessionAction(title: string): Promise<string> {
  const session = await prisma.studySession.create({
    data: { title, startAt: new Date() },
  });
  revalidatePath("/timer");
  return session.id;
}

export async function stopSessionAction(id: string): Promise<void> {
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
