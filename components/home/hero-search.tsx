import { Search } from "lucide-react";
import Form from "next/form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MAX_QUERY_LENGTH } from "@/lib/constants";

/**
 * Progressive-enhancement search: a plain GET form to /discover.
 * next/form adds client-side navigation and prefetching once JS is ready.
 */
export function HeroSearch() {
  return (
    <Form action="/discover" role="search" aria-label="جستجوی کتاب" className="group/search relative w-full max-w-xl">
      <label htmlFor="hero-search" className="sr-only">
        جستجو در میان کتاب‌ها
      </label>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground transition-colors duration-200 group-focus-within/search:text-primary"
      />
      <Input
        id="hero-search"
        name="q"
        type="search"
        required
        maxLength={MAX_QUERY_LENGTH}
        autoComplete="off"
        enterKeyHint="search"
        placeholder="عنوان کتاب، نام نویسنده یا موضوع…"
        className="h-14 rounded-2xl border-transparent bg-card ps-12 pe-32 text-base text-foreground shadow-lg shadow-black/20 transition-[box-shadow,border-color] duration-200 placeholder:text-muted-foreground/80 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/30 md:text-base dark:bg-card"
      />
      <Button type="submit" size="lg" className="absolute end-2 top-1/2 h-10 -translate-y-1/2 rounded-xl px-5">
        جستجو
      </Button>
    </Form>
  );
}
