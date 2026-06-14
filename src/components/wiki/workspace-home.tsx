import { prisma } from "@/lib/db";
import { EmptyWikiState } from "./empty-wiki-state";

export async function WorkspaceHome() {
  const [folderCount, documentCount] = await Promise.all([
    prisma.folder.count(),
    prisma.document.count(),
  ]);

  if (folderCount === 0 && documentCount === 0) {
    return <EmptyWikiState />;
  }

  return (
    <div className="flex h-full flex-col items-center justify-center py-24 text-center text-sm text-muted-foreground">
      <p>왼쪽 사이드바에서 문서를 선택하거나 새로 만드세요.</p>
    </div>
  );
}
