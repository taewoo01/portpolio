import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostBySlug } from "@/lib/blog";
import { MarkdownPreview } from "@/components/wiki/markdown-preview";
import { cn } from "@/lib/utils";
import { WORKSPACE_BADGE_CLASS, WORKSPACE_LABEL } from "@/lib/wiki";
import { USER_LABEL } from "@/lib/auth";
import type { User } from "@/lib/auth";

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(decodeURIComponent(slug));

  if (!post || !post.published) notFound();

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground">
        ← 목록으로
      </Link>

      <header className="flex flex-col gap-2">
        <span
          className={cn(
            "inline-flex w-fit shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium",
            WORKSPACE_BADGE_CLASS[post.workspace]
          )}
        >
          {WORKSPACE_LABEL[post.workspace]}
        </span>
        <h1 className="text-3xl font-semibold">{post.title}</h1>
        <p className="text-sm text-muted-foreground">
          {post.createdBy && (
            <span className="mr-2">{USER_LABEL[post.createdBy as User]}</span>
          )}
          {post.publishedAt?.toLocaleDateString("ko-KR")} 발행
        </p>
      </header>

      <MarkdownPreview content={post.content} />

      <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground">
        ← 목록으로
      </Link>
    </article>
  );
}
