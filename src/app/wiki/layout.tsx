import { prisma } from "@/lib/db";
import { getUser } from "@/lib/server/auth";
import { visibilityWhere, folderVisibilityWhere } from "@/lib/auth";
import { buildFolderTree } from "@/lib/wiki";
import { WikiLayout } from "@/components/wiki/wiki-layout";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const currentUser = await getUser();
  const visibility = visibilityWhere(currentUser);
  const folderVisibility = folderVisibilityWhere(currentUser);
  const [folders, documents, categories] = await Promise.all([
    prisma.folder.findMany({
      where: folderVisibility,
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
      where: folderVisibility === undefined
        ? undefined
        : {
            OR: [
              { folderId: null, ...visibility },
              { folder: folderVisibility },
            ],
          },
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
