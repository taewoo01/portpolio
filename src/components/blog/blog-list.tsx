"use client";

import { useCallback, useDeferredValue, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, FileText, Search, X } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { workspaceBadgeStyle } from "@/lib/wiki";
import { USER_LABEL } from "@/lib/auth";
import type { User } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Category = { id: string; name: string; color: string };
type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  publishedAt: Date | null;
  createdAt: Date;
  createdBy: string | null;
  workspaceCategoryId: string;
  workspaceCategory: Category;
  folderId: string | null;
  folder: { id: string; name: string } | null;
  document: { createdAt: Date } | null;
};

type Filter = "all" | string;
type Sort = "name" | "latest" | "created";
type Dir = "asc" | "desc";

const DEFAULT_DIR: Record<Sort, Dir> = {
  name: "asc",
  latest: "desc",
  created: "desc",
};

const PAGE_SIZE = 15;

function summarize(post: { excerpt: string | null; content: string }) {
  if (post.excerpt) return post.excerpt;
  return post.content.trim().slice(0, 120);
}

function buildSnippet(content: string, query: string): string {
  const idx = content.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return content.trim().slice(0, 120);

  const radius = 50;
  const start = Math.max(0, idx - radius);
  const end = Math.min(content.length, idx + query.length + radius);
  return `${start > 0 ? "…" : ""}${content.slice(start, end).trim()}${end < content.length ? "…" : ""}`;
}

