export default function BlogLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <div className="h-7 w-24 animate-pulse rounded bg-muted" />
        <div className="h-4 w-64 animate-pulse rounded bg-muted" />
      </div>
      <ul className="flex flex-col divide-y">
        {Array.from({ length: 3 }).map((_, i) => (
          <li key={i} className="flex flex-col gap-2 px-3 py-4">
            <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
          </li>
        ))}
      </ul>
    </div>
  );
}
