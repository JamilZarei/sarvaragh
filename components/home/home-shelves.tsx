import { BookGridSkeleton } from "@/components/books/book-skeleton";
import { RetryButton } from "@/components/home/retry-button";
import { ShelfTabs } from "@/components/home/shelf-tabs";
import { getHomeShelves } from "@/lib/book-service";

export async function HomeShelves() {
  const shelves = await getHomeShelves();
  if (shelves.every((s) => s.books.length === 0)) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed p-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>در حال حاضر دریافت فهرست کتاب‌ها از Open Library ممکن نشد.</p>
        <RetryButton />
      </div>
    );
  }
  return <ShelfTabs shelves={shelves} />;
}

export function HomeShelvesSkeleton() {
  return <BookGridSkeleton count={6} columns="wide" />;
}
