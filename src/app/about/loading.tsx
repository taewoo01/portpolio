import { Skeleton } from "@/components/ui/skeleton";

export default function AboutLoading() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-10">
      <div className="flex items-center gap-4">
        <Skeleton className="size-16 shrink-0 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
      <div className="space-y-3 border-t pt-8">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  );
}
