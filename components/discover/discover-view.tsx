"use client";

import { Info, LayoutGrid, Languages, List, SearchX, SlidersHorizontal, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { ActiveFilters } from "@/components/books/active-filters";
import { rememberLastSearch } from "@/components/books/back-to-results";
import { BookFilters } from "@/components/books/book-filters";
import { BookResults } from "@/components/books/book-grid";
import { BookPagination } from "@/components/books/book-pagination";
import { BookSearch } from "@/components/books/book-search";
import { BookGridSkeleton } from "@/components/books/book-skeleton";
import { BookSort } from "@/components/books/book-sort";
import { EmptyState } from "@/components/books/empty-state";
import { ErrorState } from "@/components/books/error-state";
import { ShareMenu } from "@/components/books/share-menu";
import { SUBJECT_ICONS } from "@/components/home/subject-icons";
import { CountUp } from "@/components/motion/count-up";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useBookSearch } from "@/hooks/use-book-search";
import { useDiscoverQuery } from "@/hooks/use-discover-query";
import { sortBooks } from "@/lib/books";
import { getSortOption, MAX_PAGE, PAGE_SIZE, SUBJECTS, type ViewMode } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import {
  countActiveFilters,
  DEFAULT_QUERY,
  discoverHref,
  hasSearchCriteria,
  serializeDiscoverQuery,
  type DiscoverQuery,
} from "@/lib/search-params";

const SAMPLE_SEARCHES = [
  { label: "تلماسه", q: "Dune", field: "title" },
  { label: "یووال نوح هراری", q: "Yuval Noah Harari", field: "author" },
  { label: "مولانا", q: "Rumi", field: "author" },
  { label: "شازده کوچولو", q: "Le Petit Prince", field: "title" },
  { label: "داستایفسکی", q: "Dostoyevsky", field: "author" },
] as const;

function searchApiUrl(query: DiscoverQuery): string | null {
  if (!hasSearchCriteria(query)) return null;
  // Title sorts happen on the loaded page, so the request itself is a relevance query.
  const sort = getSortOption(query.sort).clientSide ? "relevance" : query.sort;
  // The view mode is presentation only and must not split the cache.
  return `/api/search?${serializeDiscoverQuery({ ...query, sort, view: "grid" }).toString()}`;
}

