import { redirect } from "next/navigation";

export default async function StudyDocumentPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  redirect(`/wiki/${documentId}`);
}
