"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type HeadingItem = { level: number; text: string; id: string };
type HeadingNode = HeadingItem & { children: HeadingNode[] };

function buildTree(items: HeadingItem[]): HeadingNode[] {
  const root: HeadingNode[] = [];
  const stack: HeadingNode[] = [];
  for (const item of items) {
    const node: HeadingNode = { ...item, children: [] };
    while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
      stack.pop();
    }
    if (stack.length === 0) root.push(node);
    else stack[stack.length - 1].children.push(node);
    stack.push(node);
  }
  return root;
}

function TocNode({ node, activeId }: { node: HeadingNode; activeId: string | null }) {
  return (
    <li>
      <a
        href={`#${node.id}`}
        onClick={(e) => {
          e.preventDefault();
          const el = document.getElementById(node.id);
          if (!el) return;
          const NAVBAR_HEIGHT = 72;
          const top = el.getBoundingClientRect().top + window.scrollY - NAVBAR_HEIGHT;
          window.scrollTo({ top, behavior: "smooth" });
        }}
        className={cn(
          "block truncate py-0.5 text-sm transition-colors hover:text-foreground",
          activeId === node.id
            ? "font-medium text-primary"
            : "text-muted-foreground"
        )}
      >
        {node.text}
      </a>
      {node.children.length > 0 && (
        <ul className="mt-0.5 space-y-0.5 border-l border-border pl-3">
          {node.children.map((child) => (
            <TocNode key={child.id} node={child} activeId={activeId} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function TableOfContents({ headings }: { headings: HeadingItem[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const tree = buildTree(headings);

  useEffect(() => {
    if (headings.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-80px 0% -60% 0%", threshold: 0 }
    );
    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [headings]);

  if (tree.length === 0) return null;

  return (
    <nav className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        목차
      </p>
      <ul className="space-y-1">
        {tree.map((node) => (
          <TocNode key={node.id} node={node} activeId={activeId} />
        ))}
      </ul>
    </nav>
  );
}
