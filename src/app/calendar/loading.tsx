import { Skeleton } from "@/components/ui/skeleton";

export default function CalendarLoading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-7 w-20" />
      <Skeleton className="h-150 w-full rounded-lg" />
    </div>
  );
}
