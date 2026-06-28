"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  ChevronRight,
  ChevronDown,
  Folder as FolderIcon,
  FolderPlus,
  FilePlus,
  Pencil,
  Trash2,
  Plus,
  FileText,
  ArrowUpToLine,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useWikiActions } from "./wiki-actions-provider";
import { moveFolderAction } from "@/lib/actions/folders";
import { moveDocumentAction } from "@/lib/actions/documents";
import { STATUS_DOT_CLASS, STATUS_LABEL, workspaceBadgeStyle } from "@/lib/wiki";
import { USER_LABEL, isOwner } from "@/lib/auth";
import type { FolderTree, FolderTreeNode, WikiDocSummary, WorkspaceCategory } from "@/lib/wiki";
import type { User } from "@/lib/auth";

function findFolderNode(nodes: FolderTreeNode[], id: string): FolderTreeNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findFolderNode(node.children, id);
    if (found) return found;
  }
  return undefined;
}

function collectDescendantFolderIds(node: FolderTreeNode): Set<string> {
  const ids = new Set<string>();
  function walk(n: FolderTreeNode) {
    for (const child of n.children) {
      ids.add(child.id);
      walk(child);
    }
  }
  walk(node);
  return ids;
}

type DragLabel = { kind: "folder" | "document"; name: string };

