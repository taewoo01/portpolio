"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/server/auth";
import { isOwner } from "@/lib/auth";
import { TASK_WORKSPACE_VALUES } from "@/lib/workspace";
import type { TaskWorkspace } from "@/generated/prisma/client";

function parseTodoInput(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim() || "제목 없음";
  const workspace = formData.get("workspace") as TaskWorkspace;
  const dueDateRaw = String(formData.get("dueDate") ?? "").trim();
  const dueDate = dueDateRaw ? new Date(dueDateRaw) : null;
  const eventId = String(formData.get("eventId") ?? "").trim() || null;

  return { title, workspace, dueDate, eventId };
}

export async function createTodoAction(
  formData: FormData
): Promise<{ error: string } | undefined> {
  const workspace = formData.get("workspace") as TaskWorkspace;
  if (!TASK_WORKSPACE_VALUES.includes(workspace)) return { error: "잘못된 입력입니다." };

  try {
    const data = parseTodoInput(formData);
    const createdBy = await getUser();
    const last = await prisma.todo.aggregate({ _max: { sortOrder: true } });
    const sortOrder = (last._max.sortOrder ?? 0) + 1;
    await prisma.todo.create({ data: { ...data, createdBy, sortOrder } });
    revalidatePath("/calendar");
    revalidatePath("/");
  } catch (e) {
    console.error(e);
    return { error: "할 일 생성에 실패했습니다." };
  }
}

export async function updateTodoAction(
  todoId: string,
  formData: FormData
): Promise<{ error: string } | undefined> {
  const workspace = formData.get("workspace") as TaskWorkspace;
  if (!TASK_WORKSPACE_VALUES.includes(workspace)) return { error: "잘못된 입력입니다." };

  try {
    const currentUser = await getUser();
    const existing = await prisma.todo.findFirst({
      where: { id: todoId },
      select: { createdBy: true },
    });
    if (existing && !isOwner(currentUser, existing.createdBy ?? null)) return { error: "권한이 없습니다." };

    const data = parseTodoInput(formData);
    await prisma.todo.update({ where: { id: todoId }, data });
    revalidatePath("/calendar");
    revalidatePath("/");
  } catch (e) {
    console.error(e);
    return { error: "할 일 수정에 실패했습니다." };
  }
}

export async function deleteTodoAction(
  todoId: string
): Promise<{ error: string } | undefined> {
  try {
    const currentUser = await getUser();
    const existing = await prisma.todo.findFirst({
      where: { id: todoId },
      select: { createdBy: true },
    });
    if (existing && !isOwner(currentUser, existing.createdBy ?? null)) return { error: "권한이 없습니다." };

    await prisma.todo.delete({ where: { id: todoId } });
    revalidatePath("/calendar");
    revalidatePath("/");
  } catch (e) {
    console.error(e);
    return { error: "할 일 삭제에 실패했습니다." };
  }
}

export async function toggleTodoCompleteAction(
  todoId: string,
  completed: boolean
): Promise<{ error: string } | undefined> {
  try {
    const currentUser = await getUser();
    const existing = await prisma.todo.findFirst({
      where: { id: todoId },
      select: { createdBy: true },
    });
    if (existing && !isOwner(currentUser, existing.createdBy ?? null)) return { error: "권한이 없습니다." };

    await prisma.todo.update({ where: { id: todoId }, data: { completed } });
    revalidatePath("/calendar");
    revalidatePath("/");
  } catch (e) {
    console.error(e);
    return { error: "할 일 상태 변경에 실패했습니다." };
  }
}
