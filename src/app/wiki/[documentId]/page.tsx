import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/server/auth";
import { canView } from "@/lib/auth";
import { DocumentEditor } from "@/components/wiki/document-editor";

export default async function WikiDocumentPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  const [document, currentUser] = await Promise.all([
    prisma.document.findUnique({ where: { id: documentId } }),
    getUser(),
  ]);

  if (!document || !canView(currentUser, document.createdBy)) notFound();

  const blogPost = await prisma.blogPost.findFirst({ where: { documentId } });

  return (
    <DocumentEditor
      document={document}
      blogPost={blogPost}
      currentUser={currentUser}
    />
  );
}
