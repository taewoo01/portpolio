import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/server/auth";
import { documentVisibilityWhere } from "@/lib/auth";
import { DocumentEditor } from "@/components/wiki/document-editor";

export default async function WikiDocumentPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  const currentUser = await getUser();
  if (!currentUser) redirect("/login");

  // 사이드바 목록과 동일한 가시성 필터(pair 규칙 + 폴더 visibleTo)를 적용해
  // 직접 URL 접근으로 폴더 제한을 우회할 수 없게 한다.
  const document = await prisma.document.findFirst({
    where: { id: documentId, AND: [documentVisibilityWhere(currentUser) ?? {}] },
  });
  if (!document) notFound();

  const blogPost = await prisma.blogPost.findFirst({ where: { documentId } });

  return (
    <DocumentEditor
      document={document}
      blogPost={blogPost}
      currentUser={currentUser}
    />
  );
}
