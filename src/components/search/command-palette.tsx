"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SearchFilters } from "./search-filters";
import { SearchResults } from "./search-results";
import {
  searchDocumentsAction,
  type SearchResult,
  type WorkspaceFilter,
} from "@/lib/actions/search";
import type { WorkspaceCategory } from "@/lib/wiki";

export function CommandPalette({
  open,
  onOpenChange,
  categories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: WorkspaceCategory[];
}) {
  const [query, setQuery] = useState("");
  const [workspace, setWorkspace] = useState<WorkspaceFilter>("all");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) {
      setQuery("");
      setWorkspace("all");
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      startTransition(async () => {
        setResults(await searchDocumentsAction(trimmed, workspace));
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [query, workspace, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="top-24 max-w-xl translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl"
      >
        <DialogTitle className="sr-only">문서 검색</DialogTitle>
        <DialogDescription className="sr-only">
          위키 문서를 검색합니다
        </DialogDescription>

        <div className="flex flex-col gap-3 p-4">
          <Input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="제목이나 본문으로 검색…"
            className="h-11 text-base"
          />
          <SearchFilters categories={categories} value={workspace} onChange={setWorkspace} />
        </div>

        <div className="max-h-[60vh] overflow-y-auto border-t px-2 pb-2">
          {!query.trim() ? (
            <p className="px-3 py-10 text-center text-sm text-muted-foreground">
              검색어를 입력하세요
            </p>
          ) : results.length === 0 ? (
            <p className="px-3 py-10 text-center text-sm text-muted-foreground">
              {isPending ? "검색 중…" : "검색 결과가 없습니다"}
            </p>
          ) : (
            <SearchResults results={results} onNavigate={() => onOpenChange(false)} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
