import Link from "next/link";
import { workspaceBadgeStyle } from "@/lib/wiki";
import type { StudySessionModel } from "@/generated/prisma/models";

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}시간 ${m}분`;
  if (m > 0) return `${m}분 ${s}초`;
  return `${s}초`;
}

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

type Document = {
  id: string;
  title: string;
  updatedAt: Date;
  workspaceCategory: { id: string; name: string; color: string };
};
type BlogPost = { id: string; title: string; slug: string; publishedAt: Date | null };

export function TodayActivity({
  sessions,
  documents,
  blogPosts,
}: {
  sessions: StudySessionModel[];
  documents: Document[];
  blogPosts: BlogPost[];
}) {
  const totalSeconds = sessions.reduce((sum, s) => sum + (s.duration ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">오늘 활동</h2>
        {totalSeconds > 0 && (
          <span className="text-sm text-muted-foreground">
            총 공부 시간: <span className="font-medium text-foreground">{formatDuration(totalSeconds)}</span>
          </span>
        )}
      </div>

      <div className="rounded-xl border bg-card divide-y">
        <Section title="공부 세션" empty={sessions.length === 0} emptyText="오늘 완료된 세션이 없습니다">
          {sessions.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="truncate">{s.title}</span>
              <span className="ml-4 shrink-0 text-muted-foreground">{formatDuration(s.duration ?? 0)}</span>
            </div>
          ))}
        </Section>

        <Section title="수정된 문서" empty={documents.length === 0} emptyText="오늘 수정된 문서가 없습니다">
          {documents.map((d) => (
            <div key={d.id} className="flex items-center gap-2 px-4 py-2.5 text-sm">
              <span
                className="shrink-0 rounded-full px-1.5 py-0.5 text-xs font-medium"
                style={workspaceBadgeStyle(d.workspaceCategory.color)}
              >
                {d.workspaceCategory.name}
              </span>
              <Link href={`/wiki/${d.id}`} className="truncate hover:underline">
                {d.title}
              </Link>
              <span className="ml-auto shrink-0 text-muted-foreground">{formatTime(d.updatedAt)}</span>
            </div>
          ))}
        </Section>

        <Section title="발행된 블로그" empty={blogPosts.length === 0} emptyText="오늘 발행된 글이 없습니다">
          {blogPosts.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <Link href={`/blog/${p.slug}`} className="truncate hover:underline">
                {p.title}
              </Link>
              {p.publishedAt && (
                <span className="ml-4 shrink-0 text-muted-foreground">{formatTime(p.publishedAt)}</span>
              )}
            </div>
          ))}
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  empty,
  emptyText,
  children,
}: {
  title: string;
  empty: boolean;
  emptyText: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="px-4 py-2 text-xs font-medium text-muted-foreground bg-muted/40">{title}</div>
      {empty ? (
        <p className="px-4 py-2.5 text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        children
      )}
    </div>
  );
}
