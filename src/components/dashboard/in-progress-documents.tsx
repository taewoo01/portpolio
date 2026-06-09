import Link from "next/link";
import { StatusBadge } from "@/components/wiki/document-meta";
import { cn } from "@/lib/utils";
import { WORKSPACE_BADGE_CLASS, WORKSPACE_LABEL } from "@/lib/wiki";
import type { DocumentModel } from "@/generated/prisma/models";

export function InProgressDocuments({ documents }: { documents: DocumentModel[] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-medium">진행 중</h2>

      {documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">진행 중인 문서가 없습니다.</p>
      ) : (
        <ul className="divide-y">
          {documents.map((doc) => (
            <li key={doc.id}>
              <Link
                href={`/${doc.workspace}/${doc.id}`}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent"
              >
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium",
                    WORKSPACE_BADGE_CLASS[doc.workspace]
                  )}
                >
                  {WORKSPACE_LABEL[doc.workspace]}
                </span>
                <StatusBadge status={doc.status} />
                <span className="truncate font-medium">{doc.title}</span>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                  {doc.updatedAt.toLocaleDateString("ko-KR")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
