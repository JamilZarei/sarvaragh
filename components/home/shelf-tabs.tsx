"use client";

import { Award, Flame, Library, type LucideIcon } from "lucide-react";

import { BookCarousel } from "@/components/books/book-carousel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Shelf } from "@/lib/book-service";

const ICONS: Record<Shelf["key"], LucideIcon> = {
  popular: Flame,
  "top-rated": Award,
  classics: Library,
};

/** Tabbed carousels for the home-page shelves (data is fetched and translated on the server). */
export function ShelfTabs({ shelves }: { shelves: Shelf[] }) {
  const available = shelves.filter((s) => s.books.length > 0);
  if (available.length === 0) return null;

  return (
    <Tabs defaultValue={available[0].key} className="gap-5">
      <TabsList className="h-auto! flex-wrap gap-1.5 rounded-full bg-secondary p-1.5">
        {available.map((shelf) => {
          const Icon = ICONS[shelf.key];
          return (
            <TabsTrigger
              key={shelf.key}
              value={shelf.key}
              className="h-10 flex-none rounded-full px-4 text-[0.95rem] data-active:bg-primary data-active:text-primary-foreground data-active:shadow-md dark:data-active:bg-primary dark:data-active:text-primary-foreground"
            >
              <Icon data-icon="inline-start" />
              {shelf.label}
            </TabsTrigger>
          );
        })}
      </TabsList>

      {available.map((shelf) => (
        <TabsContent key={shelf.key} value={shelf.key} className="animate-fade-in">
          <BookCarousel books={shelf.books} label={shelf.label} caption={shelf.criteria} eagerCount={6} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
