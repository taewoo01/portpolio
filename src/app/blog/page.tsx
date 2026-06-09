import Link from "next/link";
import { getPublishedPosts } from "@/lib/blog";
import { cn } from "@/lib/utils";
import { WORKSPACE_BADGE_CLASS, WORKSPACE_LABEL } from "@/lib/wiki";
import { USER_LABEL } from "@/lib/auth";
import type { User } from "@/lib/auth";

function summarize(post: { excerpt: string | null; content: string }) {
  if (post.excerpt) return post.excerpt;
  return post.content.trim().slice(0, 120);
}

export default async function BlogPage() {
  const posts = await getPublishedPosts();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">블로그</h1>
        <p className="text-sm text-muted-foreground">정리한 위키 문서 중 공개한 글입니다.</p>
      </div>

      {posts.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">아직 공개된 글이 없습니다.</p>
      ) : (
        <ul className="flex flex-col divide-y">
          {posts.map((post) => (
            <li key={post.id}>
              <Link
                href={`/blog/${post.slug}`}
                className="flex flex-col gap-1.5 rounded-md px-3 py-4 transition-colors hover:bg-accent"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      WORKSPACE_BADGE_CLASS[post.workspace]
                    )}
                  >
                    {WORKSPACE_LABEL[post.workspace]}
                  </span>
                  <span className="truncate text-lg font-medium">{post.title}</span>
                </div>
                <p className="line-clamp-2 text-sm text-muted-foreground">{summarize(post)}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {post.createdBy && (
                    <span>{USER_LABEL[post.createdBy as User]}</span>
                  )}
                  <span>{post.publishedAt?.toLocaleDateString("ko-KR")} 발행</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
