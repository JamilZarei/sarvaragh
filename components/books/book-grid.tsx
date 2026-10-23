import { BookCard, type BookCardBook } from "@/components/books/book-card";
import { BookListItem } from "@/components/books/book-list-item";
import type { ViewMode } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { BookSummary } from "@/types/book";

export const GRID_COLUMNS = {
  default: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
  wide: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
  narrow: "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4",
} as const;

type BookGridProps = {
  books: readonly BookCardBook[];
  columns?: keyof typeof GRID_COLUMNS;
  /** Number of leading covers to load eagerly (above the fold). */
  priorityCount?: number;
  /** Enable the card → book page cover morph (ids must be unique on the page). */
  morph?: boolean;
  label?: string;
  className?: string;
};

export function BookGrid({ books, columns = "default", priorityCount = 0, morph, label, className }: BookGridProps) {
  return (
    <ul aria-label={label} className={cn("grid gap-x-3 gap-y-5 sm:gap-x-5 sm:gap-y-7", GRID_COLUMNS[columns], className)}>
      {books.map((book, index) => (
        <li key={book.id}>
          <BookCard book={book} index={index} eager={index < priorityCount} morph={morph} />
        </li>
      ))}
    </ul>
  );
}

/** Grid or list presentation of full search results. */
export function BookResults({
  books,
  view,
  morph,
  label,
}: {
  books: readonly BookSummary[];
  view: ViewMode;
  morph?: boolean;
  label?: string;
}) {
  if (view === "list") {
    return (
      <ul aria-label={label} className="grid gap-3 lg:grid-cols-2">
        {books.map((book, index) => (
          <li key={book.id}>
            <BookListItem book={book} index={index} morph={morph} />
          </li>
        ))}
      </ul>
    );
  }
  return <BookGrid books={books} priorityCount={5} morph={morph} label={label} />;
}
