import { startOfMonth } from "date-fns";
import { prisma } from "@/lib/db";

export async function getSiteStats() {
  const monthStart = startOfMonth(new Date());

  const [devDocuments, studyDocuments, publishedPosts, pendingTodos, completedThisMonth] =
    await Promise.all([
      prisma.document.count({ where: { workspace: "dev" } }),
      prisma.document.count({ where: { workspace: "study" } }),
      prisma.blogPost.count({ where: { published: true } }),
      prisma.todo.count({ where: { completed: false } }),
      prisma.todo.count({ where: { completed: true, updatedAt: { gte: monthStart } } }),
    ]);

  return {
    devDocuments,
    studyDocuments,
    publishedPosts,
    pendingTodos,
    completedThisMonth,
  };
}
