import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slug";

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
    orderBy: { publishedAt: "desc" },
  });
}

export async function getPostBySlug(slug: string) {
  return prisma.blogPost.findUnique({ where: { slug } });
}
