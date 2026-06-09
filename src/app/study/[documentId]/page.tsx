import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/server/auth";
import { DocumentEditor } from "@/components/wiki/document-editor";

export default async function StudyDocumentPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  const [document, currentUser] = await Promise.all([
    prisma.document.findFirst({ where: { id: documentId, workspace: "study" } }),
    getUser(),
  ]);

  if (!document) notFound();

  const blogPost = await prisma.blogPost.findFirst({ where: { documentId } });

  return <DocumentEditor workspace="study" document={document} blogPost={blogPost} currentUser={currentUser} />;
}
