"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";

export const LAST_SEARCH_KEY = "sarvaragh:last-search";

/** Remembers the last discover URL (search + filters) for "back to results". */
export function rememberLastSearch(search: string) {
  try {
    window.sessionStorage.setItem(LAST_SEARCH_KEY, search);
  } catch {
    /* storage unavailable: fall back to /discover */
  }
}

function readLastSearch(): string {
  try {
    const value = window.sessionStorage.getItem(LAST_SEARCH_KEY) ?? "";
    return value.startsWith("?") && value.length < 600 ? value : "";
  } catch {
    return "";
  }
}

const subscribeNoop = () => () => {};

export function BackToResults() {
  const search = useSyncExternalStore(subscribeNoop, readLastSearch, () => "");
  return (
    <Button asChild variant="ghost" className="-ms-3 text-muted-foreground hover:text-foreground">
      <Link href={`/discover${search}`}>
        <ArrowRight data-icon="inline-start" />
        {search ? "بازگشت به نتایج جستجو" : "بازگشت به کشف کتاب‌ها"}
      </Link>
    </Button>
  );
}
