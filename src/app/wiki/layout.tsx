import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/server/auth";
import { folderVisibilityWhere, documentVisibilityWhere } from "@/lib/auth";
import { buildFolderTree } from "@/lib/wiki";
import { WikiLayout } from "@/components/wiki/wiki-layout";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const currentUser = await getUser();
  if (!currentUser) redirect("/login");
  const [folders, documents, categories] = await Promise.all([
    prisma.folder.findMany({
      where: folderVisibilityWhere(currentUser),
      select: {
        id: true,
        name: true,
        parentId: true,
        createdBy: true,
        visibleTo: true,
        workspaceCategory: { select: { id: true, name: true, color: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.document.findMany({
      where: documentVisibilityWhere(currentUser),
      select: {
        id: true,
        title: true,
        folderId: true,
        status: true,
        createdBy: true,
        workspaceCategory: { select: { id: true, name: true, color: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.workspaceCategory.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  const tree = buildFolderTree(folders, documents);
  return (
    <WikiLayout tree={tree} currentUser={currentUser} categories={categories}>
      {children}
    </WikiLayout>
  );
}
