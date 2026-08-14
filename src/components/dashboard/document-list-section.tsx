import Link from "next/link";
import { workspaceBadgeStyle } from "@/lib/wiki";
import type { ReactNode } from "react";

export type ListSectionItem = {
  id: string;
  href: string;
  workspaceCategory: { name: string; color: string };
  title: string;
  extraBadge?: ReactNode;
  trailing?: ReactNode;
};

export function DocumentListSection({
  title,
  emptyText,
  items,
  headerAction,
}: {
  title: string;
  emptyText: string;
  items: ListSectionItem[];
  headerAction?: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">{title}</h2>
        {headerAction}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="divide-y">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="focus-ring flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-all duration-150 hover:translate-x-0.5 hover:bg-accent"
              >
                <span
                  className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium"
                  style={workspaceBadgeStyle(item.workspaceCategory.color)}
                >
                  {item.workspaceCategory.name}
                </span>
                {item.extraBadge}
                <span className="truncate font-medium">{item.title}</span>
                {item.trailing && (
                  <div className="ml-auto flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                    {item.trailing}
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
