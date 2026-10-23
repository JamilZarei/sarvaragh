"use client";

import { Loader2, Search, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MAX_QUERY_LENGTH, SEARCH_FIELDS, type SearchField } from "@/lib/constants";
import { sanitizeQuery } from "@/lib/search-params";
import { cn } from "@/lib/utils";

const DEBOUNCE_MS = 450;

type BookSearchProps = {
  value: string;
  field: SearchField;
  busy?: boolean;
  onSearch: (q: string, options: { immediate: boolean }) => void;
  onFieldChange: (field: SearchField) => void;
  className?: string;
};

const PLACEHOLDERS: Record<SearchField, string> = {
  all: "عنوان، نویسنده یا موضوع (فارسی یا انگلیسی)…",
  title: "عنوان کتاب را بنویسید…",
  author: "نام نویسنده را بنویسید…",
};

/**
 * Debounced search box. Local text is kept separately from the URL value so
 * typing is never interrupted by the (async) URL update it triggers.
 */
export function BookSearch({ value, field, busy, onSearch, onFieldChange, className }: BookSearchProps) {
  const [text, setText] = useState(value);
  const [syncedValue, setSyncedValue] = useState(value);
  const [pending, setPending] = useState<string | null>(null);

  // Adopt external URL changes (back button, "clear all") unless they are our own echo.
  if (value !== syncedValue) {
    setSyncedValue(value);
    if (value !== pending) setText(value);
  }

  // Debounce lives in the event handler: each keystroke restarts the timer.
  const timer = useRef<number | undefined>(undefined);
  // The timer fires after later renders; always use the latest props so a filter
  // changed meanwhile is not overwritten by a stale query.
  const latest = useRef({ value, onSearch });
  useEffect(() => {
    latest.current = { value, onSearch };
  });
  useEffect(() => () => window.clearTimeout(timer.current), []);

  function commit(raw: string, immediate: boolean) {
    window.clearTimeout(timer.current);
    const q = sanitizeQuery(raw);
    if (!immediate && q === latest.current.value) return;
    setPending(q);
    latest.current.onSearch(q, { immediate });
  }

  function handleChange(next: string) {
    setText(next);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => commit(next, false), DEBOUNCE_MS);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    commit(text, true);
  }

  function clear() {
    setText("");
    commit("", true);
  }

  return (
    <form role="search" onSubmit={handleSubmit} className={cn("group/search flex w-full gap-2", className)}>
      <div className="relative flex-1">
        <label htmlFor="discover-search" className="sr-only">
          جستجوی کتاب
        </label>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute start-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground transition-colors duration-200 group-focus-within/search:text-primary"
        />
        <Input
          id="discover-search"
          type="search"
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          maxLength={MAX_QUERY_LENGTH}
          autoComplete="off"
          enterKeyHint="search"
          placeholder={PLACEHOLDERS[field]}
          className="h-12 rounded-xl bg-card ps-11 pe-11 text-base shadow-card transition-[box-shadow,border-color] duration-200 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/20 md:text-base [&::-webkit-search-cancel-button]:hidden"
        />
        <div className="absolute end-1.5 top-1/2 flex -translate-y-1/2 items-center">
          {busy ? (
            <Loader2 className="me-2 size-4 animate-spin text-muted-foreground" aria-label="در حال جستجو" />
          ) : text ? (
            <Button type="button" variant="ghost" size="icon-sm" onClick={clear} aria-label="پاک کردن جستجو">
              <X />
            </Button>
          ) : null}
        </div>
      </div>
      <Select value={field} onValueChange={(v) => onFieldChange(v as SearchField)}>
        <SelectTrigger aria-label="جستجو بر اساس" className="h-12! w-28 shrink-0 rounded-xl bg-card shadow-card sm:w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" align="end">
          {SEARCH_FIELDS.map((f) => (
            <SelectItem key={f.key} value={f.key}>
              {f.key === "all" ? "همه فیلدها" : `فقط ${f.label}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </form>
  );
}
