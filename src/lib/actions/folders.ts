"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/server/auth";
import { isOwner } from "@/lib/auth";
import type { Workspace } from "@/generated/prisma/client";

const VALID_WORKSPACES: Workspace[] = ["dev", "study"];

export async function createFolderAction(
  workspace: Workspace,
  name: string,
  parentId: string | null
): Promise<{ error: string } | undefined> {
  if (!VALID_WORKSPACES.includes(workspace)) return { error: "잘못된 입력입니다." };
  try {
    const createdBy = await getUser();
    await prisma.folder.create({ data: { workspace, name, parentId, createdBy } });
    revalidatePath(`/${workspace}`);
  } catch (e) {
    console.error(e);
    return { error: "폴더 생성에 실패했습니다." };
  }
}

export async function renameFolderAction(
  workspace: Workspace,
  folderId: string,
  name: string
): Promise<{ error: string } | undefined> {
  if (!VALID_WORKSPACES.includes(workspace)) return { error: "잘못된 입력입니다." };
  try {
    const currentUser = await getUser();
    const existing = await prisma.folder.findFirst({
      where: { id: folderId },
      select: { createdBy: true },
    });
    if (existing && !isOwner(currentUser, existing.createdBy ?? null)) return { error: "권한이 없습니다." };

    await prisma.folder.updateMany({ where: { id: folderId, workspace }, data: { name } });
    revalidatePath(`/${workspace}`);
  } catch (e) {
    console.error(e);
    return { error: "폴더 이름 변경에 실패했습니다." };
  }
}

export async function deleteFolderAction(
  workspace: Workspace,
  folderId: string
): Promise<{ error: string } | undefined> {
  if (!VALID_WORKSPACES.includes(workspace)) return { error: "잘못된 입력입니다." };
  try {
    const currentUser = await getUser();
    const existing = await prisma.folder.findFirst({
      where: { id: folderId },
      select: { createdBy: true },
    });
    if (existing && !isOwner(currentUser, existing.createdBy ?? null)) return { error: "권한이 없습니다." };

    await prisma.folder.deleteMany({ where: { id: folderId, workspace } });
    revalidatePath(`/${workspace}`);
  } catch (e) {
    console.error(e);
    return { error: "폴더 삭제에 실패했습니다." };
  }
}
