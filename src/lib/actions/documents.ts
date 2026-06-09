"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/server/auth";
import { isOwner } from "@/lib/auth";
import type { DocumentStatus, Workspace } from "@/generated/prisma/client";

const VALID_WORKSPACES: Workspace[] = ["dev", "study"];
const VALID_STATUSES: DocumentStatus[] = ["draft", "done", "review"];

export async function createDocumentAction(
  workspace: Workspace,
  folderId: string | null,
  title: string
): Promise<{ id: string } | { error: string }> {
  if (!VALID_WORKSPACES.includes(workspace)) return { error: "잘못된 입력입니다." };
  try {
    const createdBy = await getUser();
    const document = await prisma.document.create({
      data: { workspace, folderId, title, content: "", createdBy },
    });
    revalidatePath(`/${workspace}`);
    return { id: document.id };
  } catch (e) {
    console.error(e);
    return { error: "문서 생성에 실패했습니다." };
  }
}

export async function updateDocumentAction(
  workspace: Workspace,
  documentId: string,
  formData: FormData
): Promise<{ error: string } | undefined> {
  if (!VALID_WORKSPACES.includes(workspace)) return { error: "잘못된 입력입니다." };
  const status = formData.get("status") as DocumentStatus;
  if (!VALID_STATUSES.includes(status)) return { error: "잘못된 입력입니다." };

  try {
    const currentUser = await getUser();
    const existing = await prisma.document.findFirst({
      where: { id: documentId, workspace },
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

    await prisma.document.updateMany({
      where: { id: documentId, workspace },
      data: { title, content, status, tags },
    });

    revalidatePath(`/${workspace}`);
    revalidatePath(`/${workspace}/${documentId}`);
  } catch (e) {
    console.error(e);
    return { error: "문서 저장에 실패했습니다." };
  }
}

export async function deleteDocumentAction(
  workspace: Workspace,
  documentId: string
): Promise<{ error: string } | undefined> {
  if (!VALID_WORKSPACES.includes(workspace)) return { error: "잘못된 입력입니다." };
  try {
    const currentUser = await getUser();
    const existing = await prisma.document.findFirst({
      where: { id: documentId, workspace },
      select: { createdBy: true },
    });
    if (existing && !isOwner(currentUser, existing.createdBy ?? null)) return { error: "권한이 없습니다." };

    await prisma.document.deleteMany({ where: { id: documentId, workspace } });
    revalidatePath(`/${workspace}`);
  } catch (e) {
    console.error(e);
    return { error: "문서 삭제에 실패했습니다." };
  }
}
