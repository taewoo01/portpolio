export default function CalendarLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-7 w-20 animate-pulse rounded bg-muted" />
      <div className="h-[600px] w-full animate-pulse rounded-lg bg-muted" />
    </div>
  );
}
