"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PanelLeft } from "lucide-react";
import { FolderSidebar } from "./folder-sidebar";
import { WikiActionsProvider } from "./wiki-actions-provider";
import type { FolderTree } from "@/lib/wiki";
import type { User } from "@/lib/auth";
import type { ReactNode } from "react";

export function WikiShell({
  tree,
  currentUser,
  basePath,
  children,
}: {
  tree: FolderTree;
  currentUser: User | null;
  basePath: string;
  children: ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  return (
    <WikiActionsProvider categories={[]} basePath={basePath} currentUser={currentUser}>
      <div className="flex gap-6">
        <div className="hidden md:block md:sticky md:top-22 md:self-start md:max-h-[calc(100vh-5.5rem)] md:overflow-y-auto">
          <FolderSidebar
            categories={[]}
            tree={tree}
            currentUser={currentUser}
            basePath={basePath}
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
                    categories={[]}
                    tree={tree}
                    currentUser={currentUser}
                    basePath={basePath}
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
