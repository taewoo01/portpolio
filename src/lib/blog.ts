import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slug";
import { visibilityWhere } from "@/lib/auth";
import type { User } from "@/lib/auth";

const CATEGORY_SELECT = { select: { id: true, name: true, color: true } } as const;
const FOLDER_SELECT = { select: { id: true, name: true } } as const;

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

export async function getPublishedPosts(currentUser: User | null = null) {
  return prisma.blogPost.findMany({
    where: { published: true, ...visibilityWhere(currentUser) },
    include: {
      workspaceCategory: CATEGORY_SELECT,
      folder: FOLDER_SELECT,
      document: { select: { createdAt: true } },
    },
    orderBy: { publishedAt: "desc" },
  });
}

export async function getPostBySlug(slug: string, currentUser: User | null = null) {
  return prisma.blogPost.findFirst({
    where: { slug, ...visibilityWhere(currentUser) },
    include: { workspaceCategory: CATEGORY_SELECT, folder: FOLDER_SELECT },
  });
}
