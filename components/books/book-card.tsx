import { Star, Users } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";

import { BookCover } from "@/components/books/book-cover";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { displayTitle } from "@/lib/books";
import {
  displayAuthorList,
  formatAuthors,
  formatCompact,
  formatRating,
  formatYear,
  originalTitleIfTranslated,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type { BookSummary } from "@/types/book";

export type BookCardBook = Pick<BookSummary, "id" | "title" | "authors" | "firstPublishYear" | "coverId"> &
  Partial<Pick<BookSummary, "titleFa" | "authorsFa" | "ratingAverage" | "readers" | "coverEditionId">>;

type BookCardProps = {
  book: BookCardBook;
  /** Position in the grid; used for a short, capped entrance stagger. */
  index?: number;
  /** Load the cover eagerly (above the fold). */
  eager?: boolean;
  /** Enables the shared-element cover morph into the book page. */
  morph?: boolean;
  sizes?: string;
  className?: string;
};

const LONG_TITLE = 34;
const DEFAULT_SIZES = "(min-width: 1280px) 200px, (min-width: 1024px) 22vw, (min-width: 640px) 30vw, 46vw";

/**
 * Accessible book card. The title link stretches over the whole card through a
 * pseudo-element, while the favorite button sits above it. There is no nested
 * interactive content and the markup stays valid.
 */
export function BookCard({ book, index = 0, eager, morph, sizes = DEFAULT_SIZES, className }: BookCardProps) {
  const href = `/books/${book.id}`;
  const title = displayTitle(book);
  const original = originalTitleIfTranslated(book);
  const authors = formatAuthors(displayAuthorList(book));
  const style = { animationDelay: `${Math.min(index, 8) * 35}ms` } as CSSProperties;

  const titleLink = (
    <Link
      href={href}
      className="outline-none after:absolute after:inset-0 after:z-[1] after:rounded-xl after:transition-shadow focus-visible:after:ring-3 focus-visible:after:ring-ring focus-visible:after:ring-inset"
    >
      {title}
    </Link>
  );

  return (
    <Card
      style={style}
      data-touch-hover-target=""
      className={cn(
        "shine-host group/book relative h-full animate-fade-up gap-0 py-0 shadow-card ring-foreground/[0.07]",
        "transition-[translate,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:shadow-card-hover",
        "focus-within:-translate-y-1 focus-within:shadow-card-hover",
        className,
      )}
    >
      <div className="relative">
        <BookCover
          bookId={book.id}
          coverId={book.coverId}
          coverEditionId={book.coverEditionId}
          title={title}
          author={authors}
          sizes={sizes}
          eager={eager}
          shine
          morphName={morph ? `cover-${book.id}` : undefined}
          imageClassName="group-hover/book:scale-[1.05]"
        />
        {book.ratingAverage ? (
          <span className="absolute start-2 bottom-2 z-[2] inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[0.72rem] font-bold text-white tabular-nums backdrop-blur-sm">
            <Star className="size-3 fill-gold text-gold" aria-hidden="true" />
            <span className="sr-only">امتیاز</span>
            {formatRating(book.ratingAverage)}
          </span>
        ) : null}
      </div>

      <div className="absolute end-2 top-2 z-[2]">
        <FavoriteButton book={book} />
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-3.5">
        <h3 dir="auto" className="line-clamp-2 min-h-[2.5em] text-start font-serif text-[1.02rem] leading-tight font-bold text-pretty">
          {title.length > LONG_TITLE ? (
            <Tooltip>
              <TooltipTrigger asChild>{titleLink}</TooltipTrigger>
              <TooltipContent side="top" className="max-w-64 text-center" dir="auto">
                {title}
              </TooltipContent>
            </Tooltip>
          ) : (
            titleLink
          )}
        </h3>
        {/* Original title, kept visible next to a translation; always reserves its line. */}
        <p dir="ltr" lang="en" className="mt-0.5 h-4 truncate text-right font-serif text-[0.72rem] leading-4 text-muted-foreground/80">
          {original ?? ""}
        </p>
        <p className="mt-1.5 line-clamp-1 text-start text-[0.8rem] text-muted-foreground">{authors || "نویسنده نامشخص"}</p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2 text-xs text-muted-foreground tabular-nums">
          <span>{book.firstPublishYear ? formatYear(book.firstPublishYear) : "سال نامشخص"}</span>
          {book.readers ? (
            <span className="inline-flex items-center gap-1" title="خوانندگان در Open Library">
              <Users className="size-3.5" aria-hidden="true" />
              <span className="sr-only">خوانندگان:</span>
              {formatCompact(book.readers)}
            </span>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
