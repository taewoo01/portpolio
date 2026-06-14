"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { workspaceBadgeStyle } from "@/lib/wiki";
import { USER_LABEL } from "@/lib/auth";
import type { User } from "@/lib/auth";

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
};

type Filter = "all" | string;

function summarize(post: { excerpt: string | null; content: string }) {
  if (post.excerpt) return post.excerpt;
  return post.content.trim().slice(0, 120);
}

export function BlogList({
  posts,
  categories,
}: {
  posts: Post[];
  categories: Category[];
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const filtered = filter === "all" ? posts : posts.filter((p) => p.workspaceCategoryId === filter);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">블로그</h1>
        <p className="text-sm text-muted-foreground">정리한 위키 문서 중 공개한 글입니다.</p>
      </div>

      <div className="flex w-fit gap-0 rounded-lg border p-0.5 text-sm">
        {(["all", ...categories.map((c) => c.id)] as Filter[]).map((f) => {
          const cat = categories.find((c) => c.id === f);
          const label = f === "all" ? "전체" : (cat?.name ?? f);
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="relative rounded-md px-3 py-1.5 transition-colors duration-150"
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

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">해당 카테고리에 글이 없습니다.</p>
      ) : (
        <ul className="flex flex-col divide-y">
          {filtered.map((post) => (
            <li key={post.id}>
              <Link
                href={`/blog/${post.slug}`}
                className="flex flex-col gap-1.5 rounded-md px-3 py-4 transition-colors hover:bg-accent"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium"
                    style={workspaceBadgeStyle(post.workspaceCategory.color)}
                  >
                    {post.workspaceCategory.name}
                  </span>
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
      )}
    </div>
  );
}
