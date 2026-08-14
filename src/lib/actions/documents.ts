"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/server/auth";
import { isOwner } from "@/lib/auth";
import type { DocumentStatus } from "@/generated/prisma/client";

const VALID_STATUSES: DocumentStatus[] = ["draft", "done", "review"];

async function categoryExists(id: string) {
  const cat = await prisma.workspaceCategory.findUnique({ where: { id }, select: { id: true } });
  return !!cat;
}

export async function createDocumentAction(
  workspaceCategoryId: string,
  folderId: string | null,
  title: string
): Promise<{ id: string } | { error: string }> {
  if (!await categoryExists(workspaceCategoryId)) return { error: "잘못된 카테고리입니다." };
  try {
    const createdBy = await getUser();
    if (!createdBy) return { error: "로그인이 필요합니다." };
    const document = await prisma.document.create({
      data: { workspaceCategoryId, folderId, title, content: "", createdBy },
    });
    revalidatePath("/wiki");
    return { id: document.id };
  } catch (e) {
    console.error(e);
    return { error: "문서 생성에 실패했습니다." };
  }
}

export async function updateDocumentAction(
  workspaceCategoryId: string,
  documentId: string,
  formData: FormData
): Promise<{ error: string } | undefined> {
  const status = formData.get("status") as DocumentStatus;
  if (!VALID_STATUSES.includes(status)) return { error: "잘못된 입력입니다." };

  try {
    const currentUser = await getUser();
    if (!currentUser) return { error: "로그인이 필요합니다." };
    const existing = await prisma.document.findFirst({
      where: { id: documentId },
      select: { createdBy: true },
    });
    if (existing && !isOwner(currentUser, existing.createdBy ?? null)) return { error: "권한이 없습니다." };

    const title = String(formData.get("title") ?? "").trim() || "제목 없음";
    const content = String(formData.get("content") ?? "");
    const tags = Array.from(
      new Set(
        formData
          .getAll("tags")
          .map((tag) => String(tag).trim())
          .filter(Boolean)
      )
    );

    await prisma.document.update({
      where: { id: documentId },
      data: { title, content, status, tags },
    });

    revalidatePath("/wiki");
    revalidatePath(`/wiki/${documentId}`);
  } catch (e) {
    console.error(e);
    return { error: "문서 저장에 실패했습니다." };
  }
}

export async function moveDocumentAction(
  documentId: string,
  targetFolderId: string | null
): Promise<{ error: string } | undefined> {
  try {
    const currentUser = await getUser();
    if (!currentUser) return { error: "로그인이 필요합니다." };
    const existing = await prisma.document.findFirst({
      where: { id: documentId },
      select: { createdBy: true, workspaceCategoryId: true, folderId: true },
    });
    if (!existing) return { error: "문서를 찾을 수 없습니다." };
    if (!isOwner(currentUser, existing.createdBy ?? null)) return { error: "권한이 없습니다." };
    if (existing.folderId === targetFolderId) return;

    if (targetFolderId) {
      const folder = await prisma.folder.findUnique({
        where: { id: targetFolderId },
        select: { workspaceCategoryId: true },
      });
      if (!folder || folder.workspaceCategoryId !== existing.workspaceCategoryId) {
        return { error: "같은 카테고리 안에서만 이동할 수 있습니다." };
      }
    }

    await prisma.document.update({ where: { id: documentId }, data: { folderId: targetFolderId } });

    // 이미 발행된 블로그 글이 있으면 폴더 위치도 같이 옮긴다 (재발행 없이 바로 반영되도록).
    const post = await prisma.blogPost.findFirst({ where: { documentId }, select: { id: true, slug: true } });
    if (post) {
      await prisma.blogPost.update({ where: { id: post.id }, data: { folderId: targetFolderId } });
      revalidatePath("/blog");
      revalidatePath(`/blog/${post.slug}`);
    }

    revalidatePath("/wiki");
  } catch (e) {
    console.error(e);
    return { error: "문서 이동에 실패했습니다." };
  }
}

export async function deleteDocumentAction(
  workspaceCategoryId: string,
  documentId: string
): Promise<{ error: string } | undefined> {
  try {
    const currentUser = await getUser();
    if (!currentUser) return { error: "로그인이 필요합니다." };
    const existing = await prisma.document.findFirst({
      where: { id: documentId },
      select: { createdBy: true },
    });
    if (existing && !isOwner(currentUser, existing.createdBy ?? null)) return { error: "권한이 없습니다." };

    const post = await prisma.blogPost.findFirst({ where: { documentId }, select: { slug: true } });

    await prisma.document.delete({ where: { id: documentId } });

    if (post) {
      revalidatePath("/blog");
      revalidatePath(`/blog/${post.slug}`);
    }
    revalidatePath("/wiki");
  } catch (e) {
    console.error(e);
    return { error: "문서 삭제에 실패했습니다." };
  }
}