export function BlogList({
  posts,
  categories,
  initialCategory = "all",
}: {
  posts: Post[];
  categories: Category[];
  initialCategory?: Filter;
}) {
  const [filter, setFilter] = useState<Filter>(initialCategory);
  const [folderFilter, setFolderFilter] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("latest");
  const [dir, setDir] = useState<Dir>("desc");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim());

  const chipScrollRef = useRef<HTMLDivElement>(null);
  const [fade, setFade] = useState({ left: false, right: false });

  const updateFade = useCallback(() => {
    const el = chipScrollRef.current;
    if (!el) return;
    setFade({
      left: el.scrollLeft > 2,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 2,
    });
  }, []);

  useEffect(() => {
    updateFade();
    const el = chipScrollRef.current;
    if (!el) return;
    const observer = new ResizeObserver(updateFade);
    observer.observe(el);
    return () => observer.disconnect();
  }, [updateFade]);

  const categoryPosts = filter === "all" ? posts : posts.filter((p) => p.workspaceCategoryId === filter);
  const foldersInCategory = Array.from(
    new Map(categoryPosts.flatMap((p) => (p.folder ? [[p.folder.id, p.folder] as const] : []))).values()
  );
  const folderFiltered = folderFilter ? categoryPosts.filter((p) => p.folderId === folderFilter) : categoryPosts;
  const lowered = deferredQuery.toLowerCase();
  const filtered = deferredQuery
    ? folderFiltered.filter(
        (p) =>
          p.title.toLowerCase().includes(lowered) ||
          (p.excerpt?.toLowerCase().includes(lowered) ?? false) ||
          p.content.toLowerCase().includes(lowered)
      )
    : folderFiltered;
  const sorted = [...filtered].sort((a, b) => {
    let cmp: number;
    if (sort === "name") {
      cmp = a.title.localeCompare(b.title, "ko");
    } else if (sort === "created") {
      cmp =
        (a.document?.createdAt ?? a.createdAt).getTime() -
        (b.document?.createdAt ?? b.createdAt).getTime();
    } else {
      cmp = (a.publishedAt?.getTime() ?? 0) - (b.publishedAt?.getTime() ?? 0);
    }
    return dir === "asc" ? cmp : -cmp;
  });
  const visible = sorted.slice(0, visibleCount);

  function selectFilter(f: Filter) {
    setFilter(f);
    setFolderFilter(null);
    setVisibleCount(PAGE_SIZE);
    window.history.replaceState(null, "", f === "all" ? "/blog" : `/blog?category=${f}`);
  }

  function selectFolder(f: string | null) {
    setFolderFilter(f);
    setVisibleCount(PAGE_SIZE);
  }

  function selectSort(s: Sort) {
    setSort(s);
    setDir(DEFAULT_DIR[s]);
    setVisibleCount(PAGE_SIZE);
  }

  function toggleDir() {
    setDir((d) => (d === "asc" ? "desc" : "asc"));
    setVisibleCount(PAGE_SIZE);
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    setVisibleCount(PAGE_SIZE);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">블로그</h1>
          <p className="text-sm text-muted-foreground">정리한 위키 문서 중 공개한 글입니다.</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Select value={sort} onValueChange={(v) => selectSort(v as Sort)}>
            <SelectTrigger className="w-28 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">이름</SelectItem>
              <SelectItem value="latest">발행일</SelectItem>
              <SelectItem value="created">파일 생성일</SelectItem>
            </SelectContent>
          </Select>
          <button
            type="button"
            onClick={toggleDir}
            aria-label={dir === "asc" ? "오름차순 (누르면 내림차순)" : "내림차순 (누르면 오름차순)"}
            className="focus-ring rounded-md border p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {dir === "asc" ? <ArrowUp className="size-4" /> : <ArrowDown className="size-4" />}
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="제목이나 본문으로 검색"
          className="pl-9"
        />
        {query && (
          <button
            type="button"
            onClick={() => handleQueryChange("")}
            aria-label="검색어 지우기"
            className="focus-ring absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <div className="relative w-fit max-w-full">
        <div
          ref={chipScrollRef}
          onScroll={updateFade}
          className="scrollbar-hide flex gap-0 overflow-x-auto rounded-lg border p-0.5 text-sm"
        >
          {(["all", ...categories.map((c) => c.id)] as Filter[]).map((f) => {
            const cat = categories.find((c) => c.id === f);
            const label = f === "all" ? "전체" : (cat?.name ?? f);
            return (
              <button
                key={f}
                onClick={() => selectFilter(f)}
                className="focus-ring relative shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 transition-colors duration-150"
              >
                {filter === f && (
                  <motion.div
                    layoutId="blog-filter-indicator"
                    className="absolute inset-0 rounded-md bg-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <span
                  className={cn(
                    "relative z-10",
                    filter === f ? "font-semibold text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
        {fade.left && (
          <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-8 rounded-l-lg bg-gradient-to-r from-background to-transparent" />
        )}
        {fade.right && (
          <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-8 rounded-r-lg bg-gradient-to-l from-background to-transparent" />
        )}
      </div>

      {foldersInCategory.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => selectFolder(null)}
            className={cn(
              "focus-ring rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
              folderFilter === null
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
            )}
          >
            전체 폴더
          </button>
          {foldersInCategory.map((folder) => (
            <button
              key={folder.id}
              onClick={() => selectFolder(folder.id)}
              className={cn(
                "focus-ring rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                folderFilter === folder.id
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              )}
            >
              {folder.name}
            </button>
          ))}
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
          <FileText className="size-6 text-muted-foreground/40" />
          {deferredQuery ? `"${deferredQuery}"에 대한 검색 결과가 없습니다.` : "해당 카테고리에 글이 없습니다."}
        </div>
      ) : (
        <>
          <ul className="flex flex-col divide-y">
            {visible.map((post) => (
              <li key={post.id}>
                <Link
                  href={filter === "all" ? `/blog/${post.slug}` : `/blog/${post.slug}?from=${filter}`}
                  className="focus-ring flex flex-col gap-1.5 rounded-md px-3 py-4 transition-all duration-150 hover:translate-x-0.5 hover:bg-accent"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium"
                      style={workspaceBadgeStyle(post.workspaceCategory.color)}
                    >
                      {post.workspaceCategory.name}
                    </span>
                    {post.folder && (
                      <span className="inline-flex shrink-0 items-center rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                        {post.folder.name}
                      </span>
                    )}
                    <span className="truncate text-lg font-medium">{post.title}</span>
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {deferredQuery && !post.title.toLowerCase().includes(lowered)
                      ? buildSnippet(post.content, deferredQuery)
                      : summarize(post)}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {post.createdBy && <span>{USER_LABEL[post.createdBy as User]}</span>}
                    <span>{post.publishedAt?.toLocaleDateString("ko-KR")} 발행</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          {visibleCount < sorted.length && (
            <button
              onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
              className="focus-ring mx-auto rounded-lg border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              더보기
            </button>
          )}
        </>
      )}
    </div>
  );
}
