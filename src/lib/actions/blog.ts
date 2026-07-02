"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/server/auth";
import { isOwner } from "@/lib/auth";
import { ensureUniqueSlug } from "@/lib/blog";
import { slugify } from "@/lib/slug";

export async function publishDocumentAction(
  documentId: string,
  formData: FormData
): Promise<{ error: string } | undefined> {
  try {
    const currentUser = await getUser();
    if (!currentUser) return { error: "로그인이 필요합니다." };
    const document = await prisma.document.findUnique({ where: { id: documentId } });
    if (!document) return { error: "문서를 찾을 수 없습니다." };
    if (!isOwner(currentUser, document.createdBy ?? null)) return { error: "권한이 없습니다." };

    const title = String(formData.get("title") ?? "").trim() || document.title;
    const excerpt = String(formData.get("excerpt") ?? "").trim() || null;
    const slugInput = String(formData.get("slug") ?? "").trim();

    const existing = await prisma.blogPost.findFirst({ where: { documentId } });
    const slug = await ensureUniqueSlug(slugify(slugInput || title), existing?.id);

    const data = {
      workspaceCategoryId: document.workspaceCategoryId,
      folderId: document.folderId,
      title,
      slug,
      content: document.content,
      excerpt,
      createdBy: existing?.createdBy ?? currentUser,
      published: true,
      publishedAt: new Date(),
    };

    const post = existing
      ? await prisma.blogPost.update({ where: { id: existing.id }, data })
      : await prisma.blogPost.create({ data: { ...data, documentId } });

    revalidatePath("/blog");
    revalidatePath(`/blog/${post.slug}`);
    revalidatePath(`/wiki/${documentId}`);
  } catch (e) {
    console.error(e);
    return { error: "블로그 발행에 실패했습니다." };
  }
}

export async function unpublishPostAction(
  postId: string
): Promise<{ error: string } | undefined> {
  try {
    const currentUser = await getUser();
    if (!currentUser) return { error: "로그인이 필요합니다." };
    const post = await prisma.blogPost.findUnique({
      where: { id: postId },
      select: { createdBy: true },
    });
    if (post && !isOwner(currentUser, post.createdBy ?? null)) return { error: "권한이 없습니다." };

    const updated = await prisma.blogPost.update({
      where: { id: postId },
      data: { published: false },
    });

    revalidatePath("/blog");
    revalidatePath(`/blog/${updated.slug}`);
    if (updated.documentId) revalidatePath(`/wiki/${updated.documentId}`);
  } catch (e) {
    console.error(e);
    return { error: "블로그 비공개 처리에 실패했습니다." };
  }
}

export async function deleteBlogPostAction(
  postId: string
): Promise<{ error: string } | undefined> {
  try {
    const currentUser = await getUser();
    if (!currentUser) return { error: "로그인이 필요합니다." };
    const post = await prisma.blogPost.findUnique({
      where: { id: postId },
      select: { createdBy: true },
    });
    if (post && !isOwner(currentUser, post.createdBy ?? null)) return { error: "권한이 없습니다." };

    const deleted = await prisma.blogPost.delete({ where: { id: postId } });

    revalidatePath("/blog");
    revalidatePath(`/blog/${deleted.slug}`);
    if (deleted.documentId) revalidatePath(`/wiki/${deleted.documentId}`);
  } catch (e) {
    console.error(e);
    return { error: "블로그 글 삭제에 실패했습니다." };
  }
}
