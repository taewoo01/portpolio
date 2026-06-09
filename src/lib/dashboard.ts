import { prisma } from "@/lib/db";

export async function getRecentDocuments(limit = 5) {
  const [dev, study] = await Promise.all([
    prisma.document.findMany({
      where: { workspace: "dev" },
      orderBy: { updatedAt: "desc" },
      take: limit,
    }),
    prisma.document.findMany({
      where: { workspace: "study" },
      orderBy: { updatedAt: "desc" },
      take: limit,
    }),
  ]);

  return { dev, study };
}

export async function getInProgressDocuments(limit = 10) {
  return prisma.document.findMany({
    where: { status: { in: ["draft", "review"] } },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
}

export async function getRecentBlogPosts(limit = 3) {
  return prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
}
