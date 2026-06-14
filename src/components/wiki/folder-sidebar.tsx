"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  ChevronDown,
  Folder as FolderIcon,
  FolderPlus,
  FilePlus,
  Pencil,
  Trash2,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useWikiActions } from "./wiki-actions-provider";
import { STATUS_DOT_CLASS, STATUS_LABEL, workspaceBadgeStyle } from "@/lib/wiki";
import { USER_LABEL } from "@/lib/auth";
import type { FolderTree, FolderTreeNode, WikiDocSummary, WorkspaceCategory } from "@/lib/wiki";
import type { User } from "@/lib/auth";

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
  const { isPending, openCreateFolder, openCreateDocument, openCreateCategory } = useWikiActions();

  const showBadge = selectedCategoryId === null;

  const displayFolders = selectedCategoryId === null
    ? tree.folders
    : tree.folders.filter((f) => f.workspaceCategory.id === selectedCategoryId);
  const displayRootDocs = selectedCategoryId === null
    ? tree.rootDocuments
    : tree.rootDocuments.filter((d) => d.workspaceCategory.id === selectedCategoryId);

  const isEmpty = displayFolders.length === 0 && displayRootDocs.length === 0;

  return (
    <aside className="w-[240px] shrink-0 border-r pr-3 flex flex-col gap-3">
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
          <button
            key={cat.id}
            onClick={() => onCategorySelect(cat.id)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors",
              selectedCategoryId === cat.id
                ? "bg-accent font-semibold text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: cat.color }} />
            {cat.name}
          </button>
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
    </aside>
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

  return (
    <Link
      href={href}
      onClick={onNavigate}
      style={{ paddingLeft: `${depth * 16 + 28}px` }}
      className={cn(
        "flex items-center gap-1.5 truncate rounded-md py-1.5 pr-2 transition-colors hover:bg-accent hover:text-accent-foreground",
        active ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground"
      )}
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

  const canEdit = !node.createdBy || node.createdBy === currentUser;

  function withStop(fn: () => void) {
    return (event: React.MouseEvent) => {
      event.stopPropagation();
      fn();
      setOpen(true);
    };
  }

  function handleRename(event: React.MouseEvent) {
    event.stopPropagation();
    openRenameFolder(node.id, node.name, node.workspaceCategory.id);
  }

  function handleDelete(event: React.MouseEvent) {
    event.stopPropagation();
    openDeleteFolder(node.id, node.name, node.workspaceCategory.id);
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((v) => !v)}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
        className="group flex items-center gap-1 rounded-md py-1.5 pr-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
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
        <span className="ml-auto flex shrink-0 items-center gap-0.5">
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
