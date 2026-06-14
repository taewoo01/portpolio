import Link from "next/link";
import { workspaceBadgeStyle } from "@/lib/wiki";
import { USER_LABEL } from "@/lib/auth";
import type { User } from "@/lib/auth";

type Post = {
  id: string;
  title: string;
  slug: string;
  publishedAt: Date | null;
  createdBy: string | null;
  workspaceCategory: { id: string; name: string; color: string };
};

export function RecentBlogPosts({ posts }: { posts: Post[] }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">최근 블로그 글</h2>
        <Link href="/blog" className="text-sm text-primary hover:underline">
          블로그 전체보기 →
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="text-sm text-muted-foreground">아직 공개된 글이 없습니다.</p>
      ) : (
        <ul className="divide-y">
          {posts.map((post) => (
            <li key={post.id}>
              <Link
                href={`/blog/${post.slug}`}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent"
              >
                <span
                  className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium"
                  style={workspaceBadgeStyle(post.workspaceCategory.color)}
                >
                  {post.workspaceCategory.name}
                </span>
                <span className="truncate font-medium">{post.title}</span>
                <div className="ml-auto flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                  {post.createdBy && (
                    <span>{USER_LABEL[post.createdBy as User]}</span>
                  )}
                  <span>{post.publishedAt?.toLocaleDateString("ko-KR")}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
