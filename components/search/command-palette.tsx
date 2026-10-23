"use client";

import { ArrowLeft, Compass, Heart, Loader2, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { BookCover } from "@/components/books/book-cover";
import { SUBJECT_ICONS } from "@/components/home/subject-icons";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { fetchSearch } from "@/hooks/use-book-search";
import { displayTitle } from "@/lib/books";
import { SUBJECTS } from "@/lib/constants";
import { displayAuthorList, formatAuthors, formatYear, originalTitleIfTranslated } from "@/lib/format";
import { discoverHref, sanitizeQuery } from "@/lib/search-params";
import type { BookSummary } from "@/types/book";

const DEBOUNCE_MS = 350;

type Status = "idle" | "loading" | "done" | "error";

/**
 * Dialog part of the quick search. Loaded on demand (see command-search.tsx)
 * so cmdk and the dialog code are not part of every page's initial JavaScript.
 */
export default function CommandPalette({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [results, setResults] = useState<BookSummary[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  // Controlled selection: when results arrive, highlight the first book so Enter opens it.
  const [selected, setSelected] = useState("");
  const timer = useRef<number | undefined>(undefined);
  const controller = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      controller.current?.abort();
    },
    [],
  );

  function search(value: string) {
    setText(value);
    window.clearTimeout(timer.current);
    controller.current?.abort();
    const q = sanitizeQuery(value);
    if (q.length < 2) {
      setResults([]);
      setStatus("idle");
      return;
    }
    setStatus("loading");
    timer.current = window.setTimeout(() => {
      const ac = new AbortController();
      controller.current = ac;
      fetchSearch(`/api/search?q=${encodeURIComponent(q)}&size=12`, ac.signal)
        .then((data) => {
          const books = data.books.slice(0, 7);
          setResults(books);
          setSelected(books[0]?.id ?? "__all");
          setStatus("done");
        })
        .catch(() => {
          if (!ac.signal.aborted) setStatus("error");
        });
    }, DEBOUNCE_MS);
  }

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  const q = sanitizeQuery(text);

  return (
    <>
      <CommandDialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) search("");
        }}
        title="جستجوی سریع کتاب"
        description="نام کتاب یا نویسنده را بنویسید؛ با کلیدهای جهت بین نتایج حرکت کنید."
        className="sm:max-w-xl"
      >
        {/* Results come from the server, so cmdk's own filtering is turned off. */}
        <Command shouldFilter={false} value={selected} onValueChange={setSelected} className="rounded-none!">
          <CommandInput placeholder="نام کتاب یا نویسنده… (فارسی یا انگلیسی)" value={text} onValueChange={search} />
          <CommandList>
            {status === "loading" ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground" role="status">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                در حال جستجو…
              </div>
            ) : null}
            {status === "error" ? (
              <p className="py-8 text-center text-sm text-destructive" role="alert">
                جستجو ناموفق بود. دوباره تلاش کنید.
              </p>
            ) : null}
            {status === "done" && results.length === 0 ? <CommandEmpty>کتابی پیدا نشد.</CommandEmpty> : null}

            {results.length > 0 && status !== "loading" ? (
              <CommandGroup heading="کتاب‌ها">
                {results.map((book) => {
                  const title = displayTitle(book);
                  const original = originalTitleIfTranslated(book);
                  return (
                    <CommandItem key={book.id} value={book.id} onSelect={() => go(`/books/${book.id}`)} className="gap-3 py-2">
                      <span className="w-9 shrink-0 overflow-hidden rounded-sm shadow-sm">
                        <BookCover bookId={book.id} coverId={book.coverId} coverEditionId={book.coverEditionId} title={title} sizes="40px" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-bold">{title}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {original ? (
                            <bdi dir="ltr" className="font-serif">
                              {original}
                            </bdi>
                          ) : null}
                          {original ? " · " : null}
                          {formatAuthors(displayAuthorList(book), 1)}
                          {book.firstPublishYear ? ` · ${formatYear(book.firstPublishYear)}` : null}
                        </span>
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ) : null}

            {q.length >= 2 ? (
              <CommandGroup>
                <CommandItem value="__all" onSelect={() => go(discoverHref({ q }))}>
                  <Search />
                  همه نتایج برای «{q}»
                  <ArrowLeft className="ms-auto" />
                </CommandItem>
              </CommandGroup>
            ) : (
              <>
                <CommandGroup heading="موضوعات">
                  {SUBJECTS.map((s) => {
                    const Icon = SUBJECT_ICONS[s.key];
                    return (
                      <CommandItem key={s.key} value={s.key} onSelect={() => go(discoverHref({ subjects: [s.key], sort: "popular" }))}>
                        <Icon />
                        {s.label}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="صفحه‌ها">
                  <CommandItem value="__discover" onSelect={() => go("/discover")}>
                    <Compass />
                    کشف کتاب‌ها
                  </CommandItem>
                  <CommandItem value="__favorites" onSelect={() => go("/favorites")}>
                    <Heart />
                    علاقه‌مندی‌ها
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
