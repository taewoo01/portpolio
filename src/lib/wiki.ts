import type { DocumentStatus, Workspace } from "@/generated/prisma/client";

export const WORKSPACE_LABEL: Record<Workspace, string> = {
  dev: "개발",
  study: "공부",
};

export const WORKSPACE_BADGE_CLASS: Record<Workspace, string> = {
  dev: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  study: "bg-purple-500/15 text-purple-700 dark:text-purple-400",
};

export type WikiDocSummary = {
  id: string;
  title: string;
  status: DocumentStatus;
  createdBy: string | null;
};

export type FolderTreeNode = {
  id: string;
  name: string;
  createdBy: string | null;
  children: FolderTreeNode[];
  documents: WikiDocSummary[];
};

export type FolderTree = {
  folders: FolderTreeNode[];
  rootDocuments: WikiDocSummary[];
};

export const STATUS_LABEL: Record<DocumentStatus, string> = {
  draft: "작성 중",
  done: "정리 완료",
  review: "복습 필요",
};

export const STATUS_DOT_CLASS: Record<DocumentStatus, string> = {
  draft: "bg-zinc-400",
  done: "bg-green-500",
  review: "bg-orange-500",
};

export const STATUS_BADGE_CLASS: Record<DocumentStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  done: "bg-green-500/15 text-green-700 dark:text-green-400",
  review: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
};

export function buildFolderTree(
  folders: { id: string; name: string; parentId: string | null; createdBy: string | null }[],
  documents: { id: string; title: string; folderId: string | null; status: DocumentStatus; createdBy: string | null }[]
): FolderTree {
  const nodeById = new Map<string, FolderTreeNode>();
  for (const folder of folders) {
    nodeById.set(folder.id, {
      id: folder.id,
      name: folder.name,
      createdBy: folder.createdBy,
      children: [],
      documents: [],
    });
  }

  const roots: FolderTreeNode[] = [];
  for (const folder of folders) {
    const node = nodeById.get(folder.id)!;
    const parent = folder.parentId ? nodeById.get(folder.parentId) : undefined;
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const rootDocuments: WikiDocSummary[] = [];
  for (const doc of documents) {
    const folder = doc.folderId ? nodeById.get(doc.folderId) : undefined;
    const summary: WikiDocSummary = { id: doc.id, title: doc.title, status: doc.status, createdBy: doc.createdBy };
    if (folder) {
      folder.documents.push(summary);
    } else {
      rootDocuments.push(summary);
    }
  }

  return { folders: roots, rootDocuments };
}
