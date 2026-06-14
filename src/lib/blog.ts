import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slug";

const CATEGORY_SELECT = { select: { id: true, name: true, color: true } } as const;

export async function ensureUniqueSlug(slug: string, excludeId?: string): Promise<string> {
  let candidate = slug;
  let suffix = 2;

  while (true) {
    const existing = await prisma.blogPost.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${slug}-${suffix}`;
    suffix += 1;
  }
}

export async function getPublishedPosts() {
  return prisma.blogPost.findMany({
    where: { published: true },
    include: { workspaceCategory: CATEGORY_SELECT },
    orderBy: { publishedAt: "desc" },
  });
}

export async function getPostBySlug(slug: string) {
  return prisma.blogPost.findUnique({
    where: { slug },
    include: { workspaceCategory: CATEGORY_SELECT },
  });
}
