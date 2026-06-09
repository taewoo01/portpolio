import { searchDocumentsAction, type WorkspaceFilter } from "@/lib/actions/search";
import { SearchBar } from "@/components/search/search-bar";
import { SearchResults } from "@/components/search/search-results";

function toWorkspaceFilter(value: string | undefined): WorkspaceFilter {
  return value === "dev" || value === "study" ? value : "all";
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; workspace?: string }>;
}) {
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const workspace = toWorkspaceFilter(params.workspace);

  const results = query ? await searchDocumentsAction(query, workspace) : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">검색</h1>
        <p className="text-sm text-muted-foreground">
          개발·공부 위키 문서를 제목과 본문으로 검색합니다.
        </p>
      </div>

      <SearchBar defaultQuery={query} defaultWorkspace={workspace} />

      {!query ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          검색어를 입력해 문서를 찾아보세요.
        </p>
      ) : results.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          &ldquo;{query}&rdquo;에 대한 검색 결과가 없습니다.
        </p>
      ) : (
        <SearchResults results={results} />
      )}
    </div>
  );
}
