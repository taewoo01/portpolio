type Stat = {
  label: string;
  value: number;
  unit?: string;
};

export function StatsCards({
  devDocuments,
  studyDocuments,
  publishedPosts,
  pendingTodos,
}: {
  devDocuments: number;
  studyDocuments: number;
  publishedPosts: number;
  pendingTodos: number;
}) {
  const stats: Stat[] = [
    { label: "개발 문서", value: devDocuments, unit: "개" },
    { label: "공부 문서", value: studyDocuments, unit: "개" },
    { label: "공개된 블로그 글", value: publishedPosts, unit: "개" },
    { label: "미완료 할 일", value: pendingTodos, unit: "개" },
  ];

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-lg border bg-card p-4 text-card-foreground">
          <p className="text-xs text-muted-foreground">{stat.label}</p>
          <p className="mt-1 text-2xl font-semibold">
            {stat.value}
            {stat.unit && <span className="ml-1 text-sm font-normal text-muted-foreground">{stat.unit}</span>}
          </p>
        </div>
      ))}
    </section>
  );
}
