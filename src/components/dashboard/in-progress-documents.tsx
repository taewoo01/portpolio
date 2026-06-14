import Link from "next/link";
import { StatusBadge } from "@/components/wiki/document-meta";
import { workspaceBadgeStyle } from "@/lib/wiki";
import type { DocumentStatus } from "@/generated/prisma/client";

type Doc = {
  id: string;
  title: string;
  status: DocumentStatus;
  updatedAt: Date;
  workspaceCategory: { id: string; name: string; color: string };
};

export function InProgressDocuments({ documents }: { documents: Doc[] }) {
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
                href={`/wiki/${doc.id}`}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent"
              >
                <span
                  className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium"
                  style={workspaceBadgeStyle(doc.workspaceCategory.color)}
                >
                  {doc.workspaceCategory.name}
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
