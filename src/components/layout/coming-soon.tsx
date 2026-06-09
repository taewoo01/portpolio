export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-muted-foreground">준비 중입니다.</p>
    </div>
  );
}
