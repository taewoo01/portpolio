"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function createWorkspaceCategoryAction(
  name: string,
  color: string
): Promise<{ id: string } | { error: string }> {
  if (!name.trim()) return { error: "이름을 입력해주세요." };
  try {
    const count = await prisma.workspaceCategory.count();
    const category = await prisma.workspaceCategory.create({
      data: { name: name.trim(), color, sortOrder: count },
    });
    revalidatePath("/wiki");
    return { id: category.id };
  } catch (e) {
    console.error(e);
    return { error: "카테고리 생성에 실패했습니다." };
  }
}

export async function updateWorkspaceCategoryAction(
  id: string,
  name: string,
  color: string
): Promise<{ error: string } | undefined> {
  if (!name.trim()) return { error: "이름을 입력해주세요." };
  try {
    await prisma.workspaceCategory.update({
      where: { id },
      data: { name: name.trim(), color },
    });
    revalidatePath("/wiki");
  } catch (e) {
    console.error(e);
    return { error: "카테고리 수정에 실패했습니다." };
  }
}

export async function deleteWorkspaceCategoryAction(
  id: string
): Promise<{ error: string } | undefined> {
  try {
    const [folderCount, docCount] = await Promise.all([
      prisma.folder.count({ where: { workspaceCategoryId: id } }),
      prisma.document.count({ where: { workspaceCategoryId: id } }),
    ]);
    if (folderCount > 0 || docCount > 0) {
      return { error: "이 카테고리에 폴더나 문서가 있어 삭제할 수 없습니다." };
    }
    await prisma.workspaceCategory.delete({ where: { id } });
    revalidatePath("/wiki");
  } catch (e) {
    console.error(e);
    return { error: "카테고리 삭제에 실패했습니다." };
  }
}
