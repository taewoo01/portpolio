import { prisma } from "@/lib/db";
import { getPublishedPosts } from "@/lib/blog";
import { BlogList } from "@/components/blog/blog-list";

export default async function BlogPage() {
  const [posts, categories] = await Promise.all([
    getPublishedPosts(),
    prisma.workspaceCategory.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  return <BlogList posts={posts} categories={categories} />;
}
