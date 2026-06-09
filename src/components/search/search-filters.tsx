"use client";

import { Button } from "@/components/ui/button";
import type { WorkspaceFilter } from "@/lib/actions/search";

const WORKSPACE_FILTERS: { value: WorkspaceFilter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "dev", label: "개발" },
  { value: "study", label: "공부" },
];

export function SearchFilters({
  value,
  onChange,
}: {
  value: WorkspaceFilter;
  onChange: (value: WorkspaceFilter) => void;
}) {
  return (
    <div className="flex gap-1">
      {WORKSPACE_FILTERS.map((item) => (
        <Button
          key={item.value}
          type="button"
          size="sm"
          variant={value === item.value ? "secondary" : "ghost"}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </Button>
      ))}
    </div>
  );
}
