import { prisma } from "@/lib/db";

const CATEGORY_SELECT = { select: { id: true, name: true, color: true } } as const;

export async function getRecentDocuments(limit = 5) {
  return prisma.document.findMany({
    include: { workspaceCategory: CATEGORY_SELECT },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
}

export async function getInProgressDocuments(limit = 10) {
  return prisma.document.findMany({
    where: { status: { in: ["draft", "review"] } },
    include: { workspaceCategory: CATEGORY_SELECT },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
}

export async function getRecentBlogPosts(limit = 3) {
  return prisma.blogPost.findMany({
    where: { published: true },
    include: { workspaceCategory: CATEGORY_SELECT },
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
}
