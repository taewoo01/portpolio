import { Skeleton } from "@/components/ui/skeleton";

export default function WikiLoading() {
  return (
    <div className="flex gap-6">
      <div className="hidden w-(--wiki-sidebar-width) shrink-0 flex-col gap-3 md:flex">
        <Skeleton className="h-8 w-full" />
        <div className="flex flex-col gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-full" />
          ))}
        </div>
      </div>
      <div className="min-w-0 flex-1 max-w-(--wiki-reading-width) space-y-3">
        <Skeleton className="h-7 w-1/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}
