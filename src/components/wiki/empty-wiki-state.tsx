"use client";

import { Button } from "@/components/ui/button";
import { useWikiActions } from "./wiki-actions-provider";

export function EmptyWikiState() {
  const { isPending, openCreateFolder, openCreateDocument } = useWikiActions();

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <h2 className="text-lg font-medium">아직 폴더나 문서가 없습니다</h2>
      <p className="text-sm text-muted-foreground">
        폴더를 만들어 정리하거나, 바로 문서를 작성해보세요.
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => openCreateFolder(null)}
          disabled={isPending}
        >
          폴더 만들기
        </Button>
        <Button type="button" onClick={() => openCreateDocument(null)} disabled={isPending}>
          문서 만들기
        </Button>
      </div>
    </div>
  );
}
