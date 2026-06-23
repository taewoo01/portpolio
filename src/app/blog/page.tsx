import { prisma } from "@/lib/db";
import { getPublishedPosts } from "@/lib/blog";
import { getUser } from "@/lib/server/auth";
import { BlogList } from "@/components/blog/blog-list";

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const currentUser = await getUser();
  const [posts, categories] = await Promise.all([
    getPublishedPosts(currentUser),
    prisma.workspaceCategory.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  return <BlogList posts={posts} categories={categories} initialCategory={category ?? "all"} />;
}
