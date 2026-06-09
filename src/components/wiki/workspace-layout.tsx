import { prisma } from "@/lib/db";
import { buildFolderTree } from "@/lib/wiki";
import { getUser } from "@/lib/server/auth";
import { WikiShell } from "./wiki-shell";
import type { Workspace } from "@/generated/prisma/client";

export async function WorkspaceLayout({
  workspace,
  children,
}: {
  workspace: Workspace;
  children: React.ReactNode;
}) {
  const [folders, documents, currentUser] = await Promise.all([
    prisma.folder.findMany({
      where: { workspace },
      select: { id: true, name: true, parentId: true, createdBy: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.document.findMany({
      where: { workspace },
      select: { id: true, title: true, folderId: true, status: true, createdBy: true },
      orderBy: { updatedAt: "desc" },
    }),
    getUser(),
  ]);

  const tree = buildFolderTree(folders, documents);

  return (
    <WikiShell workspace={workspace} tree={tree} currentUser={currentUser}>
      {children}
    </WikiShell>
  );
}
