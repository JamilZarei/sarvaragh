"use client";

import type { ReactNode } from "react";

import { BookCard, type BookCardBook } from "@/components/books/book-card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

type BookCarouselProps = {
  books: readonly BookCardBook[];
  label: string;
  /** Shown on the start side of the header row, next to the arrows. */
  caption?: ReactNode;
  eagerCount?: number;
};

const SIZES = "(min-width: 1280px) 190px, (min-width: 1024px) 18vw, (min-width: 768px) 23vw, (min-width: 640px) 30vw, 44vw";

/** Swipeable, keyboard-accessible (RTL-aware arrows) row of book cards. */
export function BookCarousel({ books, label, caption, eagerCount = 0 }: BookCarouselProps) {
  return (
    <Carousel opts={{ direction: "rtl", align: "start", dragFree: true }} aria-label={label}>
      <div className="mb-4 flex min-h-9 items-center justify-between gap-4">
        <div className="text-sm leading-7 text-muted-foreground">{caption}</div>
        <div className="hidden shrink-0 gap-2 sm:flex">
          <CarouselPrevious className="static size-9 translate-y-0 bg-card" />
          <CarouselNext className="static size-9 translate-y-0 bg-card" />
        </div>
      </div>
      <CarouselContent className="-ms-3 pt-2 pb-4 sm:-ms-5">
        {books.map((book, i) => (
          <CarouselItem key={book.id} className="basis-[46%] ps-3 sm:basis-1/3 sm:ps-5 md:basis-1/4 lg:basis-1/5 xl:basis-1/6">
            <BookCard book={book} index={i} eager={i < eagerCount} sizes={SIZES} />
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}
