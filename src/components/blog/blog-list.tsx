"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { workspaceBadgeStyle } from "@/lib/wiki";
import { USER_LABEL } from "@/lib/auth";
import type { User } from "@/lib/auth";
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
  createdBy: string | null;
  workspaceCategoryId: string;
  workspaceCategory: Category;
  folderId: string | null;
  folder: { id: string; name: string } | null;
};

type Filter = "all" | string;
type Sort = "name" | "latest";

const PAGE_SIZE = 15;

function summarize(post: { excerpt: string | null; content: string }) {
  if (post.excerpt) return post.excerpt;
  return post.content.trim().slice(0, 120);
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
  const [sort, setSort] = useState<Sort>("name");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

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
  const filtered = folderFilter ? categoryPosts.filter((p) => p.folderId === folderFilter) : categoryPosts;
  const sorted = [...filtered].sort((a, b) => {
    if (sort === "name") return a.title.localeCompare(b.title, "ko");
    return (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0);
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
    setVisibleCount(PAGE_SIZE);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">블로그</h1>
          <p className="text-sm text-muted-foreground">정리한 위키 문서 중 공개한 글입니다.</p>
        </div>
        <Select value={sort} onValueChange={(v) => selectSort(v as Sort)}>
          <SelectTrigger className="w-28 shrink-0 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">이름순</SelectItem>
            <SelectItem value="latest">최신순</SelectItem>
          </SelectContent>
        </Select>
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
                className="relative shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 transition-colors duration-150"
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
              "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
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
                "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
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
        <p className="py-12 text-center text-sm text-muted-foreground">해당 카테고리에 글이 없습니다.</p>
      ) : (
        <>
          <ul className="flex flex-col divide-y">
            {visible.map((post) => (
              <li key={post.id}>
                <Link
                  href={filter === "all" ? `/blog/${post.slug}` : `/blog/${post.slug}?from=${filter}`}
                  className="flex flex-col gap-1.5 rounded-md px-3 py-4 transition-colors hover:bg-accent"
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
                  <p className="line-clamp-2 text-sm text-muted-foreground">{summarize(post)}</p>
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
              className="mx-auto rounded-lg border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              더보기
            </button>
          )}
        </>
      )}
    </div>
  );
}
