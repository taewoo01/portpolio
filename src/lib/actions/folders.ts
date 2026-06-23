"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/server/auth";
import { isOwner, ALL_USERS } from "@/lib/auth";

async function categoryExists(id: string) {
  const cat = await prisma.workspaceCategory.findUnique({ where: { id }, select: { id: true } });
  return !!cat;
}

function sanitizeVisibleTo(visibleTo: string[]): string[] {
  return visibleTo.filter((u) => (ALL_USERS as string[]).includes(u));
}

export async function createFolderAction(
  workspaceCategoryId: string,
  name: string,
  parentId: string | null,
  visibleTo: string[] = []
): Promise<{ error: string } | undefined> {
  if (!await categoryExists(workspaceCategoryId)) return { error: "잘못된 카테고리입니다." };
  try {
    const createdBy = await getUser();
    await prisma.folder.create({ data: { workspaceCategoryId, name, parentId, createdBy, visibleTo: sanitizeVisibleTo(visibleTo) } });
    revalidatePath("/wiki");
  } catch (e) {
    console.error(e);
    return { error: "폴더 생성에 실패했습니다." };
  }
}

export async function renameFolderAction(
  workspaceCategoryId: string,
  folderId: string,
  name: string,
  visibleTo?: string[]
): Promise<{ error: string } | undefined> {
  try {
    const currentUser = await getUser();
    const existing = await prisma.folder.findFirst({
      where: { id: folderId },
      select: { createdBy: true },
    });
    if (existing && !isOwner(currentUser, existing.createdBy ?? null)) return { error: "권한이 없습니다." };
    await prisma.folder.update({
      where: { id: folderId },
      data: { name, ...(visibleTo !== undefined ? { visibleTo: sanitizeVisibleTo(visibleTo) } : {}) },
    });
    revalidatePath("/wiki");
  } catch (e) {
    console.error(e);
    return { error: "폴더 이름 변경에 실패했습니다." };
  }
}

export async function deleteFolderAction(
  workspaceCategoryId: string,
  folderId: string
): Promise<{ error: string } | undefined> {
  try {
    const currentUser = await getUser();
    const existing = await prisma.folder.findFirst({
      where: { id: folderId },
      select: { createdBy: true },
    });
    if (existing && !isOwner(currentUser, existing.createdBy ?? null)) return { error: "권한이 없습니다." };
    await prisma.folder.delete({ where: { id: folderId } });
    revalidatePath("/wiki");
  } catch (e) {
    console.error(e);
    return { error: "폴더 삭제에 실패했습니다." };
  }
}
