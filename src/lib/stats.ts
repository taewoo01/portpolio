import { startOfMonth } from "date-fns";
import { prisma } from "@/lib/db";
import { visibilityWhere, documentVisibilityWhere } from "@/lib/auth";
import type { User } from "@/lib/auth";

export async function getSiteStats(currentUser: User | null = null) {
  const monthStart = startOfMonth(new Date());
  const visibility = visibilityWhere(currentUser);

  const [totalDocuments, publishedPosts, pendingTodos, completedThisMonth] = await Promise.all([
    prisma.document.count({ where: documentVisibilityWhere(currentUser) }),
    prisma.blogPost.count({ where: { published: true, ...visibility } }),
    prisma.todo.count({ where: { completed: false, ...visibility } }),
    prisma.todo.count({ where: { completed: true, updatedAt: { gte: monthStart }, ...visibility } }),
  ]);

  return { totalDocuments, publishedPosts, pendingTodos, completedThisMonth };
}
