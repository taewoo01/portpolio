"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createFolderAction, renameFolderAction, deleteFolderAction } from "@/lib/actions/folders";
import { createDocumentAction } from "@/lib/actions/documents";
import type { Workspace } from "@/generated/prisma/client";

type DialogState =
  | { kind: "create-folder"; parentId: string | null }
  | { kind: "create-document"; parentId: string | null }
  | { kind: "rename-folder"; folderId: string; initialName: string }
  | { kind: "delete-folder"; folderId: string; name: string };

type WikiActionsContextValue = {
  isPending: boolean;
  openCreateFolder: (parentId?: string | null) => void;
  openCreateDocument: (parentId?: string | null) => void;
  openRenameFolder: (folderId: string, name: string) => void;
  openDeleteFolder: (folderId: string, name: string) => void;
};

const WikiActionsContext = createContext<WikiActionsContextValue | null>(null);

export function useWikiActions() {
  const context = useContext(WikiActionsContext);
  if (!context) {
    throw new Error("useWikiActions must be used within WikiActionsProvider");
  }
  return context;
}

const DIALOG_TITLE: Record<DialogState["kind"], string> = {
  "create-folder": "새 폴더",
  "create-document": "새 문서",
  "rename-folder": "폴더 이름 변경",
  "delete-folder": "폴더 삭제",
};

export function WikiActionsProvider({
  workspace,
  children,
}: {
  workspace: Workspace;
  children: ReactNode;
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!dialog) return;
    setError(null);
    setValue(dialog.kind === "rename-folder" ? dialog.initialName : "");
    const timer = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(timer);
  }, [dialog]);

  function close() {
    if (isPending) return;
    setDialog(null);
    setValue("");
    setError(null);
  }

  function submit() {
    if (!dialog) return;

    if (dialog.kind === "delete-folder") {
      startTransition(async () => {
        const result = await deleteFolderAction(workspace, dialog.folderId);
        if (result?.error) { setError(result.error); return; }
        router.refresh();
        close();
      });
      return;
    }

    const name = value.trim();
    if (!name) {
      setError("이름을 입력해주세요.");
      return;
    }

    startTransition(async () => {
      if (dialog.kind === "create-folder") {
        const result = await createFolderAction(workspace, name, dialog.parentId);
        if (result?.error) { setError(result.error); return; }
        router.refresh();
        close();
      } else if (dialog.kind === "create-document") {
        const result = await createDocumentAction(workspace, dialog.parentId, name);
        if ("error" in result) { setError(result.error); return; }
        router.push(`/${workspace}/${result.id}`);
        router.refresh();
        close();
      } else if (dialog.kind === "rename-folder") {
        if (name === dialog.initialName) { close(); return; }
        const result = await renameFolderAction(workspace, dialog.folderId, name);
        if (result?.error) { setError(result.error); return; }
        router.refresh();
        close();
      }
    });
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      submit();
    }
  }

  const contextValue: WikiActionsContextValue = {
    isPending,
    openCreateFolder: (parentId = null) => setDialog({ kind: "create-folder", parentId }),
    openCreateDocument: (parentId = null) => setDialog({ kind: "create-document", parentId }),
    openRenameFolder: (folderId, name) => setDialog({ kind: "rename-folder", folderId, initialName: name }),
    openDeleteFolder: (folderId, name) => setDialog({ kind: "delete-folder", folderId, name }),
  };

  const needsInput = dialog && dialog.kind !== "delete-folder";

  return (
    <WikiActionsContext.Provider value={contextValue}>
      {children}

      <Dialog open={dialog !== null} onOpenChange={(open) => !open && close()}>
        <DialogContent showCloseButton={!isPending}>
          <DialogHeader>
            <DialogTitle>{dialog ? DIALOG_TITLE[dialog.kind] : ""}</DialogTitle>
            {dialog?.kind === "delete-folder" && (
              <DialogDescription>
                &quot;{dialog.name}&quot; 폴더를 삭제할까요?
                <br />
                하위 폴더는 함께 삭제되고, 안의 문서는 상위로 이동합니다.
              </DialogDescription>
            )}
          </DialogHeader>

          {needsInput && (
            <div className="space-y-2">
              <Label htmlFor="wiki-action-input">
                {dialog?.kind === "create-document" ? "문서 제목" : "폴더 이름"}
              </Label>
              <Input
                id="wiki-action-input"
                ref={inputRef}
                value={value}
                onChange={(event) => {
                  setValue(event.target.value);
                  setError(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder={dialog?.kind === "create-document" ? "예: React Hooks 정리" : "예: 프로젝트"}
                disabled={isPending}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          )}

          {dialog?.kind === "delete-folder" && error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={close} disabled={isPending}>
              취소
            </Button>
            <Button
              type="button"
              variant={dialog?.kind === "delete-folder" ? "destructive" : "default"}
              onClick={submit}
              disabled={isPending}
            >
              {isPending
                ? "처리 중..."
                : dialog?.kind === "delete-folder"
                  ? "삭제"
                  : dialog?.kind === "create-document"
                    ? "만들기"
                    : "확인"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </WikiActionsContext.Provider>
  );
}
