"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/server/auth";
import { TASK_WORKSPACE_VALUES } from "@/lib/workspace";
import type { TaskWorkspace } from "@/generated/prisma/client";

function parseEventInput(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim() || "제목 없음";
  const description = String(formData.get("description") ?? "").trim() || null;
  const workspace = formData.get("workspace") as TaskWorkspace;
  const allDay = formData.get("allDay") === "on";
  const startAt = new Date(String(formData.get("startAt") ?? ""));
  const endAtRaw = String(formData.get("endAt") ?? "").trim();
  const endAt = endAtRaw ? new Date(endAtRaw) : null;

  return { title, description, workspace, allDay, startAt, endAt };
}

export async function createEventAction(
  formData: FormData
): Promise<{ error: string } | undefined> {
  const workspace = formData.get("workspace") as TaskWorkspace;
  if (!TASK_WORKSPACE_VALUES.includes(workspace)) return { error: "잘못된 입력입니다." };

  try {
    const data = parseEventInput(formData);
    const createdBy = await getUser();
    await prisma.event.create({ data: { ...data, createdBy } });
    revalidatePath("/calendar");
    revalidatePath("/");
  } catch (e) {
    console.error(e);
    return { error: "일정 생성에 실패했습니다." };
  }
}

export async function updateEventAction(
  eventId: string,
  formData: FormData
): Promise<{ error: string } | undefined> {
  const workspace = formData.get("workspace") as TaskWorkspace;
  if (!TASK_WORKSPACE_VALUES.includes(workspace)) return { error: "잘못된 입력입니다." };

  try {
    const data = parseEventInput(formData);
    await prisma.event.update({ where: { id: eventId }, data });
    revalidatePath("/calendar");
    revalidatePath("/");
  } catch (e) {
    console.error(e);
    return { error: "일정 수정에 실패했습니다." };
  }
}

export async function deleteEventAction(
  eventId: string
): Promise<{ error: string } | undefined> {
  try {
    await prisma.event.delete({ where: { id: eventId } });
    revalidatePath("/calendar");
    revalidatePath("/");
  } catch (e) {
    console.error(e);
    return { error: "일정 삭제에 실패했습니다." };
  }
}
