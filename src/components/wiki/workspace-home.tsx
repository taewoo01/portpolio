import { prisma } from "@/lib/db";
import { EmptyWikiState } from "./empty-wiki-state";
import type { Workspace } from "@/generated/prisma/client";

export async function WorkspaceHome({ workspace }: { workspace: Workspace }) {
  const [folderCount, documentCount] = await Promise.all([
    prisma.folder.count({ where: { workspace } }),
    prisma.document.count({ where: { workspace } }),
  ]);

  if (folderCount === 0 && documentCount === 0) {
    return <EmptyWikiState workspace={workspace} />;
  }

  return (
    <div className="flex h-full flex-col items-center justify-center py-24 text-center text-sm text-muted-foreground">
      <p>왼쪽 사이드바에서 문서를 선택하거나 새로 만드세요.</p>
    </div>
  );
}