export function FolderSidebar({
  categories,
  tree,
  currentUser,
  onNavigate,
  basePath,
  selectedCategoryId,
  onCategorySelect,
}: {
  categories: WorkspaceCategory[];
  tree: FolderTree;
  currentUser: User | null;
  onNavigate?: () => void;
  basePath: string;
  selectedCategoryId: string | null;
  onCategorySelect: (id: string | null) => void;
}) {
  const router = useRouter();
  const { isPending, openCreateFolder, openCreateDocument, openCreateCategory, openEditCategory, openDeleteCategory } = useWikiActions();
  const [, startMove] = useTransition();
  const [dragLabel, setDragLabel] = useState<DragLabel | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const showBadge = selectedCategoryId === null;

  const displayFolders = selectedCategoryId === null
    ? tree.folders
    : tree.folders.filter((f) => f.workspaceCategory.id === selectedCategoryId);
  const displayRootDocs = selectedCategoryId === null
    ? tree.rootDocuments
    : tree.rootDocuments.filter((d) => d.workspaceCategory.id === selectedCategoryId);

  const isEmpty = displayFolders.length === 0 && displayRootDocs.length === 0;

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as { kind: "folder" | "document"; name: string } | undefined;
    if (data) setDragLabel({ kind: data.kind, name: data.name });
  }

  function handleDragEnd(event: DragEndEvent) {
    setDragLabel(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeData = active.data.current as
      | { kind: "folder"; folderId: string; categoryId: string }
      | { kind: "document"; documentId: string; categoryId: string }
      | undefined;
    const overData = over.data.current as
      | { kind: "folder"; folderId: string; categoryId: string }
      | { kind: "root" }
      | undefined;
    if (!activeData || !overData) return;

    if (overData.kind === "folder" && activeData.categoryId !== overData.categoryId) {
      alert("같은 카테고리 안에서만 이동할 수 있습니다.");
      return;
    }

    const targetFolderId = overData.kind === "folder" ? overData.folderId : null;

    if (activeData.kind === "document") {
      startMove(async () => {
        const result = await moveDocumentAction(activeData.documentId, targetFolderId);
        if (result?.error) { alert(result.error); return; }
        router.refresh();
      });
      return;
    }

    if (activeData.folderId === targetFolderId) return;
    if (targetFolderId) {
      const draggedNode = findFolderNode(tree.folders, activeData.folderId);
      if (draggedNode && collectDescendantFolderIds(draggedNode).has(targetFolderId)) {
        alert("폴더를 하위 폴더 안으로 이동할 수 없습니다.");
        return;
      }
    }

    startMove(async () => {
      const result = await moveFolderAction(activeData.folderId, targetFolderId);
      if (result?.error) { alert(result.error); return; }
      router.refresh();
    });
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <aside className="relative w-[240px] shrink-0 border-r pr-3 flex flex-col gap-3">
        {/* Category list */}
        <div className="flex flex-col gap-0.5">
          <button
            onClick={() => onCategorySelect(null)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors",
              selectedCategoryId === null
                ? "bg-accent font-semibold text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            전체
          </button>
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center">
              <button
                onClick={() => onCategorySelect(cat.id)}
                className={cn(
                  "flex flex-1 items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors",
                  selectedCategoryId === cat.id
                    ? "bg-accent font-semibold text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: cat.color }} />
                {cat.name}
              </button>
              <div className="flex shrink-0 gap-0.5">
                <button
                  type="button"
                  title="수정"
                  onClick={() => openEditCategory(cat.id, cat.name, cat.color)}
                  disabled={isPending}
                  className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="size-3" />
                </button>
                <button
                  type="button"
                  title="삭제"
                  onClick={() => openDeleteCategory(cat.id, cat.name)}
                  disabled={isPending}
                  className="rounded p-0.5 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={openCreateCategory}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors"
          >
            <Plus className="size-3" />
            카테고리 추가
          </button>
        </div>

        <div className="border-t" />

        {/* Folder/doc actions */}
        <div className="flex items-center justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title="새 폴더"
            onClick={() => openCreateFolder(null)}
            disabled={isPending}
          >
            <FolderPlus className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title="새 문서"
            onClick={() => openCreateDocument(null)}
            disabled={isPending}
          >
            <FilePlus className="size-4" />
          </Button>
        </div>

        <nav className="space-y-0.5 text-sm">
          {displayFolders.map((node) => (
            <FolderNodeItem
              key={node.id}
              basePath={basePath}
              node={node}
              depth={0}
              currentUser={currentUser}
              onNavigate={onNavigate}
              showBadge={showBadge}
            />
          ))}
          {displayRootDocs.map((doc) => (
            <DocumentLink
              key={doc.id}
              basePath={basePath}
              doc={doc}
              depth={0}
              currentUser={currentUser}
              onNavigate={onNavigate}
              showBadge={showBadge}
            />
          ))}
          {isEmpty && (
            <p className="px-2 py-1 text-xs text-muted-foreground">폴더나 문서가 없습니다.</p>
          )}
        </nav>

        <RootDropZone visible={dragLabel !== null} />
      </aside>

      <DragOverlay>
        {dragLabel && (
          <div className="flex items-center gap-1.5 rounded-md border bg-popover px-2.5 py-1.5 text-sm shadow-md">
            {dragLabel.kind === "folder" ? (
              <FolderIcon className="size-3.5 shrink-0 text-muted-foreground" />
            ) : (
              <FileText className="size-3.5 shrink-0 text-muted-foreground" />
            )}
            <span className="truncate">{dragLabel.name}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

function RootDropZone({ visible }: { visible: boolean }) {
  const { setNodeRef, isOver } = useDroppable({
    id: "root-zone",
    data: { kind: "root" },
    disabled: !visible,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "absolute inset-x-0 bottom-2 flex items-center gap-1.5 rounded-md border border-dashed bg-background px-2.5 py-1.5 text-xs text-muted-foreground transition-opacity",
        visible ? "opacity-100" : "opacity-0 pointer-events-none",
        isOver && "border-primary bg-accent text-foreground"
      )}
    >
      <ArrowUpToLine className="size-3.5 shrink-0" />
      여기에 놓으면 최상위로 이동
    </div>
  );
}

function DocumentLink({
  basePath,
  doc,
  depth,
  currentUser,
  onNavigate,
  showBadge,
}: {
  basePath: string;
  doc: WikiDocSummary;
  depth: number;
  currentUser: User | null;
  onNavigate?: () => void;
  showBadge?: boolean;
}) {
  const pathname = usePathname();
  const href = `${basePath}/${doc.id}`;
  const active = pathname === href;
  const authorLabel = doc.createdBy ? USER_LABEL[doc.createdBy as User] : null;
  const canDrag = isOwner(currentUser, doc.createdBy ?? null);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `doc:${doc.id}`,
    data: { kind: "document", documentId: doc.id, categoryId: doc.workspaceCategory.id, name: doc.title },
    disabled: !canDrag,
  });

  return (
    <Link
      ref={setNodeRef}
      href={href}
      onClick={onNavigate}
      style={{ paddingLeft: `${depth * 16 + 28}px` }}
      className={cn(
        "flex items-center gap-1.5 truncate rounded-md py-1.5 pr-2 transition-colors hover:bg-accent hover:text-accent-foreground",
        active ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground",
        isDragging && "opacity-40"
      )}
      {...(canDrag ? { ...attributes, ...listeners } : {})}
    >
      <span
        title={STATUS_LABEL[doc.status]}
        className={cn("size-1.5 shrink-0 rounded-full", STATUS_DOT_CLASS[doc.status])}
      />
      <span className="truncate">{doc.title}</span>
      {showBadge && (
        <span
          className="ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
          style={workspaceBadgeStyle(doc.workspaceCategory.color)}
        >
          {doc.workspaceCategory.name}
        </span>
      )}
      {!showBadge && authorLabel && doc.createdBy !== currentUser && (
        <span className="ml-auto shrink-0 rounded px-1 text-[10px] text-muted-foreground/70">
          {authorLabel}
        </span>
      )}
    </Link>
  );
}

function FolderNodeItem({
  basePath,
  node,
  depth,
  currentUser,
  onNavigate,
  showBadge,
}: {
  basePath: string;
  node: FolderTreeNode;
  depth: number;
  currentUser: User | null;
  onNavigate?: () => void;
  showBadge?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { isPending, openCreateFolder, openCreateDocument, openRenameFolder, openDeleteFolder } =
    useWikiActions();

  const canEdit = isOwner(currentUser, node.createdBy ?? null);

  const { attributes, listeners, setNodeRef: setDraggableRef, isDragging } = useDraggable({
    id: `folder:${node.id}`,
    data: { kind: "folder", folderId: node.id, categoryId: node.workspaceCategory.id, name: node.name },
    disabled: !canEdit,
  });
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `folder:${node.id}`,
    disabled: isDragging,
    data: { kind: "folder", folderId: node.id, categoryId: node.workspaceCategory.id },
  });

  function withStop(fn: () => void) {
    return (event: React.MouseEvent) => {
      event.stopPropagation();
      fn();
      setOpen(true);
    };
  }

  function handleRename(event: React.MouseEvent) {
    event.stopPropagation();
    openRenameFolder(node.id, node.name, node.workspaceCategory.id, node.visibleTo);
  }

  function handleDelete(event: React.MouseEvent) {
    event.stopPropagation();
    openDeleteFolder(node.id, node.name, node.workspaceCategory.id);
  }

  return (
    <div>
      <div
        ref={(el) => { setDraggableRef(el); setDroppableRef(el); }}
        onClick={() => setOpen((v) => !v)}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
        className={cn(
          "group flex items-center gap-1 rounded-md py-1.5 pr-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          isDragging && "opacity-40",
          isOver && "bg-accent ring-1 ring-primary/50"
        )}
        {...(canEdit ? { ...attributes, ...listeners } : { role: "button", tabIndex: 0 })}
      >
        {open ? (
          <ChevronDown className="size-3.5 shrink-0" />
        ) : (
          <ChevronRight className="size-3.5 shrink-0" />
        )}
        <FolderIcon className="size-3.5 shrink-0" />
        <span className="truncate">{node.name}</span>
        {showBadge && (
          <span
            className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
            style={workspaceBadgeStyle(node.workspaceCategory.color)}
          >
            {node.workspaceCategory.name}
          </span>
        )}
        <span className="ml-auto flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            title="하위 폴더 추가"
            onClick={withStop(() => openCreateFolder(node.id, node.workspaceCategory.id))}
            disabled={isPending}
            className="rounded p-0.5 hover:bg-background"
          >
            <FolderPlus className="size-3.5" />
          </button>
          <button
            type="button"
            title="새 문서"
            onClick={withStop(() => openCreateDocument(node.id, node.workspaceCategory.id))}
            disabled={isPending}
            className="rounded p-0.5 hover:bg-background"
          >
            <FilePlus className="size-3.5" />
          </button>
          {canEdit && (
            <>
              <button
                type="button"
                title="이름 변경"
                onClick={handleRename}
                disabled={isPending}
                className="rounded p-0.5 hover:bg-background"
              >
                <Pencil className="size-3.5" />
              </button>
              <button
                type="button"
                title="삭제"
                onClick={handleDelete}
                disabled={isPending}
                className="rounded p-0.5 hover:bg-background"
              >
                <Trash2 className="size-3.5" />
              </button>
            </>
          )}
        </span>
      </div>
      {open && (
        <div>
          {node.children.map((child) => (
            <FolderNodeItem
              key={child.id}
              basePath={basePath}
              node={child}
              depth={depth + 1}
              currentUser={currentUser}
              onNavigate={onNavigate}
              showBadge={showBadge}
            />
          ))}
          {node.documents.map((doc) => (
            <DocumentLink
              key={doc.id}
              basePath={basePath}
              doc={doc}
              depth={depth + 1}
              currentUser={currentUser}
              onNavigate={onNavigate}
              showBadge={showBadge}
            />
          ))}
          <button
            type="button"
            style={{ paddingLeft: `${(depth + 1) * 16 + 28}px` }}
            onClick={(e) => {
              e.stopPropagation();
              openCreateDocument(node.id, node.workspaceCategory.id);
            }}
            disabled={isPending}
            className="flex w-full items-center gap-1.5 rounded-md py-1.5 pr-2 text-muted-foreground/60 hover:bg-accent hover:text-accent-foreground"
          >
            <FilePlus className="size-3.5 shrink-0" />
            <span className="text-xs">새 문서</span>
          </button>
        </div>
      )}
    </div>
  );
}
