import { Compass, Home } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "صفحه پیدا نشد",
};

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center py-20 text-center sm:py-28">
      <div className="relative mb-8 animate-fade-up" aria-hidden="true">
        <div className="flex items-end gap-1.5">
          <span className="block h-28 w-7 -rotate-6 rounded-sm bg-primary/80 shadow-book" />
          <span className="block h-32 w-8 rounded-sm bg-gold/80 shadow-book" />
          <span className="block h-24 w-6 rounded-sm bg-heart/70 shadow-book" />
          <span className="block h-20 w-9 translate-y-1 rotate-[32deg] rounded-sm border-2 border-dashed border-muted-foreground/40" />
        </div>
        <div className="mt-1 h-1.5 w-44 rounded-full bg-foreground/10" />
      </div>
      <p className="font-serif text-6xl font-semibold text-primary tabular-nums" dir="ltr">
        404
      </p>
      <h1 className="mt-4 text-2xl font-extrabold sm:text-3xl">این کتاب از قفسه جا مانده</h1>
      <p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground sm:text-base">
        صفحه‌ای که دنبالش هستی پیدا نشد؛ شاید نشانی اشتباه است یا این کتاب در{" "}
        <span dir="ltr" className="whitespace-nowrap">
          Open Library
        </span>{" "}
        وجود ندارد.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <Button asChild size="lg">
          <Link href="/discover">
            <Compass data-icon="inline-start" />
            کشف کتاب‌ها
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="bg-card">
          <Link href="/">
            <Home data-icon="inline-start" />
            صفحه اصلی
          </Link>
        </Button>
      </div>
    </div>
  );
}
