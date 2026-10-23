import type { Metadata } from "next";

import { FavoritesView } from "@/components/favorites/favorites-view";
import { PageTransition } from "@/components/motion/page-transition";

export const metadata: Metadata = {
  title: "علاقه‌مندی‌ها",
  description: "کتاب‌هایی که برای بعد نگه داشته‌ای؛ ذخیره‌شده در همین مرورگر.",
  robots: { index: false },
};

export default function FavoritesPage() {
  return (
    <PageTransition>
      <div className="container-page pt-8 sm:pt-12">
        <header className="mb-8 max-w-2xl">
          <p className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-primary">
            <span className="h-px w-6 bg-gold" aria-hidden="true" />
            قفسه شخصی
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">علاقه‌مندی‌ها</h1>
          <p className="mt-3 text-base leading-8 text-muted-foreground sm:text-lg">
            کتاب‌هایی که نشان کرده‌ای اینجا می‌مانند، حتی بعد از بستن مرورگر. این فهرست فقط روی همین دستگاه ذخیره می‌شود.
          </p>
        </header>
        <FavoritesView />
      </div>
    </PageTransition>
  );
}
