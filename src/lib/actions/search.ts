"use server";

import { prisma } from "@/lib/db";
import { getUser } from "@/lib/server/auth";
import { documentVisibilityWhere } from "@/lib/auth";
import type { DocumentStatus } from "@/generated/prisma/client";

export type WorkspaceFilter = "all" | string; // "all" or workspaceCategoryId

export type SearchResult = {
  id: string;
  title: string;
  workspaceCategory: { id: string; name: string; color: string };
  status: DocumentStatus;
  tags: string[];
  matchedTags: string[];
  updatedAt: Date;
  snippet: string;
};

const SELECT = {
  id: true,
  title: true,
  workspaceCategory: { select: { id: true, name: true, color: true } },
  status: true,
  tags: true,
  updatedAt: true,
  content: true,
} as const;

export async function searchDocumentsAction(
  query: string,
  categoryFilter: WorkspaceFilter
): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const lowered = trimmed.toLowerCase();
  const categoryWhere = categoryFilter !== "all" ? { workspaceCategoryId: categoryFilter } : {};
  const currentUser = await getUser();
  const visibility = documentVisibilityWhere(currentUser);

  const [textMatches, tagCandidates] = await Promise.all([
    prisma.document.findMany({
      where: {
        ...categoryWhere,
        OR: [
          { title: { contains: trimmed, mode: "insensitive" } },
          { content: { contains: trimmed, mode: "insensitive" } },
        ],
        ...(visibility ? { AND: [visibility] } : {}),
      },
      orderBy: { updatedAt: "desc" },
      select: SELECT,
      take: 30,
    }),
    prisma.document.findMany({
      where: { ...categoryWhere, tags: { isEmpty: false }, ...visibility },
      orderBy: { updatedAt: "desc" },
      select: SELECT,
      take: 100,
    }),
  ]);

  const seen = new Set<string>();
  const results: SearchResult[] = [];

  for (const doc of textMatches) {
    if (seen.has(doc.id)) continue;
    seen.add(doc.id);
    const { content, ...rest } = doc;
    results.push({ ...rest, matchedTags: [], snippet: buildSnippet(content, trimmed) });
  }

  for (const doc of tagCandidates) {
    if (seen.has(doc.id)) continue;
    const matchedTags = doc.tags.filter((tag) => tag.toLowerCase().includes(lowered));
    if (matchedTags.length === 0) continue;
    seen.add(doc.id);
    const { content, ...rest } = doc;
    results.push({ ...rest, matchedTags, snippet: buildSnippet(content, trimmed) });
  }

  return results.slice(0, 30);
}

function buildSnippet(content: string, query: string): string {
  const idx = content.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return content.slice(0, 120).trim();

  const radius = 60;
  const start = Math.max(0, idx - radius);
  const end = Math.min(content.length, idx + query.length + radius);

  return `${start > 0 ? "…" : ""}${content.slice(start, end).trim()}${end < content.length ? "…" : ""}`;
}
