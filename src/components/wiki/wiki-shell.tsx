"use client";

import { FolderSidebar } from "./folder-sidebar";
import { WikiActionsProvider } from "./wiki-actions-provider";
import type { FolderTree } from "@/lib/wiki";
import type { Workspace } from "@/generated/prisma/client";
import type { User } from "@/lib/auth";
import type { ReactNode } from "react";

export function WikiShell({
  workspace,
  tree,
  currentUser,
  children,
}: {
  workspace: Workspace;
  tree: FolderTree;
  currentUser: User | null;
  children: ReactNode;
}) {
  return (
    <WikiActionsProvider workspace={workspace}>
      <div className="flex gap-6">
        <FolderSidebar workspace={workspace} tree={tree} currentUser={currentUser} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </WikiActionsProvider>
  );
}
