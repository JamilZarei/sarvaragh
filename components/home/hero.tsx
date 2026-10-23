import { Sparkles } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { BookCover } from "@/components/books/book-cover";
import { HeroSearch } from "@/components/home/hero-search";
import { getHomeShelves } from "@/lib/book-service";
import { displayTitle } from "@/lib/books";
import { SUBJECTS } from "@/lib/constants";
import { discoverHref } from "@/lib/search-params";
import { cn } from "@/lib/utils";
import type { BookSummary } from "@/types/book";

const QUICK_SUBJECTS = SUBJECTS.filter((s) =>
  (["fiction", "philosophy", "psychology", "history", "science"] as string[]).includes(s.key),
);

const stagger = (i: number) => ({ animationDelay: `${80 + i * 90}ms` });

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="container-page pt-4 sm:pt-6">
      <div className="relative isolate overflow-hidden rounded-[2rem] bg-hero text-hero-foreground dark:ring-1 dark:ring-white/[0.06]">
        {/* Two soft, static light sources: a warm reading lamp and a green glow. */}
        <div
          aria-hidden="true"
          className="absolute -top-48 start-[-12%] -z-10 size-[46rem] rounded-full bg-[radial-gradient(closest-side,rgb(214_170_98/0.24),transparent)]"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-56 end-[-8%] -z-10 size-[40rem] rounded-full bg-[radial-gradient(closest-side,rgb(40_92_73/0.45),transparent)]"
        />

        <div className="grid items-center lg:grid-cols-[1.1fr_1fr]">
          <div className="px-5 py-12 sm:px-10 sm:py-16 lg:py-20 lg:ps-14 lg:pe-4">
            <p
              className="mb-5 inline-flex animate-fade-up items-center gap-2 rounded-full border border-hero-foreground/15 bg-hero-foreground/5 px-3.5 py-1.5 text-sm text-hero-muted"
              style={stagger(0)}
            >
              <Sparkles className="size-3.5 text-gold" aria-hidden="true" />
              کتابخانه دیجیتال کتاب‌گرد
            </p>
            <h1
              id="hero-title"
              className="animate-fade-up text-[2.6rem] leading-[1.3] font-bold tracking-tight text-balance sm:text-6xl sm:leading-[1.25]"
              style={stagger(1)}
            >
              داستان بعدی‌ات
              <br />
              از اینجا{" "}
              <span className="relative inline-block text-gold">
                شروع می‌شود
                <svg
                  aria-hidden="true"
                  viewBox="0 0 200 12"
                  preserveAspectRatio="none"
                  className="absolute inset-x-0 -bottom-1 h-3 w-full text-gold/60"
                >
                  <path d="M2 9C50 3 150 3 198 8" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </span>
            </h1>
            <p className="mt-6 max-w-lg animate-fade-up text-lg leading-9 text-pretty text-hero-muted sm:text-xl" style={stagger(2)}>
              میان میلیون‌ها کتاب جستجو کن، نویسنده‌های تازه پیدا کن و کتاب‌هایی را که دوست داری برای بعد نگه دار.
              عنوان‌ها و معرفی کتاب‌ها به فارسی نمایش داده می‌شوند.
            </p>

            <div className="mt-8 animate-fade-up" style={stagger(3)}>
              <HeroSearch />
            </div>

            <div className="mt-5 flex animate-fade-up flex-wrap items-center gap-2" style={stagger(4)}>
              <span className="text-sm text-hero-muted">پیشنهاد:</span>
              {QUICK_SUBJECTS.map((subject) => (
                <Link
                  key={subject.key}
                  href={discoverHref({ subjects: [subject.key], sort: "popular" })}
                  className="rounded-full border border-hero-foreground/15 bg-hero-foreground/5 px-4 py-1.5 text-[0.95rem] text-hero-foreground/90 transition-[background-color,border-color,translate] duration-200 hover:-translate-y-0.5 hover:border-gold/50 hover:bg-hero-foreground/10"
                >
                  {subject.label}
                </Link>
              ))}
            </div>
          </div>

          <Suspense fallback={<CoverWallFallback />}>
            <CoverWall />
          </Suspense>
        </div>
      </div>
    </section>
  );
}

const WALL_CLASS =
  "grid h-[24rem] grid-cols-3 gap-3 overflow-hidden px-4 pb-6 [mask-image:linear-gradient(to_bottom,transparent,black_14%,black_86%,transparent)] sm:h-[30rem] sm:gap-4 sm:px-10 lg:h-[34rem] lg:px-8 lg:pb-0";
const COLUMN_CLASS = "flex flex-col gap-3 sm:gap-4";
const OFFSET_CLASS = "-mt-16 sm:-mt-24";

function WallCover({ book, eager, className }: { book: BookSummary; eager?: boolean; className?: string }) {
  return (
    <Link
      href={`/books/${book.id}`}
      tabIndex={-1}
      className={cn(
        "shine-host block overflow-hidden rounded-lg shadow-book ring-1 ring-white/10 transition-[scale,box-shadow] duration-300 hover:scale-[1.04] hover:ring-gold/60",
        className,
      )}
    >
      <BookCover bookId={book.id} coverId={book.coverId} coverEditionId={book.coverEditionId} title={displayTitle(book)} sizes="(min-width: 1024px) 150px, 34vw" shine eager={eager} />
    </Link>
  );
}

/**
 * Decorative, slowly scrolling wall of real covers (most-read books). It is
 * hidden from assistive technology; the same books are listed accessibly in the
 * shelves below. Pauses on hover and stops under prefers-reduced-motion.
 */
async function CoverWall() {
  const shelves = await getHomeShelves();
  const seen = new Set<string>();
  const books = shelves
    .flatMap((s) => s.books)
    .filter((b) => b.coverId !== null && !seen.has(b.id) && seen.add(b.id))
    .slice(0, 18);
  if (books.length < 9) return <CoverWallFallback />;

  const columns = [0, 1, 2].map((c) => books.filter((_, i) => i % 3 === c));
  const animations = ["animate-marquee-up", "animate-marquee-down", "animate-marquee-up [animation-duration:62s]"];

  return (
    // The same three vertical columns on every screen size, scaled down on small ones.
    <div aria-hidden="true" className={cn(WALL_CLASS, "marquee relative")}>
      {columns.map((column, c) => (
        <div key={c} className={cn(COLUMN_CLASS, animations[c], c === 1 && OFFSET_CLASS)}>
          {[...column, ...column].map((book, i) => (
            <WallCover key={`${book.id}-${i}`} book={book} eager />
          ))}
        </div>
      ))}
    </div>
  );
}

function CoverWallFallback() {
  return (
    <div aria-hidden="true" className={WALL_CLASS}>
      {[0, 1, 2].map((c) => (
        <div key={c} className={cn(COLUMN_CLASS, c === 1 && OFFSET_CLASS)}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="aspect-[2/3] rounded-lg bg-hero-foreground/[0.06] ring-1 ring-hero-foreground/10" />
          ))}
        </div>
      ))}
    </div>
  );
}
