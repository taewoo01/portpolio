"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateDocumentAction, deleteDocumentAction } from "@/lib/actions/documents";
import { DocumentMeta, StatusBadge } from "./document-meta";
import { MarkdownEditor } from "./markdown-editor";
import { MarkdownPreview } from "./markdown-preview";
import { PublishBlogDialog } from "./publish-blog-dialog";
import { isOwner } from "@/lib/auth";
import type { DocumentModel, BlogPostModel } from "@/generated/prisma/models";
import type { DocumentStatus } from "@/generated/prisma/client";
import type { User } from "@/lib/auth";

function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const match = url.trim().match(/^https?:\/\/github\.com\/([^/]+)\/([^/\s]+?)(\.git)?\/?$/);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

function resolveAgainst(url: string, dirBase: string, rootBase: string): string {
  if (/^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith("//") || url.startsWith("#")) return url;
  try {
    return url.startsWith("/") ? new URL(url.slice(1), rootBase).toString() : new URL(url, dirBase).toString();
  } catch {
    return url;
  }
}

// README의 상대 경로(이미지/링크)를 GitHub 절대 URL로 변환 — 이미지는 raw 파일, 링크는 blob 페이지를 가리키도록
function rewriteGitHubUrls(markdown: string, data: { path: string; download_url: string; html_url: string }): string {
  const rawRoot = data.download_url.slice(0, data.download_url.length - data.path.length);
  const blobRoot = data.html_url.slice(0, data.html_url.length - data.path.length);
  const dir = data.path.includes("/") ? data.path.slice(0, data.path.lastIndexOf("/") + 1) : "";
  const rawDir = rawRoot + dir;
  const blobDir = blobRoot + dir;

  return markdown
    .replace(/!\[([^\]]*)\]\(([^()\s]+)((?:\s+"[^"]*")?)\)/g, (_m, alt, url, title) =>
      `![${alt}](${resolveAgainst(url, rawDir, rawRoot)}${title})`
    )
    .replace(/(?<!!)\[([^\]]*)\]\(([^()\s]+)((?:\s+"[^"]*")?)\)/g, (_m, text, url, title) =>
      `[${text}](${resolveAgainst(url, blobDir, blobRoot)}${title})`
    )
    .replace(/(<img\b[^>]*?\bsrc=)(["'])([^"']+)\2/gi, (_m, pre, q, url) =>
      `${pre}${q}${resolveAgainst(url, rawDir, rawRoot)}${q}`
    )
    .replace(/(<source\b[^>]*?\bsrcset=)(["'])([^"']+)\2/gi, (_m, pre, q, url) =>
      `${pre}${q}${resolveAgainst(url, rawDir, rawRoot)}${q}`
    )
    .replace(/(<a\b[^>]*?\bhref=)(["'])([^"']+)\2/gi, (_m, pre, q, url) =>
      `${pre}${q}${resolveAgainst(url, blobDir, blobRoot)}${q}`
    );
}

function GitHubImport({ content, onImport }: { content: string; onImport: (md: string) => void }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleImport() {
    const parsed = parseGitHubUrl(url);
    if (!parsed) {
      setError("올바른 GitHub URL을 입력해주세요. (예: https://github.com/owner/repo)");
      return;
    }

    if (content.trim() && !window.confirm("현재 내용을 README로 덮어쓸까요?")) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/readme`,
        { headers: { Accept: "application/vnd.github.v3+json" } }
      );
      if (!res.ok) {
        setError(res.status === 404 ? "레포지토리 또는 README를 찾을 수 없습니다." : `오류가 발생했습니다. (${res.status})`);
        return;
      }
      const data = await res.json();
      const binary = atob(data.content.replace(/\n/g, ""));
      const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      const markdown = new TextDecoder("utf-8").decode(bytes);
      onImport(rewriteGitHubUrls(markdown, data));
      setUrl("");
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-2">
        <Input
          value={url}
          onChange={(e) => { setUrl(e.target.value); setError(null); }}
          onKeyDown={(e) => e.key === "Enter" && handleImport()}
          placeholder="https://github.com/owner/repo"
          className="font-mono text-sm"
          disabled={loading}
        />
        <Button type="button" variant="outline" size="sm" onClick={handleImport} disabled={loading}>
          {loading ? "가져오는 중…" : "README 가져오기"}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function DocumentEditor({
  document,
  blogPost,
  currentUser,
}: {
  document: DocumentModel;
  blogPost: BlogPostModel | null;
  currentUser: User | null;
}) {
  const router = useRouter();
  const [isDeleting, startDelete] = useTransition();
  const [isSaving, startSave] = useTransition();
  const [isPublishDialogOpen, setPublishDialogOpen] = useState(false);

  const canEdit = isOwner(currentUser, document.createdBy ?? null);
  const [isEditing, setIsEditing] = useState(canEdit && document.status !== "done");
  const [status, setStatus] = useState<DocumentStatus>(document.status);
  const [content, setContent] = useState(document.content);

  function handleSubmit(formData: FormData) {
    startSave(async () => {
      const result = await updateDocumentAction(document.workspaceCategoryId, document.id, formData);
      if (result?.error) { console.error(result.error); return; }
      router.refresh();
      if (status === "done") setIsEditing(false);
    });
  }

  function handleDelete() {
    if (!window.confirm(`"${document.title}" 문서를 삭제할까요? 되돌릴 수 없습니다.`)) return;
    startDelete(async () => {
      const result = await deleteDocumentAction(document.workspaceCategoryId, document.id);
      if (result?.error) { console.error(result.error); return; }
      router.push("/wiki");
      router.refresh();
    });
  }

  const blogButton = canEdit && (
    <Button type="button" variant="outline" onClick={() => setPublishDialogOpen(true)}>
      {blogPost?.published ? "블로그 관리" : "블로그 발행"}
    </Button>
  );

  const publishDialog = canEdit && (
    <PublishBlogDialog
      open={isPublishDialogOpen}
      onOpenChange={setPublishDialogOpen}
      documentId={document.id}
      documentTitle={document.title}
      post={blogPost}
    />
  );

  if (!isEditing) {
    return (
      <div className="flex h-full flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">{document.title}</h1>
            <StatusBadge status={document.status} />
          </div>
          <div className="flex shrink-0 gap-2">
            {canEdit && (
              <Button type="button" onClick={() => setIsEditing(true)}>
                수정
              </Button>
            )}
            {blogButton}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {document.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
            >
              #{tag}
            </span>
          ))}
          <span className="ml-auto shrink-0 text-xs">
            수정: {document.updatedAt.toLocaleString("ko-KR")}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto rounded-md border px-4 py-3">
          <MarkdownPreview content={content} />
        </div>

        {publishDialog}
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="flex h-full flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <Input
          name="title"
          defaultValue={document.title}
          placeholder="제목"
          className="h-auto border-none px-0 text-xl font-semibold shadow-none focus-visible:ring-0"
        />
        <div className="flex shrink-0 gap-2">
          <Button type="submit" disabled={isSaving}>
            저장
          </Button>
          {document.status === "done" && (
            <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>
              취소
            </Button>
          )}
          {blogButton}
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            삭제
          </Button>
        </div>
      </div>

      <DocumentMeta
        status={status}
        onStatusChange={setStatus}
        defaultTags={document.tags}
        updatedAt={document.updatedAt}
      />

      <GitHubImport content={content} onImport={setContent} />

      <MarkdownEditor name="content" value={content} onChange={setContent} />

      {publishDialog}
    </form>
  );
}
