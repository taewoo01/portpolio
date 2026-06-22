import { prisma } from "@/lib/db";
import { visibilityWhere } from "@/lib/auth";
import type { User } from "@/lib/auth";

const CATEGORY_SELECT = { select: { id: true, name: true, color: true } } as const;

export async function getRecentDocuments(limit = 5, currentUser: User | null = null) {
  return prisma.document.findMany({
    where: visibilityWhere(currentUser),
    include: { workspaceCategory: CATEGORY_SELECT },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
}

export async function getInProgressDocuments(limit = 10, currentUser: User | null = null) {
  return prisma.document.findMany({
    where: { status: { in: ["draft", "review"] }, ...visibilityWhere(currentUser) },
    include: { workspaceCategory: CATEGORY_SELECT },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
}

export async function getRecentBlogPosts(limit = 3, currentUser: User | null = null) {
  return prisma.blogPost.findMany({
    where: { published: true, ...visibilityWhere(currentUser) },
    include: { workspaceCategory: CATEGORY_SELECT },
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
}
