import Link from "next/link";
import { StatusBadge } from "@/components/wiki/document-meta";
import { cn } from "@/lib/utils";
import { WORKSPACE_BADGE_CLASS, WORKSPACE_LABEL } from "@/lib/wiki";
import type { SearchResult } from "@/lib/actions/search";

export function SearchResults({
  results,
  onNavigate,
}: {
  results: SearchResult[];
  onNavigate?: () => void;
}) {
  return (
    <ul className="flex flex-col divide-y">
      {results.map((result) => (
        <li key={result.id}>
          <Link
            href={`/${result.workspace}/${result.id}`}
            onClick={onNavigate}
            className="flex flex-col gap-1.5 rounded-md px-3 py-3 transition-colors hover:bg-accent"
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium",
                  WORKSPACE_BADGE_CLASS[result.workspace]
                )}
              >
                {WORKSPACE_LABEL[result.workspace]}
              </span>
              <StatusBadge status={result.status} />
              <span className="truncate font-medium">{result.title}</span>
            </div>
            <p className="line-clamp-2 text-sm text-muted-foreground">{result.snippet}</p>
            {result.matchedTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {result.matchedTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            <span className="text-xs text-muted-foreground">
              수정: {result.updatedAt.toLocaleString("ko-KR")}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
