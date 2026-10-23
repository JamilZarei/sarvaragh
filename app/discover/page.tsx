import type { Metadata } from "next";
import { Suspense } from "react";

import { BookGridSkeleton } from "@/components/books/book-skeleton";
import { DiscoverView } from "@/components/discover/discover-view";
import { PageTransition } from "@/components/motion/page-transition";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "کشف کتاب‌ها",
  description: "جستجو در میان میلیون‌ها کتاب بر اساس عنوان، نویسنده، موضوع، زبان و سال انتشار.",
};

function DiscoverFallback() {
  return (
    <div className="grid items-start gap-8 lg:grid-cols-[16.5rem_minmax(0,1fr)] xl:gap-10">
      <Skeleton className="hidden h-[32rem] rounded-xl lg:block" />
      <div>
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="mt-5 flex justify-between gap-3">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-56" />
        </div>
        <BookGridSkeleton count={10} className="mt-8" />
      </div>
    </div>
  );
}

export default function DiscoverPage() {
  return (
    <PageTransition>
      <div className="container-page pt-8 sm:pt-12">
        <header className="mb-8 max-w-2xl">
          <p className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-primary">
            <span className="h-px w-6 bg-gold" aria-hidden="true" />
            کتابخانه دیجیتال
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">کشف کتاب‌ها</h1>
          <p className="mt-3 text-base leading-8 text-muted-foreground sm:text-lg">
            با جستجو، فیلتر موضوع، زبان و سال انتشار، کتاب بعدی‌ات را پیدا کن. وضعیت جستجو در نشانی صفحه ذخیره می‌شود و
            قابل اشتراک‌گذاری است.
          </p>
        </header>
        {/* useSearchParams lives inside this boundary, so the page shell can be prerendered. */}
        <Suspense fallback={<DiscoverFallback />}>
          <DiscoverView />
        </Suspense>
      </div>
    </PageTransition>
  );
}
