"use client";

import { Search } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

// Kept out of every page's initial bundle, then fetched while the browser is idle
// so the first Ctrl+K does not wait for the download.
const loadPalette = () => import("@/components/search/command-palette");
const CommandPalette = dynamic(loadPalette, { ssr: false });

/** ⌘K / Ctrl+K quick search with live results from Open Library. */
export function CommandSearch() {
  const [open, setOpen] = useState(false);
  const [requested, setRequested] = useState(false);

  function show() {
    setRequested(true);
    setOpen(true);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing = target?.closest("input, textarea, [contenteditable=true]");
      if ((event.key === "k" || event.key === "K") && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setRequested(true);
        setOpen((o) => !o);
      } else if (event.key === "/" && !typing) {
        event.preventDefault();
        setRequested(true);
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    const idle = window.requestIdleCallback?.(() => void loadPalette(), { timeout: 4000 });
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (idle !== undefined) window.cancelIdleCallback(idle);
    };
  }, []);

  return (
    <>
      <Button
        variant="outline"
        onClick={show}
        className="hidden h-9 w-56 justify-between rounded-full bg-card/70 px-3 text-muted-foreground shadow-none lg:flex"
        aria-label="جستجوی سریع"
        aria-keyshortcuts="Control+K"
      >
        <span className="flex items-center gap-2">
          <Search className="size-4" aria-hidden="true" />
          جستجوی سریع…
        </span>
        <kbd dir="ltr" className="rounded border bg-muted px-1.5 font-mono text-[0.65rem] text-muted-foreground">
          Ctrl K
        </kbd>
      </Button>
      <Button variant="ghost" size="icon" onClick={show} aria-label="جستجوی سریع" className="lg:hidden">
        <Search className="size-[1.15rem]" />
      </Button>
      {requested ? <CommandPalette open={open} setOpen={setOpen} /> : null}
    </>
  );
}
