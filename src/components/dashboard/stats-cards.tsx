import { CountUpNumber } from "./count-up-number";

type Stat = {
  label: string;
  value: number;
  unit?: string;
};

export function StatsCards({
  totalDocuments,
  publishedPosts,
  pendingTodos,
  completedThisMonth,
}: {
  totalDocuments: number;
  publishedPosts: number;
  pendingTodos: number;
  completedThisMonth: number;
}) {
  const stats: Stat[] = [
    { label: "전체 문서", value: totalDocuments, unit: "개" },
    { label: "공개된 블로그 글", value: publishedPosts, unit: "개" },
    { label: "미완료 할 일", value: pendingTodos, unit: "개" },
    { label: "이번 달 완료", value: completedThisMonth, unit: "개" },
  ];

  return (
    <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-2xl bg-card p-6 text-card-foreground shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums leading-none">
            <CountUpNumber value={stat.value} />
            {stat.unit && <span className="ml-1 text-sm font-normal text-muted-foreground">{stat.unit}</span>}
          </p>
        </div>
      ))}
    </section>
  );
}
