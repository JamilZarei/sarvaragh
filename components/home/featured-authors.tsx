import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { getFeaturedAuthors } from "@/lib/book-service";
import { authorPhotoSrc } from "@/lib/cover-url";
import { discoverHref } from "@/lib/search-params";

function initials(name: string) {
  return name.trim().split(/\s+/).at(-1)?.[0] ?? "؟";
}

/** Authors of the most-read books that have a photo (shipped in /public/authors). */
export async function FeaturedAuthors() {
  const authors = await getFeaturedAuthors();
  if (authors.length === 0) return null;

  return (
    <ScrollArea dir="rtl" className="-mx-4 sm:mx-0">
      <ul className="flex gap-3 px-4 pt-2 pb-5 sm:gap-4 sm:px-0">
        {authors.map((author, i) => {
          const name = author.nameFa || author.name;
          const photo = authorPhotoSrc(author.photoId);
          return (
            <li key={author.id} className="animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
              <Link
                href={discoverHref({ q: author.name, field: "author", sort: "popular" })}
                data-touch-hover-target=""
                className="group/author flex w-32 flex-col items-center gap-2 rounded-2xl border bg-card px-3 py-4 text-center shadow-card transition-[translate,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-card-hover sm:w-36"
              >
                <Avatar className="size-20 ring-2 ring-gold/30 ring-offset-2 ring-offset-card transition-[box-shadow] duration-300 group-hover/author:ring-gold">
                  {photo ? <AvatarImage src={photo} alt="" className="object-cover" loading="lazy" /> : null}
                  <AvatarFallback className="bg-accent text-2xl font-bold text-accent-foreground">{initials(name)}</AvatarFallback>
                </Avatar>
                <span className="line-clamp-2 min-h-[2.6em] text-[0.95rem] leading-snug font-bold">{name}</span>
                <span className="line-clamp-1 text-xs text-muted-foreground">
                  {author.bookTitleFa || author.bookTitle}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

export function FeaturedAuthorsSkeleton() {
  return (
    <div aria-hidden="true" className="flex gap-4 overflow-hidden pt-2 pb-5">
      {Array.from({ length: 8 }, (_, i) => (
        <Skeleton key={i} className="h-48 w-36 shrink-0 rounded-2xl" />
      ))}
    </div>
  );
}
