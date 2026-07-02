"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/server/auth";
import { isOwner } from "@/lib/auth";
import { TASK_WORKSPACE_VALUES } from "@/lib/workspace";
import type { TaskWorkspace } from "@/generated/prisma/client";

// datetime-local / date 문자열을 클라이언트 로컬 시간으로 정확히 UTC 변환
// tzOffset: getTimezoneOffset() 값 (-540 for KST UTC+9)
function parseLocalDateTime(value: string, tzOffset: number): Date {
  // date-only "2024-01-16" → "2024-01-16T00:00" 처리
  const normalized = value.length === 10 ? `${value}T00:00` : value;
  // "Z" 붙여 UTC로 파싱 후, tzOffset 적용해 실제 UTC 시각으로 보정
  return new Date(new Date(`${normalized}Z`).getTime() + tzOffset * 60000);
}

function parseEventInput(formData: FormData) {
  const tzOffset = parseInt(String(formData.get("tzOffset") ?? "0")); // e.g. -540 for KST
  const title = String(formData.get("title") ?? "").trim() || "제목 없음";
  const description = String(formData.get("description") ?? "").trim() || null;
  const workspace = formData.get("workspace") as TaskWorkspace;
  const allDay = formData.get("allDay") === "on";
  const recurrenceRaw = String(formData.get("recurrence") ?? "").trim();
  const recurrence = recurrenceRaw.startsWith("weekly") ? recurrenceRaw : null;
  const startAt = parseLocalDateTime(String(formData.get("startAt") ?? ""), tzOffset);
  const endAtRaw = String(formData.get("endAt") ?? "").trim();
  const endAt = endAtRaw ? parseLocalDateTime(endAtRaw, tzOffset) : null;

  return { title, description, workspace, allDay, recurrence, startAt, endAt };
}

export async function createEventAction(
  formData: FormData
): Promise<{ error: string } | undefined> {
  const workspace = formData.get("workspace") as TaskWorkspace;
  if (!TASK_WORKSPACE_VALUES.includes(workspace)) return { error: "잘못된 입력입니다." };

  try {
    const data = parseEventInput(formData);
    const createdBy = await getUser();
    if (!createdBy) return { error: "로그인이 필요합니다." };
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
    const currentUser = await getUser();
    if (!currentUser) return { error: "로그인이 필요합니다." };
    const existing = await prisma.event.findFirst({
      where: { id: eventId },
      select: { createdBy: true },
    });
    if (existing && !isOwner(currentUser, existing.createdBy ?? null)) return { error: "권한이 없습니다." };

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
    const currentUser = await getUser();
    if (!currentUser) return { error: "로그인이 필요합니다." };
    const existing = await prisma.event.findFirst({
      where: { id: eventId },
      select: { createdBy: true },
    });
    if (existing && !isOwner(currentUser, existing.createdBy ?? null)) return { error: "권한이 없습니다." };

    await prisma.event.delete({ where: { id: eventId } });
    revalidatePath("/calendar");
    revalidatePath("/");
  } catch (e) {
    console.error(e);
    return { error: "일정 삭제에 실패했습니다." };
  }
}
