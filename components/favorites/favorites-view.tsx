"use client";

import { Compass, HeartOff, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { BookGrid } from "@/components/books/book-grid";
import { BookGridSkeleton } from "@/components/books/book-skeleton";
import { BookSort } from "@/components/books/book-sort";
import { EmptyState } from "@/components/books/empty-state";
import { CountUp } from "@/components/motion/count-up";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useFavorites, useHydrated } from "@/hooks/use-favorites";
import { FAVORITE_SORTS, sortFavorites, type FavoritesSort } from "@/lib/favorites";
import { formatNumber } from "@/lib/format";

export function FavoritesView() {
  const hydrated = useHydrated();
  const { favorites, clear, replaceAll } = useFavorites();
  const [sort, setSort] = useState<FavoritesSort>("recent");

  // Same minimum height for skeleton, empty state and list, so the footer never jumps.
  if (!hydrated) return <BookGridSkeleton count={5} className="h-[26rem] overflow-hidden" />;

  if (favorites.length === 0) {
    return (
      <EmptyState
        className="min-h-[26rem] justify-center"
        icon={HeartOff}
        title="هنوز کتابی را نشان نکرده‌ای"
        description="با زدن دکمه قلب روی هر کتاب، آن را اینجا نگه دار. فهرست علاقه‌مندی‌ها فقط در همین مرورگر ذخیره می‌شود."
      >
        <Button asChild size="lg">
          <Link href="/discover">
            <Compass data-icon="inline-start" />
            رفتن به کشف کتاب‌ها
          </Link>
        </Button>
      </EmptyState>
    );
  }

  function clearAll() {
    const snapshot = favorites;
    clear();
    toast("فهرست علاقه‌مندی‌ها پاک شد", {
      action: { label: "بازگردانی", onClick: () => replaceAll(snapshot) },
    });
  }

  const sorted = sortFavorites(favorites, sort);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <p className="me-auto text-sm text-muted-foreground" aria-live="polite">
          <CountUp value={favorites.length} className="font-bold text-foreground tabular-nums" /> کتاب ذخیره‌شده
        </p>
        <BookSort id="favorites-sort" value={sort} onValueChange={setSort} options={FAVORITE_SORTS} />
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
              <Trash2 data-icon="inline-start" />
              حذف همه
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>همه علاقه‌مندی‌ها حذف شوند؟</DialogTitle>
              <DialogDescription className="leading-7">
                {formatNumber(favorites.length)} کتاب از فهرست شما حذف می‌شود. تا چند ثانیه بعد می‌توانید از پیام پایین صفحه آن را بازگردانید.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:justify-start">
              <DialogClose asChild>
                <Button variant="destructive" onClick={clearAll}>
                  بله، حذف کن
                </Button>
              </DialogClose>
              <DialogClose asChild>
                <Button variant="outline">انصراف</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <BookGrid key={sort} books={sorted} morph label="کتاب‌های موردعلاقه" />
    </div>
  );
}
