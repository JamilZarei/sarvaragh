import { BookCopy, Users } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";

import { BookCover } from "@/components/books/book-cover";
import { RatingSummary } from "@/components/books/rating";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { displayTitle } from "@/lib/books";
import {
  displayAuthorList,
  formatAuthors,
  formatCompact,
  formatNumber,
  formatYear,
  originalTitleIfTranslated,
} from "@/lib/format";
import type { BookSummary } from "@/types/book";

/** Wide row for the list view: more metadata at a glance. */
export function BookListItem({ book, index = 0, morph }: { book: BookSummary; index?: number; morph?: boolean }) {
  const title = displayTitle(book);
  const original = originalTitleIfTranslated(book);
  const authors = formatAuthors(displayAuthorList(book), 3);

  return (
    <Card
      style={{ animationDelay: `${Math.min(index, 8) * 35}ms` } as CSSProperties}
      data-touch-hover-target=""
      className="shine-host group/book relative animate-fade-up flex-row gap-4 p-3 shadow-card ring-foreground/[0.07] transition-[translate,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-card-hover focus-within:shadow-card-hover sm:gap-5 sm:p-4"
    >
      <div className="w-20 shrink-0 overflow-hidden rounded-md shadow-book sm:w-24">
        <BookCover
          bookId={book.id}
          coverId={book.coverId}
          coverEditionId={book.coverEditionId}
          title={title}
          author={authors}
          sizes="96px"
          shine
          morphName={morph ? `cover-${book.id}` : undefined}
          imageClassName="group-hover/book:scale-[1.05]"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <h3 dir="auto" className="pe-10 text-start font-serif text-lg leading-snug font-bold">
          <Link
            href={`/books/${book.id}`}
            className="outline-none after:absolute after:inset-0 after:z-[1] after:rounded-xl focus-visible:after:ring-3 focus-visible:after:ring-ring focus-visible:after:ring-inset"
          >
            {title}
          </Link>
        </h3>
        {original ? (
          <p dir="ltr" lang="en" className="truncate text-right font-serif text-sm text-muted-foreground">
            {original}
          </p>
        ) : null}
        <p className="text-sm text-muted-foreground">{authors || "نویسنده نامشخص"}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground tabular-nums">
          {book.firstPublishYear ? <span>نخستین انتشار: {formatYear(book.firstPublishYear)}</span> : null}
          {book.ratingAverage ? <RatingSummary value={book.ratingAverage} count={book.ratingCount} /> : null}
          {book.readers ? (
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5" aria-hidden="true" />
              {formatCompact(book.readers)} خواننده
            </span>
          ) : null}
          {book.editionCount ? (
            <span className="inline-flex items-center gap-1">
              <BookCopy className="size-3.5" aria-hidden="true" />
              {formatNumber(book.editionCount)} ویرایش
            </span>
          ) : null}
        </div>
        {book.subjectsFa.length ? (
          <ul className="mt-1 flex flex-wrap gap-1.5" aria-label="موضوعات">
            {book.subjectsFa.map((s) => (
              <li key={s}>
                <Badge variant="secondary" className="font-normal">
                  {s}
                </Badge>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div className="absolute end-3 top-3 z-[2]">
        <FavoriteButton book={book} />
      </div>
    </Card>
  );
}
