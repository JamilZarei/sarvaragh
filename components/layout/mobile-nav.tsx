"use client";

import { BookOpen, ChevronDown, Compass, Heart, Home, Info, LayoutGrid, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Logo } from "@/components/layout/logo";
import { SUBJECT_ICONS } from "@/components/home/subject-icons";
import { CATEGORIES_LABEL, isActivePath, NAV_ITEMS } from "@/components/layout/nav-links";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { OPEN_LIBRARY_URL, SUBJECTS } from "@/lib/constants";
import { discoverHref } from "@/lib/search-params";
import { cn } from "@/lib/utils";

const ICONS = { "/": Home, "/discover": Compass, "/favorites": Heart, "/about": Info } as const;

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [subjectsOpen, setSubjectsOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="باز کردن منو">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[85%] max-w-xs gap-0 overflow-y-auto">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="sr-only">منوی اصلی</SheetTitle>
          <SheetDescription className="sr-only">پیمایش بین بخش‌های سرورق</SheetDescription>
          <Logo className="self-start" />
        </SheetHeader>
        <nav aria-label="منوی موبایل" className="flex flex-col gap-1 p-3">
          {NAV_ITEMS.map((item) => {
            const Icon = ICONS[item.href];
            const active = isActivePath(pathname, item.href);
            return [
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-12 items-center gap-3 rounded-lg px-3 text-base font-medium transition-colors duration-200 hover:bg-muted",
                  active && "bg-accent text-accent-foreground hover:bg-accent",
                )}
              >
                <Icon className="size-5 opacity-80" />
                {item.label}
              </Link>,
              item.href === "/" ? (
                <div key="subjects">
                  <button
                    type="button"
                    aria-expanded={subjectsOpen}
                    aria-controls="mobile-subjects"
                    onClick={() => setSubjectsOpen((o) => !o)}
                    className="flex h-12 w-full items-center gap-3 rounded-lg px-3 text-base font-medium transition-colors duration-200 hover:bg-muted"
                  >
                    <LayoutGrid className="size-5 opacity-80" />
                    {CATEGORIES_LABEL}
                    <ChevronDown
                      aria-hidden="true"
                      className={cn("ms-auto size-4 transition-transform duration-200", subjectsOpen && "rotate-180")}
                    />
                  </button>
                  {/* Grid-rows trick animates the height without measuring it. */}
                  <div
                    id="mobile-subjects"
                    className={cn(
                      "grid transition-[grid-template-rows,opacity,visibility] duration-300 ease-out",
                      subjectsOpen ? "visible grid-rows-[1fr] opacity-100" : "invisible grid-rows-[0fr] opacity-0",
                    )}
                    inert={!subjectsOpen}
                  >
                    <ul className="grid min-h-0 grid-cols-2 gap-1 overflow-hidden ps-3">
                      {SUBJECTS.map((subject) => {
                        const SubjectIcon = SUBJECT_ICONS[subject.key];
                        return (
                          <li key={subject.key}>
                            <Link
                              href={discoverHref({ subjects: [subject.key], sort: "popular" })}
                              onClick={() => setOpen(false)}
                              className="flex min-h-10 items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                              <SubjectIcon className="size-4 shrink-0 text-primary" aria-hidden="true" />
                              {subject.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              ) : null,
            ];
          })}
        </nav>
        <Separator className="mx-3 w-auto" />
        <a
          href={OPEN_LIBRARY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="m-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <BookOpen className="size-4" />
          داده‌ها از Open Library
        </a>
      </SheetContent>
    </Sheet>
  );
}

export function MobileNavFallback() {
  return (
    <Button variant="ghost" size="icon" className="md:hidden" aria-label="باز کردن منو" disabled>
      <Menu className="size-5" />
    </Button>
  );
}
