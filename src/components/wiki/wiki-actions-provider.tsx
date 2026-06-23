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
import { createWorkspaceCategoryAction, updateWorkspaceCategoryAction, deleteWorkspaceCategoryAction } from "@/lib/actions/workspace-categories";
import { workspaceBadgeStyle } from "@/lib/wiki";
import type { WorkspaceCategory } from "@/lib/wiki";
import { ALL_USERS, USER_LABEL } from "@/lib/auth";
import type { User } from "@/lib/auth";

const COLOR_PALETTE = ["#3182F6", "#a855f7", "#22c55e", "#f97316", "#ef4444", "#ec4899"];

type DialogState =
  | { kind: "create-folder"; parentId: string | null; inheritCategoryId?: string }
  | { kind: "create-document"; parentId: string | null; inheritCategoryId?: string }
  | { kind: "rename-folder"; folderId: string; initialName: string; categoryId?: string; initialVisibleTo: string[] }
  | { kind: "delete-folder"; folderId: string; name: string; categoryId?: string }
  | { kind: "create-category" }
  | { kind: "edit-category"; categoryId: string; initialName: string; initialColor: string }
  | { kind: "delete-category"; categoryId: string; name: string };

type WikiActionsContextValue = {
  isPending: boolean;
  openCreateFolder: (parentId?: string | null, inheritCategoryId?: string) => void;
  openCreateDocument: (parentId?: string | null, inheritCategoryId?: string) => void;
  openRenameFolder: (folderId: string, name: string, categoryId?: string, visibleTo?: string[]) => void;
  openDeleteFolder: (folderId: string, name: string, categoryId?: string) => void;
  openCreateCategory: () => void;
  openEditCategory: (categoryId: string, name: string, color: string) => void;
  openDeleteCategory: (categoryId: string, name: string) => void;
};

const WikiActionsContext = createContext<WikiActionsContextValue | null>(null);

export function useWikiActions() {
  const context = useContext(WikiActionsContext);
  if (!context) throw new Error("useWikiActions must be used within WikiActionsProvider");
  return context;
}

const DIALOG_TITLE: Record<DialogState["kind"], string> = {
  "create-folder": "새 폴더",
  "create-document": "새 문서",
  "rename-folder": "폴더 이름 변경",
  "delete-folder": "폴더 삭제",
  "create-category": "카테고리 추가",
  "edit-category": "카테고리 수정",
  "delete-category": "카테고리 삭제",
};

