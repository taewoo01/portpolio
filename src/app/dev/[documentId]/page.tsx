import { redirect } from "next/navigation";

export default async function DevDocumentPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  redirect(`/wiki/${documentId}`);
}
