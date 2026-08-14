import { StatusBadge } from "@/components/wiki/document-meta";
import { DocumentListSection } from "./document-list-section";
import type { DocumentStatus } from "@/generated/prisma/client";

type Doc = {
  id: string;
  title: string;
  status: DocumentStatus;
  updatedAt: Date;
  workspaceCategory: { id: string; name: string; color: string };
};

export function RecentDocuments({ documents }: { documents: Doc[] }) {
  return (
    <DocumentListSection
      title="최근 문서"
      emptyText="아직 문서가 없습니다."
      items={documents.map((doc) => ({
        id: doc.id,
        href: `/wiki/${doc.id}`,
        workspaceCategory: doc.workspaceCategory,
        title: doc.title,
        extraBadge: <StatusBadge status={doc.status} />,
        trailing: doc.updatedAt.toLocaleDateString("ko-KR"),
      }))}
    />
  );
}
