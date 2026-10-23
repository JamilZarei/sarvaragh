"use client";

import { RotateCw, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function RouteError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <div className="mb-6 grid size-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
        <TriangleAlert className="size-6" aria-hidden="true" />
      </div>
      <h1 className="text-2xl font-extrabold">مشکلی پیش آمد</h1>
      <p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground">
        هنگام نمایش این صفحه خطایی رخ داد. معمولاً تلاش دوباره مشکل را حل می‌کند.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <Button size="lg" onClick={() => retry()}>
          <RotateCw data-icon="inline-start" />
          تلاش دوباره
        </Button>
        <Button asChild size="lg" variant="outline" className="bg-card">
          <Link href="/">صفحه اصلی</Link>
        </Button>
      </div>
    </div>
  );
}
