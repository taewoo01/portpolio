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

export function InProgressDocuments({ documents }: { documents: Doc[] }) {
  return (
    <DocumentListSection
      title="진행 중"
      emptyText="진행 중인 문서가 없습니다."
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