export function WikiActionsProvider({
  categories,
  basePath = "/wiki",
  currentUser,
  children,
}: {
  categories: WorkspaceCategory[];
  basePath?: string;
  currentUser: User | null;
  children: ReactNode;
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0]);
  const [visibleTo, setVisibleTo] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  function toggleVisibleUser(user: string) {
    setVisibleTo((prev) => {
      const current = prev.length === 0 ? ALL_USERS : prev;
      return current.includes(user) ? current.filter((u) => u !== user) : [...current, user];
    });
  }

  function isEveryoneSelected(selected: string[]) {
    return selected.length === 0 || ALL_USERS.every((u) => selected.includes(u));
  }

  useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  useEffect(() => {
    if (!dialog) return;
    setError(null);
    setValue(
      dialog.kind === "rename-folder" || dialog.kind === "edit-category"
        ? dialog.initialName
        : ""
    );
    if (dialog.kind === "create-category") setSelectedColor(COLOR_PALETTE[0]);
    if (dialog.kind === "edit-category") setSelectedColor(dialog.initialColor);
    setVisibleTo(dialog.kind === "rename-folder" ? dialog.initialVisibleTo : []);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(timer);
  }, [dialog]);

  function close() {
    if (isPending) return;
    setDialog(null);
    setValue("");
    setError(null);
  }

  function getEffectiveCategoryId(): string {
    if (!dialog) return selectedCategoryId;
    if (dialog.kind === "rename-folder" || dialog.kind === "delete-folder") {
      return dialog.categoryId ?? selectedCategoryId;
    }
    if (dialog.kind === "create-folder" || dialog.kind === "create-document") {
      return dialog.inheritCategoryId ?? selectedCategoryId;
    }
    return selectedCategoryId;
  }

  function submit() {
    if (!dialog) return;

    if (dialog.kind === "create-category") {
      if (!value.trim()) { setError("이름을 입력해주세요."); return; }
      startTransition(async () => {
        const result = await createWorkspaceCategoryAction(value.trim(), selectedColor);
        if ("error" in result) { setError(result.error); return; }
        router.refresh();
        close();
      });
      return;
    }

    if (dialog.kind === "edit-category") {
      if (!value.trim()) { setError("이름을 입력해주세요."); return; }
      startTransition(async () => {
        const result = await updateWorkspaceCategoryAction(dialog.categoryId, value.trim(), selectedColor);
        if (result?.error) { setError(result.error); return; }
        router.refresh();
        close();
      });
      return;
    }

    if (dialog.kind === "delete-category") {
      startTransition(async () => {
        const result = await deleteWorkspaceCategoryAction(dialog.categoryId);
        if (result?.error) { setError(result.error); return; }
        router.refresh();
        close();
      });
      return;
    }

    const categoryId = getEffectiveCategoryId();

    if (dialog.kind === "delete-folder") {
      startTransition(async () => {
        const result = await deleteFolderAction(categoryId, dialog.folderId);
        if (result?.error) { setError(result.error); return; }
        router.refresh();
        close();
      });
      return;
    }

    const name = value.trim();
    if (!name) { setError("이름을 입력해주세요."); return; }

    startTransition(async () => {
      if (dialog.kind === "create-folder") {
        const effectiveVisibleTo = isEveryoneSelected(visibleTo) ? [] : visibleTo;
        const result = await createFolderAction(categoryId, name, dialog.parentId, effectiveVisibleTo);
        if (result?.error) { setError(result.error); return; }
        router.refresh();
        close();
      } else if (dialog.kind === "create-document") {
        const result = await createDocumentAction(categoryId, dialog.parentId, name);
        if ("error" in result) { setError(result.error); return; }
        router.push(`${basePath}/${result.id}`);
        router.refresh();
        close();
      } else if (dialog.kind === "rename-folder") {
        const effectiveVisibleTo = isEveryoneSelected(visibleTo) ? [] : visibleTo;
        const visibleToUnchanged =
          effectiveVisibleTo.length === dialog.initialVisibleTo.length &&
          effectiveVisibleTo.every((u) => dialog.initialVisibleTo.includes(u));
        if (name === dialog.initialName && visibleToUnchanged) { close(); return; }
        const result = await renameFolderAction(categoryId, dialog.folderId, name, effectiveVisibleTo);
        if (result?.error) { setError(result.error); return; }
        router.refresh();
        close();
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") { e.preventDefault(); submit(); }
  }

  const contextValue: WikiActionsContextValue = {
    isPending,
    openCreateFolder: (parentId = null, inheritCategoryId) =>
      setDialog({ kind: "create-folder", parentId, inheritCategoryId }),
    openCreateDocument: (parentId = null, inheritCategoryId) =>
      setDialog({ kind: "create-document", parentId, inheritCategoryId }),
    openRenameFolder: (folderId, name, categoryId, visibleTo = []) =>
      setDialog({ kind: "rename-folder", folderId, initialName: name, categoryId, initialVisibleTo: visibleTo }),
    openDeleteFolder: (folderId, name, categoryId) =>
      setDialog({ kind: "delete-folder", folderId, name, categoryId }),
    openCreateCategory: () => setDialog({ kind: "create-category" }),
    openEditCategory: (categoryId, name, color) =>
      setDialog({ kind: "edit-category", categoryId, initialName: name, initialColor: color }),
    openDeleteCategory: (categoryId, name) =>
      setDialog({ kind: "delete-category", categoryId, name }),
  };

  const isCreateItem = dialog?.kind === "create-folder" || dialog?.kind === "create-document";
  const showCategorySelector = isCreateItem && !("inheritCategoryId" in dialog && dialog.inheritCategoryId);
  const needsInput = dialog?.kind !== "delete-folder" && dialog?.kind !== "delete-category";

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
            {dialog?.kind === "delete-category" && (
              <DialogDescription>
                &quot;{dialog.name}&quot; 카테고리를 삭제할까요?
                <br />
                폴더나 문서가 있으면 삭제할 수 없습니다.
              </DialogDescription>
            )}
          </DialogHeader>

          {(dialog?.kind === "create-category" || dialog?.kind === "edit-category") && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="wiki-action-input">카테고리 이름</Label>
                <Input
                  id="wiki-action-input"
                  ref={inputRef}
                  value={value}
                  onChange={(e) => { setValue(e.target.value); setError(null); }}
                  onKeyDown={handleKeyDown}
                  placeholder="예: 알고리즘"
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label>색상</Label>
                <div className="flex gap-2">
                  {COLOR_PALETTE.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className="relative size-7 rounded-full transition-transform hover:scale-110"
                      style={{ backgroundColor: color }}
                    >
                      {selectedColor === color && (
                        <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          )}

          {needsInput && dialog?.kind !== "create-category" && dialog?.kind !== "edit-category" && (
            <div className="space-y-3">
              {showCategorySelector && categories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <label key={cat.id} className="flex cursor-pointer items-center gap-1.5">
                      <input
                        type="radio"
                        name="dialog-category"
                        value={cat.id}
                        checked={selectedCategoryId === cat.id}
                        onChange={() => setSelectedCategoryId(cat.id)}
                        className="accent-primary"
                      />
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-medium"
                        style={workspaceBadgeStyle(cat.color)}
                      >
                        {cat.name}
                      </span>
                    </label>
                  ))}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="wiki-action-input">
                  {dialog?.kind === "create-document" ? "문서 제목" : "폴더 이름"}
                </Label>
                <Input
                  id="wiki-action-input"
                  ref={inputRef}
                  value={value}
                  onChange={(e) => { setValue(e.target.value); setError(null); }}
                  onKeyDown={handleKeyDown}
                  placeholder={dialog?.kind === "create-document" ? "예: React Hooks 정리" : "예: 프로젝트"}
                  disabled={isPending}
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
              {(dialog?.kind === "create-folder" || dialog?.kind === "rename-folder") && (
                <div className="space-y-2">
                  <Label>공개 대상</Label>
                  <div className="flex flex-wrap gap-3">
                    {ALL_USERS.map((user) => (
                      <label key={user} className="flex cursor-pointer items-center gap-1.5 text-sm">
                        <input
                          type="checkbox"
                          checked={visibleTo.length === 0 || visibleTo.includes(user)}
                          onChange={() => toggleVisibleUser(user)}
                          className="accent-primary"
                        />
                        {USER_LABEL[user]}
                      </label>
                    ))}
                  </div>
                  {currentUser && (
                    <button
                      type="button"
                      onClick={() => setVisibleTo([currentUser])}
                      className="text-xs text-muted-foreground underline hover:text-foreground"
                    >
                      나만 보기
                    </button>
                  )}
                </div>
              )}
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
              variant={dialog?.kind === "delete-folder" || dialog?.kind === "delete-category" ? "destructive" : "default"}
              onClick={submit}
              disabled={isPending}
            >
              {isPending
                ? "처리 중..."
                : dialog?.kind === "delete-folder" || dialog?.kind === "delete-category"
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
