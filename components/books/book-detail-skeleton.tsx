import { Skeleton } from "@/components/ui/skeleton";

export function BookDetailSkeleton() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">در حال بارگذاری اطلاعات کتاب…</span>
      <div aria-hidden="true">
        <Skeleton className="h-5 w-64" />
        <div className="mt-6 grid gap-8 md:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] md:gap-10 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-14">
          <Skeleton className="mx-auto aspect-[2/3] w-full max-w-[15rem] rounded-lg md:max-w-none" />
          <div>
            <Skeleton className="h-10 w-4/5" />
            <Skeleton className="mt-3 h-6 w-1/3" />
            <div className="mt-8 flex gap-2">
              <Skeleton className="h-11 w-48" />
              <Skeleton className="h-11 w-44" />
            </div>
            <Skeleton className="mt-8 h-40 w-full rounded-xl" />
            <div className="mt-8 flex flex-wrap gap-2">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-7 w-24 rounded-full" />
              ))}
            </div>
          </div>
        </div>
        <div className="mt-12 max-w-3xl space-y-3">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </div>
  );
}
