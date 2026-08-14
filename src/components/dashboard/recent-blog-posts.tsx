import Link from "next/link";
import { DocumentListSection } from "./document-list-section";
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
    <DocumentListSection
      title="최근 블로그 글"
      emptyText="아직 공개된 글이 없습니다."
      headerAction={
        <Link href="/blog" className="text-sm text-primary hover:underline">
          블로그 전체보기 →
        </Link>
      }
      items={posts.map((post) => ({
        id: post.id,
        href: `/blog/${post.slug}`,
        workspaceCategory: post.workspaceCategory,
        title: post.title,
        trailing: (
          <>
            {post.createdBy && <span>{USER_LABEL[post.createdBy as User]}</span>}
            <span>{post.publishedAt?.toLocaleDateString("ko-KR")}</span>
          </>
        ),
      }))}
    />
  );
}
