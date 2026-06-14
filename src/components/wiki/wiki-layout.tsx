"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PanelLeft } from "lucide-react";
import { FolderSidebar } from "./folder-sidebar";
import { WikiActionsProvider } from "./wiki-actions-provider";
import type { FolderTree, WorkspaceCategory } from "@/lib/wiki";
import type { User } from "@/lib/auth";
import type { ReactNode } from "react";

export function WikiLayout({
  tree,
  currentUser,
  categories,
  children,
}: {
  tree: FolderTree;
  currentUser: User | null;
  categories: WorkspaceCategory[];
  children: ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  return (
    <WikiActionsProvider categories={categories} basePath="/wiki">
      <div className="flex gap-6">
        <div className="hidden md:block">
          <FolderSidebar
            categories={categories}
            tree={tree}
            currentUser={currentUser}
            basePath="/wiki"
            selectedCategoryId={selectedCategoryId}
            onCategorySelect={setSelectedCategoryId}
          />
        </div>

        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.div
                initial={{ x: -260 }}
                animate={{ x: 0 }}
                exit={{ x: -260 }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
                className="fixed inset-y-0 left-0 z-40 w-[260px] overflow-y-auto bg-background border-r md:hidden"
              >
                <div className="p-4 pt-16">
                  <FolderSidebar
                    categories={categories}
                    tree={tree}
                    currentUser={currentUser}
                    basePath="/wiki"
                    selectedCategoryId={selectedCategoryId}
                    onCategorySelect={setSelectedCategoryId}
                    onNavigate={() => setSidebarOpen(false)}
                  />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="mb-3 flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
          >
            <PanelLeft className="size-4" />
            <span>목차</span>
          </button>
          {children}
        </div>
      </div>
    </WikiActionsProvider>
  );
}
