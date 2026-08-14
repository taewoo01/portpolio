import { Skeleton } from "@/components/ui/skeleton";

export default function SearchLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-16" />
        <Skeleton className="h-4 w-56" />
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  );
}
