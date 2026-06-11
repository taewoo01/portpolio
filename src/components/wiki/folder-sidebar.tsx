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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useWikiActions } from "./wiki-actions-provider";
import { STATUS_DOT_CLASS, STATUS_LABEL } from "@/lib/wiki";
import { USER_LABEL } from "@/lib/auth";
import type { FolderTree, FolderTreeNode, WikiDocSummary } from "@/lib/wiki";
import type { Workspace } from "@/generated/prisma/client";
import type { User } from "@/lib/auth";

export function FolderSidebar({
  workspace,
  tree,
  currentUser,
  onNavigate,
}: {
  workspace: Workspace;
  tree: FolderTree;
  currentUser: User | null;
  onNavigate?: () => void;
}) {
  const { isPending, openCreateFolder, openCreateDocument } = useWikiActions();
  const isEmpty = tree.folders.length === 0 && tree.rootDocuments.length === 0;

  return (
    <aside className="w-[240px] shrink-0 border-r pr-3">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-muted-foreground">
          {workspace === "dev" ? "개발" : "공부"}
        </span>
        <div className="flex gap-1">
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
      </div>
      <nav className="space-y-0.5 text-sm">
        {tree.folders.map((node) => (
          <FolderNodeItem key={node.id} workspace={workspace} node={node} depth={0} currentUser={currentUser} onNavigate={onNavigate} />
        ))}
        {tree.rootDocuments.map((doc) => (
          <DocumentLink key={doc.id} workspace={workspace} doc={doc} depth={0} currentUser={currentUser} onNavigate={onNavigate} />
        ))}
        {isEmpty && (
          <p className="px-2 py-1 text-muted-foreground">폴더나 문서가 없습니다.</p>
        )}
      </nav>
    </aside>
  );
}

function DocumentLink({
  workspace,
  doc,
  depth,
  currentUser,
  onNavigate,
}: {
  workspace: Workspace;
  doc: WikiDocSummary;
  depth: number;
  currentUser: User | null;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const href = `/${workspace}/${doc.id}`;
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
      {authorLabel && doc.createdBy !== currentUser && (
        <span className="ml-auto shrink-0 rounded px-1 text-[10px] text-muted-foreground/70">{authorLabel}</span>
      )}
    </Link>
  );
}

function FolderNodeItem({
  workspace,
  node,
  depth,
  currentUser,
  onNavigate,
}: {
  workspace: Workspace;
  node: FolderTreeNode;
  depth: number;
  currentUser: User | null;
  onNavigate?: () => void;
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
    openRenameFolder(node.id, node.name);
  }

  function handleDelete(event: React.MouseEvent) {
    event.stopPropagation();
    openDeleteFolder(node.id, node.name);
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((value) => !value)}
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
        <span className="ml-auto flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            title="하위 폴더 추가"
            onClick={withStop(() => openCreateFolder(node.id))}
            disabled={isPending}
            className="rounded p-0.5 hover:bg-background"
          >
            <FolderPlus className="size-3.5" />
          </button>
          <button
            type="button"
            title="새 문서"
            onClick={withStop(() => openCreateDocument(node.id))}
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
            <FolderNodeItem key={child.id} workspace={workspace} node={child} depth={depth + 1} currentUser={currentUser} onNavigate={onNavigate} />
          ))}
          {node.documents.map((doc) => (
            <DocumentLink key={doc.id} workspace={workspace} doc={doc} depth={depth + 1} currentUser={currentUser} onNavigate={onNavigate} />
          ))}
          <button
            type="button"
            style={{ paddingLeft: `${(depth + 1) * 16 + 28}px` }}
            onClick={(e) => { e.stopPropagation(); openCreateDocument(node.id); }}
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