export function DiscoverView() {
  const { query, update, hrefFor } = useDiscoverQuery();
  const apiUrl = searchApiUrl(query);

  const serialized = serializeDiscoverQuery(query).toString();
  useEffect(() => {
    rememberLastSearch(serialized ? `?${serialized}` : "");
  }, [serialized]);
  const { state, retry } = useBookSearch(apiUrl);
  const activeCount = countActiveFilters(query);
  const sortOption = getSortOption(query.sort);

  const clearFilters = () => update({ subjects: [], languages: [], yearFrom: null, yearTo: null, popularity: 0 });

  const total = state.status === "success" ? state.data.total : null;
  const totalPages = total === null ? 0 : Math.min(Math.ceil(total / PAGE_SIZE), MAX_PAGE);
  const books =
    state.status === "success" ? (sortOption.clientSide ? sortBooks(state.data.books, query.sort) : state.data.books) : [];

  const filtersPanel = (idPrefix: string) => (
    <BookFilters idPrefix={idPrefix} query={query} onChange={(patch) => update(patch)} />
  );

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[16.5rem_minmax(0,1fr)] xl:gap-10">
      {/* Desktop filters */}
      <aside aria-label="فیلترها" className="sticky top-24 hidden lg:block">
        <Card className="gap-0 py-0 shadow-card ring-foreground/[0.07]">
          <div className="flex items-center justify-between border-b px-5 py-3.5">
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <SlidersHorizontal className="size-4 text-muted-foreground" aria-hidden="true" />
              فیلترها
              {activeCount > 0 ? (
                <Badge className="h-5 min-w-5 px-1.5 tabular-nums">{formatNumber(activeCount)}</Badge>
              ) : null}
            </h2>
            {activeCount > 0 ? (
              <Button variant="link" size="sm" className="h-auto px-0 text-muted-foreground" onClick={clearFilters}>
                پاک کردن
              </Button>
            ) : null}
          </div>
          {/* A native scroller: Radix ScrollArea does not scroll when only max-height is set, which cut the panel off. */}
          <div className="thin-scrollbar max-h-[calc(100dvh-10rem)] overflow-y-auto overscroll-contain px-5 py-5">
            {filtersPanel("desktop")}
          </div>
        </Card>
      </aside>

      <section aria-labelledby="results-title" className="min-w-0">
        <h2 id="results-title" className="sr-only">
          نتایج جستجو
        </h2>

        <BookSearch
          value={query.q}
          field={query.field}
          busy={state.status === "loading"}
          onSearch={(q, { immediate }) => update({ q }, { replace: !immediate })}
          onFieldChange={(field) => update({ field })}
        />

        {/* Toolbar */}
        <div className="mt-5 flex flex-wrap items-center gap-2 sm:gap-3">
          <p className="me-auto text-sm text-muted-foreground" aria-live="polite" aria-atomic="true">
            {state.status === "success" ? (
              <>
                <CountUp value={state.data.total} className="font-bold text-foreground tabular-nums" /> کتاب یافت شد
                {totalPages > 1 ? (
                  <span className="text-muted-foreground">
                    {" "}
                    · صفحه {formatNumber(query.page)} از {formatNumber(totalPages)}
                  </span>
                ) : null}
              </>
            ) : state.status === "loading" ? (
              "در حال جستجو…"
            ) : state.status === "idle" ? (
              "جستجو یا یک فیلتر را برای شروع انتخاب کنید"
            ) : (
              "جستجو ناموفق بود"
            )}
          </p>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="bg-card lg:hidden">
                <SlidersHorizontal data-icon="inline-start" />
                فیلترها
                {activeCount > 0 ? (
                  <Badge className="ms-0.5 h-5 min-w-5 px-1.5 tabular-nums">{formatNumber(activeCount)}</Badge>
                ) : null}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[88%] max-w-sm gap-0 p-0">
              <SheetHeader className="border-b px-5 py-4">
                <SheetTitle className="text-base font-bold">فیلترها</SheetTitle>
                <SheetDescription>تغییرات بلافاصله روی نتایج اعمال می‌شوند.</SheetDescription>
              </SheetHeader>
              <ScrollArea className="min-h-0 flex-1">
                <div className="px-5 py-5">{filtersPanel("mobile")}</div>
              </ScrollArea>
              <SheetFooter className="flex-row gap-2 border-t px-5 py-4">
                <Button variant="outline" className="flex-1" onClick={clearFilters} disabled={activeCount === 0}>
                  پاک کردن همه
                </Button>
                <SheetClose asChild>
                  <Button className="flex-1">
                    {total !== null ? `نمایش ${formatNumber(total)} نتیجه` : "نمایش نتایج"}
                  </Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          <BookSort id="discover-sort" value={query.sort} onValueChange={(sort) => update({ sort })} />
          <ToggleGroup
            type="single"
            variant="outline"
            value={query.view}
            onValueChange={(v) => v && update({ view: v as ViewMode }, { keepPage: true, replace: true })}
            aria-label="نحوه نمایش"
            className="hidden bg-card sm:flex"
          >
            <ToggleGroupItem value="grid" aria-label="نمایش شبکه‌ای" className="size-9">
              <LayoutGrid />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="نمایش فهرستی" className="size-9">
              <List />
            </ToggleGroupItem>
          </ToggleGroup>
          <ShareMenu title="جستجو در کتاب‌گرد" />
        </div>

        <div className="mt-4 space-y-3">
          <ActiveFilters
            query={query}
            onChange={(patch) => update(patch)}
            onClearAll={clearFilters}
          />
          {sortOption.clientSide && state.status === "success" && books.length > 1 ? (
            <SortNote>
              مرتب‌سازی الفبایی فقط روی {formatNumber(books.length)} نتیجه همین صفحه اعمال شده است؛ Open Library مرتب‌سازی
              کامل بر اساس عنوان را پشتیبانی نمی‌کند.
            </SortNote>
          ) : null}
          {sortOption.note && state.status === "success" ? <SortNote>{sortOption.note}</SortNote> : null}
          {state.status === "success" && state.data.searchedAs ? (
            <p className="flex animate-fade-in items-start gap-2 text-sm leading-7 text-muted-foreground">
              <Languages className="mt-1.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <span>
                عبارت فارسی شما برای جستجو در کاتالوگ به «
                <bdi dir="ltr" className="font-serif font-medium text-foreground">
                  {state.data.searchedAs}
                </bdi>
                » ترجمه شد.
              </span>
            </p>
          ) : null}
        </div>

        <div className="mt-6">
          {state.status === "idle" ? (
            <StarterState />
          ) : state.status === "loading" ? (
            <BookGridSkeleton count={10} />
          ) : state.status === "error" ? (
            <ErrorState error={state.error} onRetry={retry} />
          ) : books.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="کتابی با این مشخصات پیدا نشد"
              description="عبارت دیگری را امتحان کنید، جستجو را به «همه فیلدها» تغییر دهید یا برخی فیلترها را بردارید. گاهی Open Library به‌دلیل شلوغی نتیجه خالی برمی‌گرداند؛ تلاش دوباره هم کمک می‌کند."
            >
              {activeCount > 0 ? (
                <Button variant="outline" onClick={clearFilters}>
                  حذف فیلترها
                </Button>
              ) : null}
              <Button variant="ghost" onClick={retry}>
                تلاش دوباره
              </Button>
            </EmptyState>
          ) : (
            <>
              <BookResults key={`${apiUrl}|${query.view}`} books={books} view={query.view} morph label="نتایج جستجو" />
              <BookPagination
                page={query.page}
                totalPages={totalPages}
                hrefFor={(page) => hrefFor({ page })}
              />
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function SortNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex animate-fade-in items-start gap-2 text-xs leading-6 text-muted-foreground">
      <Info className="mt-1 size-3.5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

function StarterState() {
  return (
    <div className="animate-fade-up rounded-2xl border border-dashed bg-card/50 px-5 py-10 sm:px-10 sm:py-14">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-accent text-accent-foreground">
          <Sparkles className="size-6" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-bold">از کجا شروع کنیم؟</h2>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          عبارتی را جستجو کنید یا یکی از موضوع‌ها را انتخاب کنید. نتایج مستقیماً از کاتالوگ Open Library دریافت می‌شوند.
        </p>
      </div>
      <ul className="mx-auto mt-8 grid max-w-2xl grid-cols-2 gap-2 sm:grid-cols-4">
        {SUBJECTS.map((s) => {
          const Icon = SUBJECT_ICONS[s.key];
          return (
            <li key={s.key}>
              <Link
                href={discoverHref({ subjects: [s.key], sort: "popular" })}
                className="flex h-full items-center gap-2 rounded-xl border bg-card px-3 py-2.5 text-sm transition-colors duration-200 hover:border-primary/40 hover:bg-accent"
              >
                <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
                {s.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mx-auto mt-6 flex max-w-2xl flex-wrap items-center justify-center gap-2 text-sm">
        <span className="text-muted-foreground">نمونه جستجو:</span>
        {SAMPLE_SEARCHES.map((s) => (
          <Link
            key={s.q}
            href={discoverHref({ ...DEFAULT_QUERY, q: s.q, field: s.field })}
            className="rounded-full bg-secondary px-3 py-1 transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {s.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
