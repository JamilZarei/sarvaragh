import { GRID_COLUMNS } from "@/components/books/book-grid";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function BookCardSkeleton() {
  return (
    <Card className="h-full gap-0 py-0 shadow-card ring-foreground/[0.07]">
      <Skeleton className="aspect-[2/3] w-full rounded-none" />
      <div className="space-y-2 p-3 sm:p-3.5">
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="mt-3 h-3 w-1/4" />
      </div>
    </Card>
  );
}

type BookGridSkeletonProps = {
  count?: number;
  columns?: keyof typeof GRID_COLUMNS;
  className?: string;
};

export function BookGridSkeleton({ count = 10, columns = "default", className }: BookGridSkeletonProps) {
  return (
    <div role="status" aria-live="polite" className={className}>
      <span className="sr-only">در حال بارگذاری کتاب‌ها…</span>
      <ul aria-hidden="true" className={cn("grid gap-x-3 gap-y-5 sm:gap-x-5 sm:gap-y-7", GRID_COLUMNS[columns])}>
        {Array.from({ length: count }, (_, i) => (
          <li key={i}>
            <BookCardSkeleton />
          </li>
        ))}
      </ul>
    </div>
  );
}
