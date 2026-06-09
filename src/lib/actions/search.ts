"use server";

import { prisma } from "@/lib/db";
import type { DocumentStatus, Workspace } from "@/generated/prisma/client";

export type WorkspaceFilter = "all" | Workspace;

export type SearchResult = {
  id: string;
  title: string;
  workspace: Workspace;
  status: DocumentStatus;
  tags: string[];
  matchedTags: string[];
  updatedAt: Date;
  snippet: string;
};

const SELECT = {
  id: true,
  title: true,
  workspace: true,
  status: true,
  tags: true,
  updatedAt: true,
  content: true,
} as const;

export async function searchDocumentsAction(
  query: string,
  workspace: WorkspaceFilter
): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const lowered = trimmed.toLowerCase();
  const workspaceFilter = workspace !== "all" ? { workspace } : {};

  const [textMatches, tagCandidates] = await Promise.all([
    prisma.document.findMany({
      where: {
        ...workspaceFilter,
        OR: [
          { title: { contains: trimmed, mode: "insensitive" } },
          { content: { contains: trimmed, mode: "insensitive" } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      select: SELECT,
      take: 30,
    }),
    prisma.document.findMany({
      where: { ...workspaceFilter, tags: { isEmpty: false } },
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
