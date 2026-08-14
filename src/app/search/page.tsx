import { redirect } from "next/navigation";
import { Search as SearchIcon, FileQuestion } from "lucide-react";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/server/auth";
import { searchDocumentsAction, type WorkspaceFilter } from "@/lib/actions/search";
import { SearchBar } from "@/components/search/search-bar";
import { SearchResults } from "@/components/search/search-results";

function toWorkspaceFilter(value: string | undefined): WorkspaceFilter {
  if (!value || value === "all") return "all";
  return value;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; workspace?: string }>;
}) {
  if (!(await getUser())) redirect("/login");
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const workspace = toWorkspaceFilter(params.workspace);

  const [results, categories] = await Promise.all([
    query ? searchDocumentsAction(query, workspace) : Promise.resolve([]),
    prisma.workspaceCategory.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">검색</h1>
        <p className="text-sm text-muted-foreground">
          위키 문서를 제목과 본문으로 검색합니다.
        </p>
      </div>

      <SearchBar defaultQuery={query} defaultWorkspace={workspace} categories={categories} />

      {!query ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
          <SearchIcon className="size-6 text-muted-foreground/40" />
          검색어를 입력해 문서를 찾아보세요.
        </div>
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
          <FileQuestion className="size-6 text-muted-foreground/40" />
          &ldquo;{query}&rdquo;에 대한 검색 결과가 없습니다.
        </div>
      ) : (
        <SearchResults results={results} />
      )}
    </div>
  );
}
