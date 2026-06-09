"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { SearchFilters } from "./search-filters";
import type { WorkspaceFilter } from "@/lib/actions/search";

export function SearchBar({
  defaultQuery,
  defaultWorkspace,
}: {
  defaultQuery: string;
  defaultWorkspace: WorkspaceFilter;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(defaultQuery);
  const [workspace, setWorkspace] = useState<WorkspaceFilter>(defaultWorkspace);

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (workspace !== "all") params.set("workspace", workspace);
      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, workspace, pathname, router]);

  return (
    <div className="flex flex-col gap-3">
      <Input
        autoFocus
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="제목이나 본문으로 검색"
        className="h-11 text-base"
      />
      <SearchFilters value={workspace} onChange={setWorkspace} />
    </div>
  );
}
