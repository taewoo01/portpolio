"use client";

import { Button } from "@/components/ui/button";
import { workspaceBadgeStyle } from "@/lib/wiki";
import type { WorkspaceFilter } from "@/lib/actions/search";
import type { WorkspaceCategory } from "@/lib/wiki";

export function SearchFilters({
  categories,
  value,
  onChange,
}: {
  categories: WorkspaceCategory[];
  value: WorkspaceFilter;
  onChange: (value: WorkspaceFilter) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      <Button
        type="button"
        size="sm"
        variant={value === "all" ? "secondary" : "ghost"}
        onClick={() => onChange("all")}
      >
        전체
      </Button>
      {categories.map((cat) => (
        <Button
          key={cat.id}
          type="button"
          size="sm"
          variant={value === cat.id ? "secondary" : "ghost"}
          onClick={() => onChange(cat.id)}
          style={value === cat.id ? workspaceBadgeStyle(cat.color) : undefined}
        >
          {cat.name}
        </Button>
      ))}
    </div>
  );
}
