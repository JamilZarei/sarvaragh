"use client";

import { ArrowLeft, Loader2, SearchX } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { BookGrid } from "@/components/books/book-grid";
import { BookGridSkeleton } from "@/components/books/book-skeleton";
import { BookSort } from "@/components/books/book-sort";
import { EmptyState } from "@/components/books/empty-state";
import { ERROR_MESSAGES, ErrorState } from "@/components/books/error-state";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/motion/count-up";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { fetchSearch, SearchError, useBookSearch } from "@/hooks/use-book-search";
import { sortBooks } from "@/lib/books";
import { getSortOption, MAX_PAGE, SUBJECTS, type SortKey, type SubjectKey } from "@/lib/constants";
import { DEFAULT_QUERY, discoverHref, serializeDiscoverQuery } from "@/lib/search-params";
import type { BookSummary } from "@/types/book";

const PAGE_SIZE = 12;

function apiUrl(subject: SubjectKey, sort: SortKey, page: number) {
  const params = serializeDiscoverQuery({ ...DEFAULT_QUERY, subjects: [subject], sort, page });
  params.set("size", String(PAGE_SIZE));
  return `/api/search?${params.toString()}`;
}

function mergeBooks(first: BookSummary[], more: BookSummary[], sort: SortKey): BookSummary[] {
  const seen = new Set<string>();
  const merged = [...first, ...more].filter((b) => {
    if (seen.has(b.id)) return false;
    seen.add(b.id);
    return true;
  });
  return getSortOption(sort).clientSide ? sortBooks(merged, sort) : merged;
}

/** Home-page shelf browser: one subject at a time with "load more" pagination. */
export function HomeExplore() {
  const [subject, setSubject] = useState<SubjectKey>("fiction");
  const [sort, setSort] = useState<SortKey>("popular");
  const baseKey = `${subject}|${sort}`;
  const { state, retry } = useBookSearch(apiUrl(subject, sort, 1));

  // Extra pages are tied to the subject/sort they were loaded for.
  const [extra, setExtra] = useState<{ key: string; books: BookSummary[]; page: number }>({ key: "", books: [], page: 1 });
  const [loadingMore, setLoadingMore] = useState(false);
  const extraBooks = extra.key === baseKey ? extra.books : [];
  const lastPage = extra.key === baseKey ? extra.page : 1;

  const total = state.status === "success" ? state.data.total : 0;
  const books = state.status === "success" ? mergeBooks(state.data.books, extraBooks, sort) : [];

  const canLoadMore = state.status === "success" && books.length < total && lastPage < MAX_PAGE;

  async function loadMore() {
    const key = baseKey;
    const nextPage = lastPage + 1;
    setLoadingMore(true);
    try {
      const data = await fetchSearch(apiUrl(subject, sort, nextPage));
      setExtra((prev) => ({
        key,
        page: nextPage,
        books: [...(prev.key === key ? prev.books : []), ...data.books],
      }));
    } catch (error) {
      const code = error instanceof SearchError ? error.code : "network";
      toast.error(ERROR_MESSAGES[code].title, { description: ERROR_MESSAGES[code].description });
    } finally {
      setLoadingMore(false);
    }
  }

  const subjectLabel = SUBJECTS.find((s) => s.key === subject)?.label ?? "";

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <ToggleGroup
          type="single"
          value={subject}
          onValueChange={(v) => v && setSubject(v as SubjectKey)}
          aria-label="انتخاب موضوع"
          className="flex-wrap justify-start"
          spacing={2}
        >
          {SUBJECTS.map((s) => (
            <ToggleGroupItem
              key={s.key}
              value={s.key}
              className="h-10 rounded-full border bg-card px-4 text-[0.95rem] transition-[background-color,color,border-color,translate] duration-200 hover:-translate-y-0.5 data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-md"
            >
              {s.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <BookSort id="home-sort" value={sort} onValueChange={setSort} />
      </div>

      <p className="mb-5 text-sm text-muted-foreground" aria-live="polite">
        {state.status === "success" ? (
          <>
            <CountUp value={total} className="font-bold text-foreground tabular-nums" /> کتاب در موضوع «{subjectLabel}»
            {getSortOption(sort).clientSide
              ? " — مرتب‌سازی الفبایی روی کتاب‌های نمایش‌داده‌شده اعمال می‌شود."
              : getSortOption(sort).note
                ? ` — ${getSortOption(sort).note}`
                : null}
          </>
        ) : state.status === "loading" ? (
          "در حال جستجو…"
        ) : null}
      </p>

      {state.status === "loading" || state.status === "idle" ? (
        <BookGridSkeleton count={PAGE_SIZE} columns="wide" />
      ) : state.status === "error" ? (
        <ErrorState error={state.error} onRetry={retry} />
      ) : books.length === 0 ? (
        <EmptyState icon={SearchX} title="کتابی پیدا نشد" description="Open Library برای این موضوع نتیجه‌ای برنگرداند.">
          <Button variant="outline" onClick={retry}>
            تلاش دوباره
          </Button>
        </EmptyState>
      ) : (
        <>
          <BookGrid key={baseKey} books={books} columns="wide" label={`کتاب‌های موضوع ${subjectLabel}`} />
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            {canLoadMore ? (
              <Button variant="outline" size="lg" onClick={loadMore} disabled={loadingMore} className="min-w-44 bg-card">
                {loadingMore ? <Loader2 data-icon="inline-start" className="animate-spin" /> : null}
                {loadingMore ? "در حال بارگذاری…" : "نمایش بیشتر"}
              </Button>
            ) : null}
            <Button asChild variant="ghost" size="lg" className="text-primary hover:text-primary">
              <Link href={discoverHref({ subjects: [subject], sort })}>
                جستجوی پیشرفته در این موضوع
                <ArrowLeft data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
